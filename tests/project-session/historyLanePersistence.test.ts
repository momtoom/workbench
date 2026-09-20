import assert from 'node:assert/strict';
import test from 'node:test';
import { createHistoryController, type EditOwner, type HistoryLaneId } from '@domain/history/historyController';
import {
  createEmptyWorkbenchHistoryFile,
  createPersistedHistoryLane,
  getHydratableHistoryLane,
  normalizeWorkbenchHistoryFile,
  upsertPersistedHistoryLane,
} from '@domain/history/historyPersistence';

const LANE_ID = 'page:src/workbench-pages/AlbumDetail.tsx' as HistoryLaneId;
const OWNER: EditOwner = { type: 'page', filePath: 'src/workbench-pages/AlbumDetail.tsx' };

function createEditedController(edits: string[]) {
  const controller = createHistoryController<string>({
    laneId: LANE_ID,
    initialValue: 'rotation={0}',
    initialSaved: true,
    maxEntries: 200,
    equalsState: (left, right) => left === right,
  });

  for (const [index, value] of edits.entries()) {
    controller.commit(value, {
      laneId: LANE_ID,
      owner: OWNER,
      label: `Set rotation component prop ${index}`,
      scope: 'page',
      kind: 'patch',
      affectedFiles: ['src/workbench-pages/AlbumDetail.tsx'],
      // No mergeKey, so nothing folds; fixed timestamps keep the file readable.
      createdAt: new Date(Date.UTC(2026, 7, 7, 0, 0, index * 5)).toISOString(),
    });
  }

  return controller;
}

test('a session-only lane writes no stacks but keeps unsaved-work recovery', () => {
  const controller = createEditedController(['rotation={5}', 'rotation={10}']);

  const lane = createPersistedHistoryLane(OWNER, controller.getSnapshot(), 200, {}, 'session-only');

  assert.equal('undoStack' in lane, false);
  assert.equal('redoStack' in lane, false);
  // These are not undo. They are how an edit that never reached disk is
  // recovered, and they have to survive a restart either way.
  assert.equal(lane.value, 'rotation={10}');
  assert.equal(lane.workingRevision, 2);
  assert.equal(lane.savedRevision, 0);
});

test('a persist lane still writes its stacks, bounded by maxEntries', () => {
  const controller = createEditedController(['a', 'b', 'c', 'd']);
  controller.undo();

  const lane = createPersistedHistoryLane(OWNER, controller.getSnapshot(), 2, {}, 'persist');

  assert.deepEqual(lane.undoStack?.map((transaction) => transaction.after), ['b', 'c']);
  assert.deepEqual(lane.redoStack?.map((transaction) => transaction.after), ['d']);
});

test('a stack-less lane survives being read back from disk', () => {
  const controller = createEditedController(['rotation={5}']);
  const written = upsertPersistedHistoryLane(
    createEmptyWorkbenchHistoryFile(),
    createPersistedHistoryLane(OWNER, controller.getSnapshot(), 200, { feature: 'source' }, 'session-only'),
    [],
  );

  // Through JSON, as the file actually round trips. A validator that required
  // the stacks would drop this lane and take `value` down with it.
  const readBack = normalizeWorkbenchHistoryFile(JSON.parse(JSON.stringify(written)));

  assert.deepEqual(readBack.lanes.map((lane) => lane.laneId), [LANE_ID]);
  assert.equal(readBack.lanes[0]?.value, 'rotation={5}');
  assert.deepEqual(readBack.lanes[0]?.extensions, { feature: 'source' });
  assert.equal(
    getHydratableHistoryLane(readBack, LANE_ID, 'rotation={5}', (left, right) => left === right)?.workingRevision,
    1,
  );
});

test('a lane whose stacks are malformed rather than absent is still rejected', () => {
  const readBack = normalizeWorkbenchHistoryFile({
    schemaVersion: '0.1',
    updatedAt: '2026-08-07T00:00:00.000Z',
    lanes: [
      { laneId: LANE_ID, owner: OWNER, value: 'a', undoStack: null, redoStack: null },
      { laneId: LANE_ID, owner: OWNER, value: 'a' },
    ],
    timeline: [],
    extensions: {},
  });

  assert.equal(readBack.lanes.length, 1);
});
