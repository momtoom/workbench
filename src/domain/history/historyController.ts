import type { WorkbenchEditOperationDescriptor } from '@domain/editing/editOperationTypes';
import {
  mergeHistoryChangeSummaries,
  normalizeHistoryChangeSummaries,
  type WorkbenchEditChangeSummary,
} from './historyChangeSummary';

export type EditOwner =
  | { type: 'tokens'; target: string }
  | { type: 'page'; filePath: string }
  | { type: 'component'; filePath: string }
  | { type: 'css-class'; registryPath: string }
  | { type: 'workspace'; projectId: string };

export type HistoryLaneId =
  | `tokens:${string}`
  | `page:${string}`
  | `component:${string}`
  | `css-class:${string}`
  | `workspace:${string}`;

export type WorkbenchEditScope =
  | 'tokens'
  | 'page'
  | 'component'
  | 'css-class'
  | 'selection'
  | 'mixed';

export type WorkbenchEditKind =
  | 'create'
  | 'patch'
  | 'structural'
  | 'delete'
  | 'restore'
  | 'reorder'
  | 'import'
  | 'copy'
  | 'paste'
  | 'cut'
  | 'duplicate'
  | 'move'
  | 'save-flush'
  | 'navigation-flush';

export type WorkbenchSelectionSnapshot = {
  activeDocumentId?: string | null;
  selectedSourceNodeId?: string | null;
  designPreviewDrillPath?: string[];
  collapsedDesignLayerIds?: string[];
  activeInstanceId?: string | null;
  activeTokenCollectionId?: string | null;
  activeTokenGroupId?: string | null;
  selectedTokenCollectionId?: string | null;
  selectedTokenId?: string | null;
  selectedTokenRefs?: Array<{ collectionId: string; tokenId: string }>;
  tokenSelectionAnchorRef?: { collectionId: string; tokenId: string } | null;
};

export type WorkbenchEditTransaction<TState> = {
  id: string;
  laneId: HistoryLaneId;
  owner: EditOwner;
  label: string;
  scope: WorkbenchEditScope;
  kind: WorkbenchEditKind;
  before: TState;
  after: TState;
  affectedFiles: string[];
  selectionBefore?: WorkbenchSelectionSnapshot;
  selectionAfter?: WorkbenchSelectionSnapshot;
  operation?: WorkbenchEditOperationDescriptor;
  createdAt: string;
  mergeKey?: string;
  mergeSessionId?: string;
  /**
   * Compact field-level record of what this transaction changed, projected into
   * the timeline. Optional: structural edits have no single field to name, and
   * an older persisted transaction has none.
   */
  changes?: WorkbenchEditChangeSummary[];
};

export type WorkbenchRevisionState<TState> = {
  value: TState;
  workingRevision: number;
  savedRevision: number;
  historyCursor: number;
  updatedAt: string;
};

export type CommitEditInput<TState> = Omit<
  WorkbenchEditTransaction<TState>,
  'id' | 'before' | 'after' | 'createdAt'
> & {
  id?: string;
  createdAt?: string;
};

export type HistoryControllerSnapshot<TState> = WorkbenchRevisionState<TState> & {
  laneId: HistoryLaneId;
  undoStack: WorkbenchEditTransaction<TState>[];
  redoStack: WorkbenchEditTransaction<TState>[];
  canUndo: boolean;
  canRedo: boolean;
  isDirty: boolean;
};

type HistoryControllerOptions<TState> = {
  laneId: HistoryLaneId;
  initialValue: TState;
  initialSaved?: boolean;
  initialRevision?: number;
  initialUndoStack?: WorkbenchEditTransaction<TState>[];
  initialRedoStack?: WorkbenchEditTransaction<TState>[];
  maxEntries?: number;
  cloneState?: (state: TState) => TState;
  equalsState?: (left: TState, right: TState) => boolean;
  now?: () => string;
  createId?: () => string;
};

export type HistoryController<TState> = {
  getSnapshot: () => HistoryControllerSnapshot<TState>;
  commit: (nextValue: TState, input: CommitEditInput<TState>) => WorkbenchEditTransaction<TState> | null;
  undo: () => WorkbenchEditTransaction<TState> | null;
  redo: () => WorkbenchEditTransaction<TState> | null;
  markSaved: (revision?: number, savedState?: TState) => void;
  replaceValue: (nextValue: TState, options?: { saved?: boolean }) => void;
};

const FALLBACK_MERGE_WINDOW_MS = 2000;

export function createHistoryController<TState>(
  options: HistoryControllerOptions<TState>,
): HistoryController<TState> {
  const maxEntries = options.maxEntries ?? 50;
  const cloneState = options.cloneState ?? ((state: TState) => state);
  const equalsState = options.equalsState;
  const now = options.now ?? (() => new Date().toISOString());
  const createId = options.createId ?? (() => `edit-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`);
  const initialRevision = options.initialRevision ?? (options.initialSaved === false ? 1 : 0);

  let value = cloneState(options.initialValue);
  let savedValue = cloneState(options.initialValue);
  let undoStack: WorkbenchEditTransaction<TState>[] = (options.initialUndoStack ?? []).slice(-maxEntries).map(cloneTransaction);
  let redoStack: WorkbenchEditTransaction<TState>[] = (options.initialRedoStack ?? []).slice(-maxEntries).map(cloneTransaction);
  let workingRevision = initialRevision;
  let savedRevision = options.initialSaved === false ? 0 : initialRevision;
  let updatedAt = now();

  function areStatesEqual(left: TState, right: TState): boolean {
    return equalsState ? equalsState(left, right) : Object.is(left, right);
  }

  function snapshot(): HistoryControllerSnapshot<TState> {
    return {
      laneId: options.laneId,
      value,
      workingRevision,
      savedRevision,
      historyCursor: undoStack.length,
      updatedAt,
      undoStack,
      redoStack,
      canUndo: undoStack.length > 0,
      canRedo: redoStack.length > 0,
      isDirty: equalsState ? !equalsState(value, savedValue) : workingRevision !== savedRevision,
    };
  }

  function commit(nextValue: TState, input: CommitEditInput<TState>): WorkbenchEditTransaction<TState> | null {
    if (Object.is(nextValue, value)) return null;

    const createdAt = input.createdAt ?? now();
    const transaction: WorkbenchEditTransaction<TState> = {
      ...input,
      id: input.id ?? createId(),
      before: cloneState(value),
      after: cloneState(nextValue),
      createdAt,
      changes: normalizeHistoryChangeSummaries(input.changes),
    };

    const previous = undoStack[undoStack.length - 1];
    let committedTransaction = transaction;
    if (previous && canMergeTransactions(previous, transaction)) {
      committedTransaction = {
        ...transaction,
        id: previous.id,
        before: previous.before,
        createdAt: previous.createdAt,
        selectionBefore: previous.selectionBefore,
        // The merged step restores `previous.before`, so its summary has to read
        // from there too — otherwise a scrub reports only its final hop.
        changes: mergeHistoryChangeSummaries(previous.changes, transaction.changes),
      };
      // Merging is the only path that can fold a pair back to where it started.
      // Both emptiness guards run before the merge, against a value that really
      // did differ, so a round trip inside the window would otherwise leave an
      // undo step that restores nothing. The value still moves, so the caller
      // still persists it — only the dead step is dropped.
      undoStack = areStatesEqual(committedTransaction.before, committedTransaction.after)
        ? undoStack.slice(0, -1)
        : [...undoStack.slice(0, -1), committedTransaction];
    } else {
      undoStack = [...undoStack.slice(-(maxEntries - 1)), transaction];
    }

    redoStack = [];
    value = cloneState(nextValue);
    workingRevision += 1;
    updatedAt = createdAt;
    return committedTransaction;
  }

  function undo(): WorkbenchEditTransaction<TState> | null {
    const transaction = undoStack[undoStack.length - 1];
    if (!transaction) return null;

    undoStack = undoStack.slice(0, -1);
    redoStack = [...redoStack.slice(-(maxEntries - 1)), transaction];
    value = cloneState(transaction.before);
    workingRevision += 1;
    updatedAt = now();
    return transaction;
  }

  function redo(): WorkbenchEditTransaction<TState> | null {
    const transaction = redoStack[redoStack.length - 1];
    if (!transaction) return null;

    redoStack = redoStack.slice(0, -1);
    undoStack = [...undoStack.slice(-(maxEntries - 1)), transaction];
    value = cloneState(transaction.after);
    workingRevision += 1;
    updatedAt = now();
    return transaction;
  }

  function markSaved(revision = workingRevision, nextSavedValue = value) {
    savedRevision = revision;
    savedValue = cloneState(nextSavedValue);
    updatedAt = now();
  }

  function replaceValue(nextValue: TState, replaceOptions?: { saved?: boolean }) {
    value = cloneState(nextValue);
    savedValue = cloneState(nextValue);
    undoStack = [];
    redoStack = [];
    workingRevision = replaceOptions?.saved === false ? 1 : 0;
    savedRevision = replaceOptions?.saved === false ? 0 : workingRevision;
    updatedAt = now();
  }

  return {
    getSnapshot: snapshot,
    commit,
    undo,
    redo,
    markSaved,
    replaceValue,
  };
}

function cloneTransaction<TState>(
  transaction: WorkbenchEditTransaction<TState>,
): WorkbenchEditTransaction<TState> {
  return {
    ...transaction,
    before: JSON.parse(JSON.stringify(transaction.before)) as TState,
    after: JSON.parse(JSON.stringify(transaction.after)) as TState,
  };
}

function canMergeTransactions<TState>(
  previous: WorkbenchEditTransaction<TState>,
  next: WorkbenchEditTransaction<TState>,
): boolean {
  if (!previous.mergeKey || previous.mergeKey !== next.mergeKey) return false;
  if (previous.scope !== next.scope || previous.kind !== next.kind) return false;
  if (previous.mergeSessionId || next.mergeSessionId) {
    return Boolean(previous.mergeSessionId && previous.mergeSessionId === next.mergeSessionId);
  }
  return areTransactionsInFallbackMergeWindow(previous, next);
}

function areTransactionsInFallbackMergeWindow<TState>(
  previous: WorkbenchEditTransaction<TState>,
  next: WorkbenchEditTransaction<TState>,
): boolean {
  const previousCreatedAt = Date.parse(previous.createdAt);
  const nextCreatedAt = Date.parse(next.createdAt);
  if (!Number.isFinite(previousCreatedAt) || !Number.isFinite(nextCreatedAt)) return false;
  const elapsed = nextCreatedAt - previousCreatedAt;
  return elapsed >= 0 && elapsed <= FALLBACK_MERGE_WINDOW_MS;
}

export function getHistoryLaneId(owner: EditOwner): HistoryLaneId {
  if (owner.type === 'tokens') return `tokens:${owner.target}`;
  if (owner.type === 'page') return `page:${owner.filePath}`;
  if (owner.type === 'component') return `component:${owner.filePath}`;
  if (owner.type === 'css-class') return `css-class:${owner.registryPath}`;
  return `workspace:${owner.projectId}`;
}
