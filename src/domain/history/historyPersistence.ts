import { isHistoryChangeSummary } from './historyChangeSummary';
import type {
  EditOwner,
  HistoryControllerSnapshot,
  HistoryLaneId,
  WorkbenchEditTransaction,
} from './historyController';
import type { HistoryTimelineEntry } from './historyRegistry';

export type WorkbenchHistorySchemaVersion = '0.1';

/**
 * Whether a lane writes its undo/redo stacks to `history.json`.
 *
 * `session-only` is the direction of travel: undo is discarded on restart, and
 * the stacks are almost all of the file's weight. `persist` is for the lanes
 * that still use the file as the transport carrying their stacks across a
 * controller rebuild — tokens and spec notes. Source lanes own one controller
 * for the session, so nothing hydrates their stacks any more.
 *
 * A lane's `value` / `workingRevision` / `savedRevision` are persisted either
 * way: they are unsaved-work recovery, not undo.
 */
export type HistoryLaneStackPersistence = 'persist' | 'session-only';

export type PersistedHistoryLane<TState = unknown> = {
  laneId: HistoryLaneId;
  owner: EditOwner;
  value: TState;
  workingRevision: number;
  savedRevision: number;
  updatedAt: string;
  maxEntries: number;
  undoStack?: WorkbenchEditTransaction<TState>[];
  redoStack?: WorkbenchEditTransaction<TState>[];
  extensions: Record<string, unknown>;
};

export type WorkbenchHistoryFile = {
  schemaVersion: WorkbenchHistorySchemaVersion;
  updatedAt: string;
  lanes: PersistedHistoryLane[];
  timeline: HistoryTimelineEntry[];
  extensions: Record<string, unknown>;
};

export function createEmptyWorkbenchHistoryFile(updatedAt = new Date().toISOString()): WorkbenchHistoryFile {
  return {
    schemaVersion: '0.1',
    updatedAt,
    lanes: [],
    timeline: [],
    extensions: {},
  };
}

export function normalizeWorkbenchHistoryFile(value: unknown): WorkbenchHistoryFile {
  if (!isRecord(value) || !Array.isArray(value.lanes)) return createEmptyWorkbenchHistoryFile();

  return {
    schemaVersion: '0.1',
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : new Date().toISOString(),
    lanes: value.lanes.filter(isPersistedHistoryLane),
    timeline: Array.isArray(value.timeline)
      ? value.timeline.filter(isHistoryTimelineEntry).map(sanitizeHistoryTimelineEntry)
      : [],
    extensions: isRecord(value.extensions) ? value.extensions : {},
  };
}

export function createPersistedHistoryLane<TState>(
  owner: EditOwner,
  snapshot: HistoryControllerSnapshot<TState>,
  maxEntries: number,
  extensions: Record<string, unknown>,
  stackPersistence: HistoryLaneStackPersistence,
): PersistedHistoryLane<TState> {
  const lane: PersistedHistoryLane<TState> = {
    laneId: snapshot.laneId,
    owner,
    value: snapshot.value,
    workingRevision: snapshot.workingRevision,
    savedRevision: snapshot.savedRevision,
    updatedAt: snapshot.updatedAt,
    maxEntries,
    extensions,
  };

  if (stackPersistence === 'persist') {
    lane.undoStack = snapshot.undoStack.slice(-maxEntries);
    lane.redoStack = snapshot.redoStack.slice(-maxEntries);
  }

  return lane;
}

export function upsertPersistedHistoryLane<TState>(
  history: WorkbenchHistoryFile,
  lane: PersistedHistoryLane<TState>,
  timeline: HistoryTimelineEntry[],
  updatedAt = new Date().toISOString(),
): WorkbenchHistoryFile {
  const lanes = history.lanes.filter((candidate) => candidate.laneId !== lane.laneId);
  return {
    ...history,
    updatedAt,
    lanes: [...lanes, lane as PersistedHistoryLane],
    timeline: timeline.slice(-1000),
  };
}

export function getHydratableHistoryLane<TState>(
  history: WorkbenchHistoryFile,
  laneId: HistoryLaneId,
  currentValue: TState,
  equalsState: (left: TState, right: TState) => boolean,
): PersistedHistoryLane<TState> | null {
  const lane = history.lanes.find((candidate) => candidate.laneId === laneId) as PersistedHistoryLane<TState> | undefined;
  if (!lane) return null;
  return equalsState(lane.value, currentValue) ? lane : null;
}

// A lane is identified by its id and owner, not by carrying stacks. A
// session-only lane writes none, and rejecting it here would drop the fields
// that must survive a restart — `value`, `workingRevision`, `savedRevision`.
function isPersistedHistoryLane(value: unknown): value is PersistedHistoryLane {
  return (
    isRecord(value) &&
    typeof value.laneId === 'string' &&
    isRecord(value.owner) &&
    isOptionalTransactionStack(value.undoStack) &&
    isOptionalTransactionStack(value.redoStack)
  );
}

function isOptionalTransactionStack(value: unknown): boolean {
  return value === undefined || Array.isArray(value);
}

function isHistoryTimelineEntry(value: unknown): value is HistoryTimelineEntry {
  return (
    isRecord(value) &&
    typeof value.transactionId === 'string' &&
    typeof value.laneId === 'string' &&
    typeof value.label === 'string' &&
    Array.isArray(value.affectedFiles) &&
    typeof value.createdAt === 'string'
  );
}

/**
 * `changes` is optional — entries written before summaries existed have none,
 * and a structural edit has no field to name. A malformed summary costs only
 * itself: the entry still carries the label, files and timestamp that make the
 * timeline a work log, so it is stripped rather than dropped.
 */
function sanitizeHistoryTimelineEntry(entry: HistoryTimelineEntry): HistoryTimelineEntry {
  const changes = (entry as { changes?: unknown }).changes;
  if (changes === undefined) return entry;
  if (Array.isArray(changes) && changes.every(isHistoryChangeSummary)) return entry;

  const { changes: _malformed, ...retained } = entry;
  return retained;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
