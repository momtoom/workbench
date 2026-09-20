import type { WorkbenchFlushTrigger } from '@domain/editing/editFlushOperations';
import type { HistoryLaneId } from './historyController';

/**
 * Save points are the "restore to how it was three hours ago" mechanism.
 *
 * Undo is session state and is discarded on restart, so it cannot answer that
 * question, and growing the undo stack until it could would cost far more than
 * it is worth (see the entry-size measurements in the history/undo handoff).
 * A save point is a whole source snapshot taken at a save boundary, kept few
 * and kept cheap.
 *
 * Two decisions this file encodes, neither of which is obvious:
 *
 * **They are not stored in `history.json`.** That file is rewritten on every
 * edit; twenty ~60 KB source copies per lane would re-inflate exactly what
 * making undo session-only shrank, and would make each edit re-serialize
 * megabytes. Each lane keeps its own file, rewritten only when that lane
 * actually takes a save point.
 *
 * **A save point is coarser than a save.** Every source edit already flushes
 * with the `auto` trigger, so "one snapshot per save" taken literally would
 * give one per edit — a shallower undo stack, not time travel. Explicit
 * boundaries (`manual`, `navigation`, `beforeunload`) always capture; `auto`
 * captures only once per interval. With 20 kept and a five-minute floor, a
 * lane's save points span at least ~100 minutes of continuous editing.
 */

export type WorkbenchSavePointSchemaVersion = '0.1';

/** Enough spacing that 20 entries cover hours rather than 20 keystrokes. */
export const SAVE_POINT_MIN_AUTO_INTERVAL_MS = 5 * 60 * 1000;
export const MAX_SAVE_POINTS_PER_LANE = 20;

const SAVE_POINT_DIRECTORY = '.workbench/save-points';

export type HistorySavePoint = {
  id: string;
  laneId: HistoryLaneId;
  sourceFile: string;
  savedAt: string;
  trigger: WorkbenchFlushTrigger;
  contents: string;
};

export type WorkbenchSavePointFile = {
  schemaVersion: WorkbenchSavePointSchemaVersion;
  laneId: HistoryLaneId;
  updatedAt: string;
  savePoints: HistorySavePoint[];
};

/** Metadata without the payload — what a picker or an agent lists. */
export type HistorySavePointSummary = Omit<HistorySavePoint, 'contents'> & {
  byteSize: number;
};

export function getWorkbenchSavePointPath(laneId: HistoryLaneId): string {
  return `${SAVE_POINT_DIRECTORY}/${toSavePointFileSlug(laneId)}.json`;
}

export function createEmptyWorkbenchSavePointFile(
  laneId: HistoryLaneId,
  updatedAt: string,
): WorkbenchSavePointFile {
  return { schemaVersion: '0.1', laneId, updatedAt, savePoints: [] };
}

export function normalizeWorkbenchSavePointFile(
  value: unknown,
  laneId: HistoryLaneId,
  updatedAt: string,
): WorkbenchSavePointFile {
  if (!isRecord(value) || !Array.isArray(value.savePoints)) {
    return createEmptyWorkbenchSavePointFile(laneId, updatedAt);
  }

  return {
    schemaVersion: '0.1',
    laneId,
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : updatedAt,
    savePoints: value.savePoints
      .filter((entry): entry is HistorySavePoint => isHistorySavePoint(entry))
      .slice(-MAX_SAVE_POINTS_PER_LANE),
  };
}

/**
 * An explicit boundary always captures. Autosave captures only once per
 * interval, and nothing captures a snapshot identical to the newest one — a
 * flush with no change would otherwise evict real history.
 */
export function shouldCaptureSavePoint({
  contents,
  file,
  now,
  trigger,
}: {
  contents: string;
  file: WorkbenchSavePointFile;
  now: string;
  trigger: WorkbenchFlushTrigger;
}): boolean {
  const newest = file.savePoints[file.savePoints.length - 1];
  if (newest?.contents === contents) return false;
  if (!newest) return true;
  if (trigger !== 'auto') return true;

  const elapsed = Date.parse(now) - Date.parse(newest.savedAt);
  if (!Number.isFinite(elapsed)) return true;
  return elapsed >= SAVE_POINT_MIN_AUTO_INTERVAL_MS;
}

export function appendSavePoint(
  file: WorkbenchSavePointFile,
  savePoint: HistorySavePoint,
): WorkbenchSavePointFile {
  return {
    ...file,
    updatedAt: savePoint.savedAt,
    savePoints: [...file.savePoints, savePoint].slice(-MAX_SAVE_POINTS_PER_LANE),
  };
}

/** Newest first — a restore picker reads top-down. */
export function listSavePointSummaries(file: WorkbenchSavePointFile): HistorySavePointSummary[] {
  return file.savePoints
    .map(({ contents, ...summary }) => ({ ...summary, byteSize: contents.length }))
    .reverse();
}

export function findSavePoint(file: WorkbenchSavePointFile, id: string): HistorySavePoint | null {
  return file.savePoints.find((savePoint) => savePoint.id === id) ?? null;
}

export function createSavePointId(savedAt: string, laneId: HistoryLaneId): string {
  const stamp = savedAt.replace(/[^0-9]/g, '').slice(0, 14);
  return `sp-${stamp}-${hashToBase36(`${laneId}:${savedAt}`)}`;
}

/**
 * Lane ids carry path separators and a `kind:` prefix, so they cannot be file
 * names. The hash keeps two lanes whose paths differ only in stripped
 * characters from colliding onto one file.
 */
function toSavePointFileSlug(laneId: HistoryLaneId): string {
  const readable = laneId.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
  return `${readable || 'lane'}-${hashToBase36(laneId)}`;
}

function hashToBase36(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function isHistorySavePoint(value: unknown): value is HistorySavePoint {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.laneId === 'string' &&
    typeof value.sourceFile === 'string' &&
    typeof value.savedAt === 'string' &&
    typeof value.trigger === 'string' &&
    typeof value.contents === 'string'
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
