import type { HistoryController, HistoryLaneId } from './historyController';

// Keeps one controller alive per lane for the whole session.
//
// Undo lives in the controller's own stack. The design editor rebuilds its
// source controller constantly — the memo is keyed on file contents, so every
// edit replaces it — and until this store existed, the only thing carrying a
// stack across those rebuilds was the copy written into `history.json`. That is
// why undo could not simply stop being persisted: the file was the transport.
//
// Reuse is the default and lookups never mutate. `get` takes a value only to
// create a lane it has never seen; for a lane that exists it hands back the
// controller untouched, whatever the caller passes.
//
// That matters because callers routinely hold a lagging view. The parsed tree
// cache is refreshed asynchronously after a commit, and the memo re-runs on a
// `refreshSourceHistoryView` bump before that state lands, so a lookup that
// reconciled by comparison would read its own caller's lag as an outside change
// — rewinding the lane, dropping the stack, and computing the next edit from
// the wrong base.
//
// Reconciling is therefore an explicit `reset` by whoever actually knows the
// file moved: the design editor re-reads disk before every source edit and
// resets the lane when disk and controller genuinely disagree. Undo has its own
// guard as well — `restoreDesignHistoryTransaction` re-reads the file and skips
// the undo rather than overwriting an outside change — so nothing here needs to
// duplicate either check by guessing.
export type HistoryControllerStore<TState> = {
  get: (laneId: HistoryLaneId, initialValue: TState) => HistoryController<TState>;
  peek: (laneId: HistoryLaneId) => HistoryController<TState> | null;
  reset: (laneId: HistoryLaneId, nextValue: TState) => HistoryController<TState>;
  discard: (laneId: HistoryLaneId) => void;
  clear: () => void;
  retainedLaneIds: () => HistoryLaneId[];
};

export type HistoryControllerStoreOptions<TState> = {
  createController: (laneId: HistoryLaneId, initialValue: TState) => HistoryController<TState>;
  // A transaction holds the whole before and after state, which for source lanes
  // means two full copies of the file — 73-258 KB per entry in real projects. At
  // any useful depth that is tens of MB per lane, so the number of lanes kept in
  // memory has to be bounded even though each one is cheap to rebuild empty.
  maxRetainedLanes?: number;
};

const DEFAULT_MAX_RETAINED_LANES = 4;

export function createHistoryControllerStore<TState>(
  options: HistoryControllerStoreOptions<TState>,
): HistoryControllerStore<TState> {
  const maxRetainedLanes = Math.max(1, options.maxRetainedLanes ?? DEFAULT_MAX_RETAINED_LANES);
  // Insertion order is the recency order: re-inserting on touch moves a lane to
  // the end, so the first key is always the least recently used.
  const controllers = new Map<HistoryLaneId, HistoryController<TState>>();

  function touch(laneId: HistoryLaneId, controller: HistoryController<TState>) {
    controllers.delete(laneId);
    controllers.set(laneId, controller);
    while (controllers.size > maxRetainedLanes) {
      const oldestLaneId = controllers.keys().next().value as HistoryLaneId | undefined;
      if (oldestLaneId === undefined || oldestLaneId === laneId) break;
      controllers.delete(oldestLaneId);
    }
  }

  function get(laneId: HistoryLaneId, initialValue: TState): HistoryController<TState> {
    const existing = controllers.get(laneId);
    if (!existing) {
      const created = options.createController(laneId, initialValue);
      touch(laneId, created);
      return created;
    }
    touch(laneId, existing);
    return existing;
  }

  // The one way a lane's stack is thrown away: the caller knows the file moved
  // to something the controller never produced, so undoing from that stack
  // would write source back that the file never came from.
  function reset(laneId: HistoryLaneId, nextValue: TState): HistoryController<TState> {
    const existing = controllers.get(laneId);
    if (!existing) return get(laneId, nextValue);
    existing.replaceValue(nextValue, { saved: true });
    touch(laneId, existing);
    return existing;
  }

  // For callers that have no value to seed a new lane with, and want the
  // controller only if the lane is already open.
  function peek(laneId: HistoryLaneId): HistoryController<TState> | null {
    const existing = controllers.get(laneId);
    if (!existing) return null;
    touch(laneId, existing);
    return existing;
  }

  return {
    get,
    peek,
    reset,
    discard: (laneId) => {
      controllers.delete(laneId);
    },
    clear: () => {
      controllers.clear();
    },
    retainedLaneIds: () => [...controllers.keys()],
  };
}
