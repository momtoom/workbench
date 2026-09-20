import {
  normalizeHistoryChangeSummaries,
  type WorkbenchEditChangeSummary,
} from './historyChangeSummary';
import {
  createHistoryController,
  getHistoryLaneId,
  type EditOwner,
  type HistoryController,
  type HistoryLaneId,
  type WorkbenchEditTransaction,
} from './historyController';

type RegisterHistoryLaneOptions<TState> = {
  owner: EditOwner;
  initialValue: TState;
  initialSaved?: boolean;
  initialRevision?: number;
  initialUndoStack?: WorkbenchEditTransaction<TState>[];
  initialRedoStack?: WorkbenchEditTransaction<TState>[];
  maxEntries?: number;
  cloneState?: (state: TState) => TState;
  equalsState?: (left: TState, right: TState) => boolean;
};

export type HistoryTimelineEntry = {
  transactionId: string;
  laneId: HistoryLaneId;
  label: string;
  affectedFiles: string[];
  createdAt: string;
  /** Absent when the edit has no field-level summary, and on older entries. */
  changes?: WorkbenchEditChangeSummary[];
};

/**
 * The one projection from a transaction to its timeline entry. Three call sites
 * used to inline this — the source inspector, DesignEditor and the token editor
 * — and a field added to one of them reached the log from only that path.
 */
export function createHistoryTimelineEntry<TState>(
  transaction: WorkbenchEditTransaction<TState>,
): HistoryTimelineEntry {
  const entry: HistoryTimelineEntry = {
    transactionId: transaction.id,
    laneId: transaction.laneId,
    label: transaction.label,
    affectedFiles: transaction.affectedFiles,
    createdAt: transaction.createdAt,
  };
  const changes = normalizeHistoryChangeSummaries(transaction.changes);
  if (changes) entry.changes = changes;
  return entry;
}

export type HistoryRegistry = {
  getLane: <TState>(laneId: HistoryLaneId) => HistoryController<TState> | null;
  registerLane: <TState>(options: RegisterHistoryLaneOptions<TState>) => HistoryController<TState>;
  getActiveLaneId: () => HistoryLaneId | null;
  setActiveLaneId: (laneId: HistoryLaneId | null) => void;
  getTimeline: () => HistoryTimelineEntry[];
  recordTimelineEntry: (entry: HistoryTimelineEntry) => void;
};

export function createHistoryRegistry(initialTimeline: HistoryTimelineEntry[] = []): HistoryRegistry {
  const lanes = new Map<HistoryLaneId, HistoryController<unknown>>();
  const timeline: HistoryTimelineEntry[] = [...initialTimeline];
  let activeLaneId: HistoryLaneId | null = null;

  function getLane<TState>(laneId: HistoryLaneId): HistoryController<TState> | null {
    return (lanes.get(laneId) as HistoryController<TState> | undefined) ?? null;
  }

  function registerLane<TState>(options: RegisterHistoryLaneOptions<TState>): HistoryController<TState> {
    const laneId = getHistoryLaneId(options.owner);
    const existing = getLane<TState>(laneId);
    if (existing) return existing;

    const controller = createHistoryController({
      laneId,
      initialValue: options.initialValue,
      initialSaved: options.initialSaved,
      initialRevision: options.initialRevision,
      initialUndoStack: options.initialUndoStack,
      initialRedoStack: options.initialRedoStack,
      maxEntries: options.maxEntries,
      cloneState: options.cloneState,
      equalsState: options.equalsState,
    });

    lanes.set(laneId, controller as HistoryController<unknown>);
    return controller;
  }

  return {
    getLane,
    registerLane,
    getActiveLaneId: () => activeLaneId,
    setActiveLaneId(laneId) {
      activeLaneId = laneId;
    },
    getTimeline: () => [...timeline],
    recordTimelineEntry(entry) {
      const existingIndex = timeline.findIndex((candidate) => candidate.transactionId === entry.transactionId);
      if (existingIndex >= 0) {
        // A merged transaction re-records under the previous id, so the summary
        // has to be replaced rather than kept — including being dropped when the
        // fold leaves nothing to report.
        const { changes: _staleChanges, ...retained } = timeline[existingIndex]!;
        timeline[existingIndex] = {
          ...retained,
          label: entry.label,
          affectedFiles: entry.affectedFiles,
          ...(entry.changes ? { changes: entry.changes } : {}),
        };
        return;
      }

      timeline.push(entry);
    },
  };
}
