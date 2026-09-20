import assert from 'node:assert/strict';
import test from 'node:test';
import { createHistoryController, type HistoryLaneId } from '@domain/history/historyController';
import { createEmptyWorkbenchHistoryFile } from '@domain/history/historyPersistence';
import {
  persistSourceFileHistoryLane,
  type SourceFilePersistenceAdapters,
  type SourceFileSavePointCandidate,
} from '@domain/document/editableTreeSourcePersistence';
import type { ProjectAssetHistorySubject } from '@domain/editing/projectAssetHistory';
import type { WorkbenchFlushTrigger } from '@domain/editing/editFlushOperations';

// The save-point offer is made from inside the one source save funnel. If it
// stops being made, nothing fails visibly -- edits still save, and the feature
// just silently stops recording. These pin the offer itself.

const SOURCE_FILE = 'src/workbench-pages/Probe.tsx';
const LANE_ID = `page:${SOURCE_FILE}` as HistoryLaneId;
const SUBJECT: ProjectAssetHistorySubject = {
  kind: 'page',
  id: 'page-probe',
  name: 'Probe',
  sourceFile: SOURCE_FILE,
  status: 'ready',
};

function createLane(initialValue: string, { dirty }: { dirty: boolean }) {
  const controller = createHistoryController<string>({
    laneId: LANE_ID,
    initialValue,
    initialSaved: true,
    maxEntries: 200,
    equalsState: (left, right) => left === right,
  });
  if (dirty) {
    controller.commit(`${initialValue}<span />`, {
      laneId: LANE_ID,
      owner: { type: 'page', filePath: SOURCE_FILE },
      label: 'Set rotation component prop',
      scope: 'page',
      kind: 'patch',
      affectedFiles: [SOURCE_FILE],
      createdAt: '2026-08-07T10:00:00.000Z',
    });
  }
  return controller;
}

function createAdapters(overrides: Partial<SourceFilePersistenceAdapters> = {}) {
  const captured: SourceFileSavePointCandidate[] = [];
  const writtenSourceFiles: string[] = [];
  const adapters: SourceFilePersistenceAdapters = {
    captureSavePoint: (candidate) => captured.push(candidate),
    saveHistory: async () => {},
    writeSourceFile: async (path) => {
      writtenSourceFiles.push(path);
      return { ok: true };
    },
    ...overrides,
  };
  return { adapters, captured, writtenSourceFiles };
}

async function persist(
  controller: ReturnType<typeof createLane>,
  adapters: SourceFilePersistenceAdapters,
  trigger: WorkbenchFlushTrigger = 'auto',
) {
  return persistSourceFileHistoryLane({
    adapters,
    history: controller,
    historyFile: createEmptyWorkbenchHistoryFile('2026-08-07T10:00:00.000Z'),
    historyPath: '.workbench/history.json',
    maxEntries: 200,
    subject: SUBJECT,
    timeline: [],
    trigger,
  });
}

test('a save that writes offers its contents as a save point', async () => {
  const controller = createLane('<div />', { dirty: true });
  const { adapters, captured } = createAdapters();

  const result = await persist(controller, adapters, 'manual');

  assert.equal(result.ok, true);
  assert.equal(captured.length, 1);
  assert.deepEqual(captured[0], {
    contents: '<div /><span />',
    laneId: LANE_ID,
    sourceFile: SOURCE_FILE,
    trigger: 'manual',
  });
});

test('a flush with nothing dirty offers nothing', async () => {
  const controller = createLane('<div />', { dirty: false });
  const { adapters, captured, writtenSourceFiles } = createAdapters();

  await persist(controller, adapters, 'manual');

  // No write happened, so there is no new save boundary to remember.
  assert.deepEqual(writtenSourceFiles, []);
  assert.equal(captured.length, 0);
});

test('a failed source write offers nothing', async () => {
  const controller = createLane('<div />', { dirty: true });
  const { adapters, captured } = createAdapters({
    writeSourceFile: async () => ({ ok: false, message: 'disk full' }),
  });

  const result = await persist(controller, adapters);

  assert.equal(result.ok, false);
  assert.equal(captured.length, 0, 'a save point must never claim contents that never reached disk');
});

test('the trigger reaches the save point, so the cadence rule can see it', async () => {
  for (const trigger of ['auto', 'manual', 'navigation', 'beforeunload'] as const) {
    const controller = createLane('<div />', { dirty: true });
    const { adapters, captured } = createAdapters();
    await persist(controller, adapters, trigger);
    assert.equal(captured[0]?.trigger, trigger);
  }
});

test('the offer is optional, and a lane without the adapter still saves', async () => {
  const controller = createLane('<div />', { dirty: true });
  const { adapters, writtenSourceFiles } = createAdapters({ captureSavePoint: undefined });

  const result = await persist(controller, adapters);

  assert.equal(result.ok, true);
  assert.deepEqual(writtenSourceFiles, [SOURCE_FILE]);
});
