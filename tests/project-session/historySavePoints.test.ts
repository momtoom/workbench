import assert from 'node:assert/strict';
import test from 'node:test';
import {
  MAX_SAVE_POINTS_PER_LANE,
  SAVE_POINT_MIN_AUTO_INTERVAL_MS,
  appendSavePoint,
  createEmptyWorkbenchSavePointFile,
  createSavePointId,
  findSavePoint,
  getWorkbenchSavePointPath,
  listSavePointSummaries,
  normalizeWorkbenchSavePointFile,
  shouldCaptureSavePoint,
  type HistorySavePoint,
  type WorkbenchSavePointFile,
} from '@domain/history/historySavePoints';
import type { HistoryLaneId } from '@domain/history/historyController';

// Step 6: save points are the "restore to how it was three hours ago"
// mechanism that discarding undo on restart takes away. The rules that matter
// are the ones that decide *when* one is worth keeping -- every source edit
// already flushes, so capturing on each one would give a shallow undo stack
// rather than time travel.

const LANE = 'page:src/workbench-pages/Probe.tsx' as HistoryLaneId;
const OTHER_LANE = 'page:src/workbench-pages/Other.tsx' as HistoryLaneId;
const BASE = Date.parse('2026-08-07T10:00:00.000Z');

function at(offsetMs: number): string {
  return new Date(BASE + offsetMs).toISOString();
}

function savePointAt(offsetMs: number, contents: string): HistorySavePoint {
  return {
    id: createSavePointId(at(offsetMs), LANE),
    laneId: LANE,
    sourceFile: 'src/workbench-pages/Probe.tsx',
    savedAt: at(offsetMs),
    trigger: 'auto',
    contents,
  };
}

function fileWith(...savePoints: HistorySavePoint[]): WorkbenchSavePointFile {
  return { ...createEmptyWorkbenchSavePointFile(LANE, at(0)), savePoints };
}

test('the first save on a lane always captures', () => {
  const captured = shouldCaptureSavePoint({
    contents: '<div />',
    file: createEmptyWorkbenchSavePointFile(LANE, at(0)),
    now: at(0),
    trigger: 'auto',
  });
  assert.equal(captured, true);
});

test('autosave captures once per interval, not once per edit', () => {
  const file = fileWith(savePointAt(0, '<div />'));

  // Every source edit flushes with `auto`; capturing each would make save
  // points a shallow undo stack instead of time travel.
  assert.equal(
    shouldCaptureSavePoint({ contents: '<span />', file, now: at(30_000), trigger: 'auto' }),
    false,
  );
  assert.equal(
    shouldCaptureSavePoint({
      contents: '<span />',
      file,
      now: at(SAVE_POINT_MIN_AUTO_INTERVAL_MS),
      trigger: 'auto',
    }),
    true,
  );
});

test('an explicit save boundary always captures, however recent the last one', () => {
  const file = fileWith(savePointAt(0, '<div />'));

  for (const trigger of ['manual', 'navigation', 'beforeunload'] as const) {
    assert.equal(
      shouldCaptureSavePoint({ contents: '<span />', file, now: at(1_000), trigger }),
      true,
      `${trigger} is a boundary the user chose, so it must not be rate limited`,
    );
  }
});

test('contents identical to the newest save point never capture', () => {
  const file = fileWith(savePointAt(0, '<div />'));

  // Otherwise a repeated manual save would evict real history with duplicates.
  assert.equal(
    shouldCaptureSavePoint({ contents: '<div />', file, now: at(60 * 60 * 1000), trigger: 'manual' }),
    false,
  );
});

test('a malformed timestamp captures rather than blocking forever', () => {
  const file = fileWith({ ...savePointAt(0, '<div />'), savedAt: 'not-a-date' });
  assert.equal(
    shouldCaptureSavePoint({ contents: '<span />', file, now: at(1_000), trigger: 'auto' }),
    true,
  );
});

test('a lane keeps the most recent 20 and drops the oldest', () => {
  let file = createEmptyWorkbenchSavePointFile(LANE, at(0));
  for (let index = 0; index < MAX_SAVE_POINTS_PER_LANE + 5; index += 1) {
    file = appendSavePoint(file, savePointAt(index * SAVE_POINT_MIN_AUTO_INTERVAL_MS, `<div>${index}</div>`));
  }

  assert.equal(file.savePoints.length, MAX_SAVE_POINTS_PER_LANE);
  assert.equal(file.savePoints[0]?.contents, '<div>5</div>', 'the oldest five are gone');
  assert.equal(file.savePoints[MAX_SAVE_POINTS_PER_LANE - 1]?.contents, '<div>24</div>');
});

test('20 save points at the autosave floor span hours of editing', () => {
  // The point of the interval: the window has to be long enough to answer
  // "how was it three hours ago", not just "twenty edits ago".
  const spanMs = (MAX_SAVE_POINTS_PER_LANE - 1) * SAVE_POINT_MIN_AUTO_INTERVAL_MS;
  assert.ok(spanMs >= 90 * 60 * 1000, `expected >= 90 minutes of coverage, got ${spanMs / 60000} minutes`);
});

test('summaries are newest first and carry no payload', () => {
  const file = fileWith(savePointAt(0, '<div />'), savePointAt(600_000, '<div><span /></div>'));
  const summaries = listSavePointSummaries(file);

  assert.equal(summaries.length, 2);
  assert.equal(summaries[0]?.savedAt, at(600_000), 'a restore picker reads top-down');
  assert.equal(summaries[0]?.byteSize, '<div><span /></div>'.length);
  assert.ok(!('contents' in summaries[0]!), 'listing must not carry whole source files');
});

test('a save point can be found by id', () => {
  const target = savePointAt(600_000, '<div><span /></div>');
  const file = fileWith(savePointAt(0, '<div />'), target);

  assert.equal(findSavePoint(file, target.id)?.contents, '<div><span /></div>');
  assert.equal(findSavePoint(file, 'sp-missing'), null);
});

test('lane paths become safe file names that do not collide', () => {
  const path = getWorkbenchSavePointPath(LANE);
  assert.match(path, /^\.workbench\/save-points\/[A-Za-z0-9-]+\.json$/);
  assert.notEqual(path, getWorkbenchSavePointPath(OTHER_LANE));

  // Two lanes differing only in stripped characters must not share a file.
  const slashes = getWorkbenchSavePointPath('page:a/b' as HistoryLaneId);
  const dashes = getWorkbenchSavePointPath('page:a-b' as HistoryLaneId);
  assert.notEqual(slashes, dashes);
});

test('a missing or malformed file normalizes to an empty lane rather than throwing', () => {
  assert.deepEqual(normalizeWorkbenchSavePointFile(null, LANE, at(0)).savePoints, []);
  assert.deepEqual(normalizeWorkbenchSavePointFile({ savePoints: 'nope' }, LANE, at(0)).savePoints, []);

  const partlyValid = normalizeWorkbenchSavePointFile(
    {
      schemaVersion: '0.1',
      laneId: LANE,
      updatedAt: at(0),
      savePoints: [savePointAt(0, '<div />'), { id: 'sp-broken' }],
    },
    LANE,
    at(0),
  );
  assert.equal(partlyValid.savePoints.length, 1, 'a broken entry must not cost the good ones');
});

test('normalization caps a file that grew past the retention limit', () => {
  const overfull = Array.from({ length: MAX_SAVE_POINTS_PER_LANE + 10 }, (_unused, index) =>
    savePointAt(index * SAVE_POINT_MIN_AUTO_INTERVAL_MS, `<div>${index}</div>`));

  const normalized = normalizeWorkbenchSavePointFile(
    { schemaVersion: '0.1', laneId: LANE, updatedAt: at(0), savePoints: overfull },
    LANE,
    at(0),
  );
  assert.equal(normalized.savePoints.length, MAX_SAVE_POINTS_PER_LANE);
  assert.equal(normalized.savePoints[MAX_SAVE_POINTS_PER_LANE - 1]?.contents, '<div>29</div>');
});
