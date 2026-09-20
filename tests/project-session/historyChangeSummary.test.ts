import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createHistoryChangeSummary,
  formatHistoryChangeSummary,
  formatHistoryChangeValue,
  mergeHistoryChangeSummaries,
  normalizeHistoryChangeSummaries,
} from '@domain/history/historyChangeSummary';
import { createHistoryController } from '@domain/history/historyController';
import { createHistoryTimelineEntry } from '@domain/history/historyRegistry';
import { normalizeWorkbenchHistoryFile } from '@domain/history/historyPersistence';

// Step 5 of the history/undo redesign: `timeline` is the readable work log, so
// it has to answer "what changed" without diffing two whole source files. These
// lock in the parts that would fail silently -- a merge reporting only its last
// hop, and a summary surviving the persistence round trip.

const SOURCE_FILE = 'src/workbench-pages/Probe.tsx';
const LANE = `page:${SOURCE_FILE}` as const;
const ROTATION_KEY = `source:${SOURCE_FILE}:0-1:component-prop:rotation`;

function createSourceLane(initialValue: string) {
  return createHistoryController<string>({
    laneId: LANE,
    initialValue,
    maxEntries: 20,
    equalsState: (left, right) => left === right,
  });
}

function commitRotation(
  controller: ReturnType<typeof createSourceLane>,
  { after, before, createdAt }: { after: number; before: number; createdAt: string },
) {
  return controller.commit(`rotation={${after}}`, {
    laneId: LANE,
    owner: { type: 'page', filePath: SOURCE_FILE },
    label: 'Set rotation component prop',
    scope: 'page',
    kind: 'patch',
    affectedFiles: [SOURCE_FILE],
    mergeKey: ROTATION_KEY,
    createdAt,
    changes: [createHistoryChangeSummary('rotation', before, after)],
  });
}

function atOffset(milliseconds: number): string {
  return new Date(Date.parse('2026-08-07T10:00:00.000Z') + milliseconds).toISOString();
}

test('a summary reads as the field and both sides of the change', () => {
  const summary = createHistoryChangeSummary('easing', 'ease-in', 'ease-out');
  assert.deepEqual(summary, { field: 'easing', before: 'ease-in', after: 'ease-out' });
  assert.equal(formatHistoryChangeSummary(summary), 'easing: ease-in → ease-out');
});

test('an unset value stays null rather than becoming the string "null"', () => {
  // Clearing a prop and setting it to the text "null" have to stay distinguishable.
  assert.equal(formatHistoryChangeValue(null), null);
  assert.equal(formatHistoryChangeValue(undefined), null);
  assert.equal(formatHistoryChangeValue('null'), 'null');
  assert.equal(formatHistoryChangeSummary(createHistoryChangeSummary('title', 'Hi', null)), 'title: Hi → —');
});

test('values are collapsed and truncated so an entry stays small', () => {
  const long = 'x'.repeat(400);
  const formatted = formatHistoryChangeValue(long);
  assert.ok(formatted && formatted.length <= 120, `expected <= 120 chars, got ${formatted?.length}`);
  assert.ok(formatted?.endsWith('…'));

  assert.equal(formatHistoryChangeValue('  spaced\n  out  '), 'spaced out');
  assert.equal(formatHistoryChangeValue({ a: 1 }), '{"a":1}');
  assert.equal(formatHistoryChangeValue(42), '42');
  assert.equal(formatHistoryChangeValue(false), 'false');
});

test('a summary that records no change is dropped', () => {
  assert.equal(normalizeHistoryChangeSummaries([createHistoryChangeSummary('gap', '8px', '8px')]), undefined);
  assert.equal(normalizeHistoryChangeSummaries([]), undefined);
});

test('a merged scrub reports where it started, not its last hop', () => {
  const controller = createSourceLane('rotation={0}');
  // Same merge key inside the 2s window: one undo step, so one summary.
  commitRotation(controller, { before: 0, after: 20, createdAt: atOffset(0) });
  commitRotation(controller, { before: 20, after: 45, createdAt: atOffset(16) });
  const merged = commitRotation(controller, { before: 45, after: 50, createdAt: atOffset(32) });

  assert.equal(controller.getSnapshot().undoStack.length, 1);
  assert.deepEqual(merged?.changes, [{ field: 'rotation', before: '0', after: '50' }]);
  assert.equal(
    formatHistoryChangeSummary(merged!.changes![0]!),
    'rotation: 0 → 50',
    'a merged step restores its earliest before, so the summary has to say so',
  );
});

test('a round trip inside the merge window leaves no step and no summary', () => {
  const controller = createSourceLane('rotation={0}');
  commitRotation(controller, { before: 0, after: 50, createdAt: atOffset(0) });
  commitRotation(controller, { before: 50, after: 0, createdAt: atOffset(16) });

  assert.equal(controller.getSnapshot().undoStack.length, 0);
  assert.equal(controller.getSnapshot().canUndo, false);
});

test('edits outside the merge window keep their own summaries', () => {
  const controller = createSourceLane('rotation={0}');
  commitRotation(controller, { before: 0, after: 20, createdAt: atOffset(0) });
  commitRotation(controller, { before: 20, after: 50, createdAt: atOffset(3000) });

  const stack = controller.getSnapshot().undoStack;
  assert.equal(stack.length, 2);
  assert.deepEqual(stack[0]?.changes, [{ field: 'rotation', before: '0', after: '20' }]);
  assert.deepEqual(stack[1]?.changes, [{ field: 'rotation', before: '20', after: '50' }]);
});

test('merging carries fields the later edit did not touch', () => {
  const merged = mergeHistoryChangeSummaries(
    [createHistoryChangeSummary('gap', '4px', '8px'), createHistoryChangeSummary('padding', '0', '2px')],
    [createHistoryChangeSummary('gap', '8px', '16px')],
  );

  assert.deepEqual(merged, [
    { field: 'padding', before: '0', after: '2px' },
    { field: 'gap', before: '4px', after: '16px' },
  ]);
});

test('the timeline entry carries the summary, and omits it when there is none', () => {
  const controller = createSourceLane('rotation={0}');
  const withSummary = commitRotation(controller, { before: 0, after: 50, createdAt: atOffset(0) });
  assert.deepEqual(createHistoryTimelineEntry(withSummary!).changes, [
    { field: 'rotation', before: '0', after: '50' },
  ]);

  // A structural edit has no single field to name.
  const structural = controller.commit('<div />', {
    laneId: LANE,
    owner: { type: 'page', filePath: SOURCE_FILE },
    label: 'Duplicate layer',
    scope: 'page',
    kind: 'duplicate',
    affectedFiles: [SOURCE_FILE],
    createdAt: atOffset(5000),
  });
  assert.ok(!('changes' in createHistoryTimelineEntry(structural!)));
});

test('a persisted summary survives normalization, and a malformed one costs only itself', () => {
  const normalized = normalizeWorkbenchHistoryFile({
    schemaVersion: '0.1',
    updatedAt: atOffset(0),
    lanes: [],
    timeline: [
      {
        transactionId: 'edit-1',
        laneId: LANE,
        label: 'Set rotation component prop',
        affectedFiles: [SOURCE_FILE],
        createdAt: atOffset(0),
        changes: [{ field: 'rotation', before: '0', after: '50' }],
      },
      {
        transactionId: 'edit-2',
        laneId: LANE,
        label: 'Set easing component prop',
        affectedFiles: [SOURCE_FILE],
        createdAt: atOffset(1),
        changes: 'not-an-array',
      },
      {
        transactionId: 'edit-3',
        laneId: LANE,
        label: 'Written before summaries existed',
        affectedFiles: [SOURCE_FILE],
        createdAt: atOffset(2),
      },
    ],
    extensions: {},
  });

  assert.equal(normalized.timeline.length, 3, 'a bad summary must not drop the log line it sits on');
  assert.deepEqual(normalized.timeline[0]?.changes, [{ field: 'rotation', before: '0', after: '50' }]);
  assert.equal(normalized.timeline[1]?.changes, undefined);
  assert.equal(normalized.timeline[2]?.changes, undefined);
});
