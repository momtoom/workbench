import assert from 'node:assert/strict';
import test from 'node:test';
import { createHistoryController, type HistoryLaneId } from '@domain/history/historyController';
import { createHistoryControllerStore } from '@domain/history/historyControllerStore';

const LANE_A = 'page:src/workbench-pages/A.tsx' as HistoryLaneId;
const LANE_B = 'page:src/workbench-pages/B.tsx' as HistoryLaneId;

function createStore(maxRetainedLanes?: number) {
  return createHistoryControllerStore<string>({
    createController: (laneId, initialValue) => createHistoryController<string>({
      laneId,
      initialValue,
      maxEntries: 20,
      equalsState: (left, right) => left === right,
    }),
    ...(maxRetainedLanes === undefined ? {} : { maxRetainedLanes }),
  });
}

function edit(
  store: ReturnType<typeof createStore>,
  laneId: HistoryLaneId,
  from: string,
  to: string,
) {
  const controller = store.get(laneId, from);
  controller.commit(to, {
    laneId,
    owner: { type: 'page', filePath: 'src/workbench-pages/A.tsx' },
    label: 'Set overflow source style',
    scope: 'page',
    kind: 'patch',
    affectedFiles: ['src/workbench-pages/A.tsx'],
  });
  return controller;
}

test('a lane keeps one controller, so undo survives the rebuild an edit causes', () => {
  const store = createStore();
  edit(store, LANE_A, 'a', 'b');

  // The design editor re-derives its controller from the new contents after
  // every edit. That lookup must hand back the same instance, stack intact.
  const afterRebuild = store.get(LANE_A, 'b');

  assert.equal(afterRebuild.getSnapshot().canUndo, true);
  assert.equal(afterRebuild.undo()?.before, 'a');
  assert.equal(afterRebuild.getSnapshot().value, 'a');
});

test('a lookup never reconciles, however stale the value the caller passes', () => {
  const store = createStore();
  edit(store, LANE_A, 'a', 'b');

  // The design editor's parsed tree cache still says 'a' for a moment after the
  // edit committed 'b', and the history memo re-runs on a render bump before
  // that state lands. A lookup that read its caller's lag as an outside change
  // would drop the stack and compute the next edit from 'a', which is how a
  // writeback lands on the wrong node.
  const looked = store.get(LANE_A, 'a');

  assert.equal(looked.getSnapshot().value, 'b');
  assert.equal(looked.getSnapshot().canUndo, true);
});

test('peek returns an open lane without needing a value to seed it', () => {
  const store = createStore();
  edit(store, LANE_A, 'a', 'b');

  const peeked = store.peek(LANE_A);

  assert.ok(peeked);
  assert.equal(peeked.getSnapshot().value, 'b');
  assert.equal(peeked.getSnapshot().canUndo, true);
});

test('peek reports an absent lane rather than inventing one', () => {
  const store = createStore();
  assert.equal(store.peek(LANE_A), null);
  assert.deepEqual(store.retainedLaneIds(), []);
});

test('reset discards the stack explicitly and reseats the value', () => {
  const store = createStore();
  edit(store, LANE_A, 'a', 'b');

  // Someone edited the file outside the app. Undoing to 'a' from here would
  // overwrite that change, so the caller that noticed it says so explicitly.
  const reset = store.reset(LANE_A, 'edited-elsewhere');

  assert.equal(reset.getSnapshot().value, 'edited-elsewhere');
  assert.equal(reset.getSnapshot().canUndo, false);
  assert.equal(reset.getSnapshot().isDirty, false);
});

test('reset on a lane the store never saw creates it rather than throwing', () => {
  const store = createStore();
  const controller = store.reset(LANE_B, 'fresh');

  assert.equal(controller.getSnapshot().value, 'fresh');
  assert.deepEqual(store.retainedLaneIds(), [LANE_B]);
});

test('lanes are independent', () => {
  const store = createStore();
  edit(store, LANE_A, 'a', 'b');
  edit(store, LANE_B, 'x', 'y');

  assert.equal(store.get(LANE_A, 'b').getSnapshot().canUndo, true);
  assert.equal(store.get(LANE_B, 'y').getSnapshot().canUndo, true);
  store.get(LANE_A, 'b').undo();
  assert.equal(store.get(LANE_B, 'y').getSnapshot().value, 'y');
});

test('only the most recently used lanes are retained', () => {
  const store = createStore(2);
  const laneC = 'page:src/workbench-pages/C.tsx' as HistoryLaneId;
  edit(store, LANE_A, 'a', 'b');
  edit(store, LANE_B, 'x', 'y');
  edit(store, laneC, 'm', 'n');

  assert.deepEqual(store.retainedLaneIds(), [LANE_B, laneC]);
  // The evicted lane comes back empty rather than stale.
  assert.equal(store.get(LANE_A, 'b').getSnapshot().canUndo, false);
});

test('touching a lane protects it from eviction', () => {
  const store = createStore(2);
  const laneC = 'page:src/workbench-pages/C.tsx' as HistoryLaneId;
  edit(store, LANE_A, 'a', 'b');
  edit(store, LANE_B, 'x', 'y');
  store.get(LANE_A, 'b');
  edit(store, laneC, 'm', 'n');

  assert.deepEqual(store.retainedLaneIds(), [LANE_A, laneC]);
  assert.equal(store.get(LANE_A, 'b').getSnapshot().canUndo, true, 'A kept its stack');
});

test('discard drops one lane and clear drops all of them', () => {
  const store = createStore();
  edit(store, LANE_A, 'a', 'b');
  edit(store, LANE_B, 'x', 'y');

  store.discard(LANE_A);
  assert.deepEqual(store.retainedLaneIds(), [LANE_B]);
  assert.equal(store.get(LANE_A, 'b').getSnapshot().canUndo, false);

  store.clear();
  assert.deepEqual(store.retainedLaneIds(), []);
});
