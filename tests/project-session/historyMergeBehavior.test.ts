import assert from 'node:assert/strict';
import test from 'node:test';
import { createHistoryController } from '@domain/history/historyController';

// Characterization coverage for how a source lane collapses consecutive edits.
// The history/undo redesign changes the stack model but not this merge rule, so
// these lock in the behavior that model has to keep.

const SOURCE_FILE = 'src/workbench-pages/Probe.tsx';
const LANE = `page:${SOURCE_FILE}` as const;
const ROTATION_KEY = `source:${SOURCE_FILE}:0-1:component-prop:rotation`;
const OPACITY_KEY = `source:${SOURCE_FILE}:0-1:component-prop:opacity`;
const DRAG_FRAME_MS = 16;
const MERGE_WINDOW_MS = 2000;

function createSourceLane(initialValue: string) {
  return createHistoryController<string>({
    laneId: LANE,
    initialValue,
    maxEntries: 20,
    equalsState: (left, right) => left === right,
  });
}

function commitPropEdit(
  controller: ReturnType<typeof createSourceLane>,
  value: string,
  { createdAt, mergeKey = ROTATION_KEY }: { createdAt: string; mergeKey?: string },
) {
  return controller.commit(value, {
    laneId: LANE,
    owner: { type: 'page', filePath: SOURCE_FILE },
    label: 'Set rotation component prop',
    scope: 'page',
    kind: 'patch',
    affectedFiles: [SOURCE_FILE],
    mergeKey,
    createdAt,
  });
}

function atOffset(milliseconds: number): string {
  return new Date(Date.parse('2026-08-07T10:00:00.000Z') + milliseconds).toISOString();
}

test('a scrub drag on one prop collapses into a single undo entry', () => {
  const controller = createSourceLane('rotation={0}');
  // useNumberScrub commits once per pointermove, roughly one animation frame apart.
  for (let frame = 1; frame <= 40; frame += 1) {
    commitPropEdit(controller, `rotation={${frame}}`, { createdAt: atOffset(frame * DRAG_FRAME_MS) });
  }

  const snapshot = controller.getSnapshot();
  assert.equal(snapshot.value, 'rotation={40}');
  assert.equal(snapshot.undoStack.length, 1);
  assert.equal(snapshot.undoStack[0]?.before, 'rotation={0}');
});

test('deliberate edits to one prop seconds apart stay separate undo entries', () => {
  const controller = createSourceLane('rotation={0}');
  for (let edit = 1; edit <= 4; edit += 1) {
    commitPropEdit(controller, `rotation={${edit}}`, { createdAt: atOffset(edit * 3000) });
  }

  assert.equal(controller.getSnapshot().undoStack.length, 4);
});

test('one gesture that pauses past the merge window splits into two undo entries', () => {
  const controller = createSourceLane('rotation={0}');
  for (let frame = 1; frame <= 10; frame += 1) {
    commitPropEdit(controller, `rotation={${frame}}`, { createdAt: atOffset(frame * DRAG_FRAME_MS) });
  }
  // Same uninterrupted gesture, but the pointer held still past the window.
  for (let frame = 11; frame <= 20; frame += 1) {
    commitPropEdit(controller, `rotation={${frame}}`, {
      createdAt: atOffset(MERGE_WINDOW_MS + 500 + frame * DRAG_FRAME_MS),
    });
  }

  assert.equal(controller.getSnapshot().undoStack.length, 2);
});

test('drag-rate edits to different props never merge into each other', () => {
  const controller = createSourceLane('rotation={0} opacity={1}');
  commitPropEdit(controller, 'rotation={5} opacity={1}', { createdAt: atOffset(0) });
  commitPropEdit(controller, 'rotation={5} opacity={0.5}', {
    createdAt: atOffset(DRAG_FRAME_MS),
    mergeKey: OPACITY_KEY,
  });

  assert.equal(controller.getSnapshot().undoStack.length, 2);
});

test('a round trip inside the merge window leaves no undo step behind', () => {
  const controller = createSourceLane('rotation={0}');
  commitPropEdit(controller, 'rotation={50}', { createdAt: atOffset(0) });
  commitPropEdit(controller, 'rotation={0}', { createdAt: atOffset(DRAG_FRAME_MS) });

  const snapshot = controller.getSnapshot();
  assert.equal(snapshot.value, 'rotation={0}');
  assert.equal(snapshot.undoStack.length, 0);
  assert.equal(snapshot.canUndo, false);
  assert.equal(snapshot.isDirty, false);
});

test('a gesture that returns to its starting value leaves no undo step behind', () => {
  const controller = createSourceLane('rotation={0}');
  for (let frame = 1; frame <= 20; frame += 1) {
    commitPropEdit(controller, `rotation={${frame}}`, { createdAt: atOffset(frame * DRAG_FRAME_MS) });
  }
  for (let frame = 19; frame >= 0; frame -= 1) {
    commitPropEdit(controller, `rotation={${frame}}`, { createdAt: atOffset((40 - frame) * DRAG_FRAME_MS) });
  }

  const snapshot = controller.getSnapshot();
  assert.equal(snapshot.value, 'rotation={0}');
  assert.equal(snapshot.undoStack.length, 0);
  assert.equal(snapshot.canUndo, false);
});

test('dropping a round trip does not consume the entry underneath it', () => {
  const controller = createSourceLane('rotation={0}');
  // An earlier, unrelated edit must survive the collapse above it.
  commitPropEdit(controller, 'rotation={0} opacity={0.5}', {
    createdAt: atOffset(0),
    mergeKey: OPACITY_KEY,
  });
  commitPropEdit(controller, 'rotation={50} opacity={0.5}', { createdAt: atOffset(5000) });
  commitPropEdit(controller, 'rotation={0} opacity={0.5}', { createdAt: atOffset(5000 + DRAG_FRAME_MS) });

  const snapshot = controller.getSnapshot();
  assert.equal(snapshot.undoStack.length, 1);
  assert.equal(snapshot.undoStack[0]?.before, 'rotation={0}');
  assert.equal(snapshot.undoStack[0]?.after, 'rotation={0} opacity={0.5}');

  controller.undo();
  assert.equal(controller.getSnapshot().value, 'rotation={0}');
});

test('a round trip that lands outside the merge window keeps both steps', () => {
  const controller = createSourceLane('rotation={0}');
  commitPropEdit(controller, 'rotation={50}', { createdAt: atOffset(0) });
  commitPropEdit(controller, 'rotation={0}', { createdAt: atOffset(MERGE_WINDOW_MS + 500) });

  // Two deliberate edits, each independently undoable — not one collapsed gesture.
  assert.equal(controller.getSnapshot().undoStack.length, 2);
});

test('a commit that leaves the source unchanged never reaches the undo stack', () => {
  const controller = createSourceLane('rotation={0}');
  const transaction = commitPropEdit(controller, 'rotation={0}', { createdAt: atOffset(0) });

  assert.equal(transaction, null);
  assert.equal(controller.getSnapshot().undoStack.length, 0);
});

test('a merged entry undoes the whole gesture in one step', () => {
  const controller = createSourceLane('rotation={0}');
  for (let frame = 1; frame <= 12; frame += 1) {
    commitPropEdit(controller, `rotation={${frame}}`, { createdAt: atOffset(frame * DRAG_FRAME_MS) });
  }

  assert.equal(controller.getSnapshot().value, 'rotation={12}');
  controller.undo();
  assert.equal(controller.getSnapshot().value, 'rotation={0}');
  assert.equal(controller.getSnapshot().canUndo, false);
});
