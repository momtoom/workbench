import { useEffect, useMemo, useRef, useState, type SetStateAction } from 'react';
import {
  createHistoryController,
  getHistoryLaneId,
  type CommitEditInput,
  type EditOwner,
  type WorkbenchEditKind,
  type WorkbenchSelectionSnapshot,
} from '@domain/history/historyController';
import { createHistoryControllerStore } from '@domain/history/historyControllerStore';
import type { WorkbenchEditChangeSummary } from '@domain/history/historyChangeSummary';
import { commitEditOperation } from '@domain/editing/editOperationPipeline';
import {
  createFlushHistoryExtensions,
  createWorkbenchFlushOperation,
  type WorkbenchFlushTrigger,
} from '@domain/editing/editFlushOperations';
import type {
  WorkbenchDerivedCachePolicy,
  WorkbenchEditCleanupPlan,
  WorkbenchEditIdentityEffect,
  WorkbenchEditIntent,
  WorkbenchEditOperationInput,
  WorkbenchEditPersistencePlan,
  WorkbenchEditProvenance,
  WorkbenchEditTarget,
  WorkbenchProjectionInvalidation,
} from '@domain/editing/editOperationTypes';
import { createHistoryRegistry, createHistoryTimelineEntry } from '@domain/history/historyRegistry';
import {
  createPersistedHistoryLane,
  getHydratableHistoryLane,
  upsertPersistedHistoryLane,
  type WorkbenchHistoryFile,
} from '@domain/history/historyPersistence';
import {
  saveWorkbenchHistory,
  saveWorkbenchTokenCss,
  saveWorkbenchTokens,
} from '@domain/project/workbenchProjectLoader';
import type { TokenRegistry } from '@domain/design-system/tokens/types';
import { areTokenRegistriesEqual, cloneTokenRegistry } from '@domain/design-system/tokens/registryEquality';

const TOKEN_AUTOSAVE_DELAY_MS = 900;
const TOKEN_HISTORY_MAX_ENTRIES = 500;
const HISTORY_PERSIST_ERROR_MESSAGE = 'History save failed. Current undo still works for this session.';

export type SaveState = 'idle' | 'pending' | 'saving' | 'saved' | 'error';
export type SaveTrigger = 'manual' | 'auto' | 'flush';
export type Notice = { tone: 'info' | 'error'; message: string } | null;
export type TokenCommitOptions = {
  label?: string;
  kind?: WorkbenchEditKind;
  intent?: WorkbenchEditIntent;
  target?: WorkbenchEditTarget;
  identityEffect?: WorkbenchEditIdentityEffect;
  provenance?: WorkbenchEditProvenance;
  persistence?: WorkbenchEditPersistencePlan;
  projection?: WorkbenchProjectionInvalidation;
  cleanup?: WorkbenchEditCleanupPlan;
  cache?: WorkbenchDerivedCachePolicy;
  mergeKey?: string;
  mergeSessionId?: string;
  selectionAfter?: WorkbenchSelectionSnapshot;
  affectedFiles?: string[];
  /** Field-level "what changed", projected into the timeline work log. */
  changes?: WorkbenchEditChangeSummary[];
};
export type TokenCommit = (
  nextRegistry: TokenRegistry,
  optionsOrNotice?: TokenCommitOptions | Notice,
  nextNotice?: Notice,
) => void;

type UseTokenEditorHistoryOptions = {
  captureSelection: () => WorkbenchSelectionSnapshot;
  history: WorkbenchHistoryFile;
  historyPath: string;
  initialRegistry: TokenRegistry;
  initialSaved: boolean;
  onRegistryChange?: (registry: TokenRegistry) => void;
  restoreSelection: (selection: WorkbenchSelectionSnapshot | undefined, nextRegistry: TokenRegistry) => void;
  tokenCssPath: string;
  tokenPath: string;
};

export function useTokenEditorHistory({
  captureSelection,
  history,
  historyPath,
  initialRegistry,
  initialSaved,
  onRegistryChange,
  restoreSelection,
  tokenCssPath,
  tokenPath,
}: UseTokenEditorHistoryOptions) {
  const autosaveTimerRef = useRef<number | null>(null);
  const saveInFlightRef = useRef(false);
  const saveQueuedRef = useRef(false);
  const unmountedRef = useRef(false);
  const historyFileRef = useRef(history);
  const historyPersistInFlightRef = useRef(false);
  const historyPersistQueuedRef = useRef(false);
  const activeMergeSessionsRef = useRef<Record<string, string>>({});
  const historyRegistry = useMemo(() => createHistoryRegistry(history.timeline), [history.timeline]);
  const tokenOwner = useMemo<EditOwner>(() => ({ type: 'tokens', target: tokenPath }), [tokenPath]);
  const tokenLaneId = useMemo(() => getHistoryLaneId(tokenOwner), [tokenOwner]);
  const persistedTokenLane = useMemo(
    () => getHydratableHistoryLane(history, tokenLaneId, initialRegistry, areTokenRegistriesEqual),
    [history, initialRegistry, tokenLaneId],
  );
  // The store is created once, so its `createController` closure would otherwise
  // be pinned to the first render's lane. Revisions are still persisted — they
  // are unsaved-work recovery, not undo — so a lane created later must see the
  // current one.
  const persistedTokenLaneRef = useRef(persistedTokenLane);
  persistedTokenLaneRef.current = persistedTokenLane;
  // One controller per lane for as long as this editor is mounted. The registry
  // memo is keyed on `history.timeline`, so it is rebuilt on every commit — and
  // until this store existed the only thing carrying the stacks across those
  // rebuilds was the copy written into `history.json`. That is precisely why the
  // token lane still persisted undo when source lanes had stopped.
  const tokenHistoryStoreRef = useRef(createHistoryControllerStore<TokenRegistry>({
    createController: (laneId, initialValue) => createHistoryController<TokenRegistry>({
      laneId,
      initialValue,
      initialSaved,
      initialRevision: persistedTokenLaneRef.current?.workingRevision,
      maxEntries: TOKEN_HISTORY_MAX_ENTRIES,
      cloneState: cloneTokenRegistry,
      equalsState: areTokenRegistriesEqual,
    }),
  }));
  const tokenHistory = useMemo(() => {
    const controller = tokenHistoryStoreRef.current.get(tokenLaneId, initialRegistry);
    historyRegistry.setActiveLaneId(tokenLaneId);
    return controller;
  }, [historyRegistry, tokenLaneId, initialRegistry]);
  const [registry, setRegistry] = useState<TokenRegistry>(initialRegistry);
  const [, setHistoryRenderVersion] = useState(0);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [notice, setNotice] = useState<Notice>(null);

  const historySnapshot = tokenHistory.getSnapshot();
  const isDirty = historySnapshot.isDirty;

  function refreshHistoryView() {
    setHistoryRenderVersion((version) => version + 1);
  }

  function setSaveStateIfMounted(action: SetStateAction<SaveState>) {
    if (unmountedRef.current) return;
    setSaveState(action);
  }

  function setNoticeIfMounted(nextNotice: Notice) {
    if (unmountedRef.current) return;
    setNotice(nextNotice);
  }

  function publishRegistry(nextRegistry: TokenRegistry) {
    setRegistry(nextRegistry);
    onRegistryChange?.(cloneTokenRegistry(nextRegistry));
  }

  useEffect(() => {
    const snapshot = tokenHistory.getSnapshot();
    if (areTokenRegistriesEqual(registry, initialRegistry)) return;

    if (snapshot.isDirty) {
      setNoticeIfMounted({
        tone: 'info',
        message: 'Token registry changed outside the editor. Save or reload the token editor to pick up the latest registry.',
      });
      return;
    }

    const nextRegistry = cloneTokenRegistry(initialRegistry);
    tokenHistory.replaceValue(nextRegistry, { saved: true });
    setRegistry(nextRegistry);
    refreshHistoryView();
    setSaveStateIfMounted('saved');
    setNoticeIfMounted(null);
  }, [initialRegistry, registry, tokenHistory]);

  function queueHistoryPersist() {
    queueHistoryPersistWithExtensions();
  }

  function queueHistoryPersistWithExtensions(extensions?: Record<string, unknown>) {
    const previousLane = historyFileRef.current.lanes.find((lane) => lane.laneId === tokenLaneId);
    const nextExtensions = {
      ...(previousLane?.extensions ?? {}),
      ...(extensions ?? {}),
    };
    const nextHistory = upsertPersistedHistoryLane(
      historyFileRef.current,
      // The token lane hydrates `initialUndoStack` / `initialRedoStack` from
      // this file above, so its stacks stay persisted until the token editor
      // gets the same session-owned controller source lanes have.
      // Session-only now that the lane owns one controller: nothing hydrates
      // these stacks, and they were 17 MB of the 26 MB left on disk.
      createPersistedHistoryLane(tokenOwner, tokenHistory.getSnapshot(), TOKEN_HISTORY_MAX_ENTRIES, nextExtensions, 'session-only'),
      historyRegistry.getTimeline(),
    );
    historyFileRef.current = nextHistory;
    void flushHistoryPersist();
  }

  async function flushHistoryPersist() {
    if (historyPersistInFlightRef.current) {
      historyPersistQueuedRef.current = true;
      return;
    }

    historyPersistInFlightRef.current = true;
    try {
      do {
        historyPersistQueuedRef.current = false;
        await saveWorkbenchHistory(historyPath, historyFileRef.current);
      } while (historyPersistQueuedRef.current);
    } catch (error) {
      setNoticeIfMounted({ tone: 'error', message: error instanceof Error ? error.message : HISTORY_PERSIST_ERROR_MESSAGE });
    } finally {
      historyPersistInFlightRef.current = false;
    }
  }

  function startMergeSession(mergeKey: string) {
    activeMergeSessionsRef.current[mergeKey] = createMergeSessionId(mergeKey);
  }

  function endMergeSession(mergeKey: string) {
    delete activeMergeSessionsRef.current[mergeKey];
  }

  function getActiveMergeSessionId(mergeKey: string | undefined) {
    return mergeKey ? activeMergeSessionsRef.current[mergeKey] : undefined;
  }

  function clearAutosaveTimer() {
    if (!autosaveTimerRef.current) return;
    window.clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = null;
  }

  function scheduleAutosave(delay = TOKEN_AUTOSAVE_DELAY_MS) {
    clearAutosaveTimer();

    if (!tokenHistory.getSnapshot().isDirty) {
      setSaveStateIfMounted('saved');
      return;
    }

    setSaveStateIfMounted((current) => (current === 'saving' ? current : 'pending'));
    autosaveTimerRef.current = window.setTimeout(() => {
      autosaveTimerRef.current = null;
      void persistTokens('auto');
    }, delay);
  }

  function commit(nextRegistry: TokenRegistry, optionsOrNotice?: TokenCommitOptions | Notice, maybeNotice?: Notice) {
    const options = optionsOrNotice && !isNotice(optionsOrNotice) ? optionsOrNotice : undefined;
    const selectionBefore = captureSelection();
    const optionsWithSession = options?.mergeKey && !options.mergeSessionId
      ? { ...options, mergeSessionId: getActiveMergeSessionId(options.mergeKey) }
      : options;
    const nextNotice = isNotice(optionsOrNotice) ? optionsOrNotice : maybeNotice;
    if (nextRegistry === registry || areTokenRegistriesEqual(nextRegistry, registry)) {
      setNoticeIfMounted(nextNotice ?? null);
      return;
    }
    const pipelineResult = commitEditOperation({
      history: tokenHistory,
      nextValue: nextRegistry,
      input: createTokenCommitInput({
        owner: tokenOwner,
        laneId: tokenLaneId,
        tokenPath,
        options: optionsWithSession,
        selectionBefore,
      }),
      operation: createTokenEditOperation({
        options: optionsWithSession,
        tokenPath,
      }),
      equalsState: areTokenRegistriesEqual,
    });
    if (!pipelineResult.changed) {
      setNoticeIfMounted(nextNotice ?? null);
      return;
    }
    const transaction = pipelineResult.transaction;
    if (transaction) {
      historyRegistry.recordTimelineEntry(createHistoryTimelineEntry(transaction));
      queueHistoryPersist();
    }
    publishRegistry(nextRegistry);
    scheduleAutosave();
    setNoticeIfMounted(nextNotice ?? null);
  }

  function undoTokenEdit() {
    const transaction = tokenHistory.undo();
    if (!transaction) return;

    const nextRegistry = tokenHistory.getSnapshot().value;
    publishRegistry(nextRegistry);
    restoreSelection(transaction.selectionBefore, nextRegistry);
    queueHistoryPersist();
    scheduleAutosave();
    setNoticeIfMounted({ tone: 'info', message: `Undid ${transaction.label}.` });
  }

  function redoTokenEdit() {
    const transaction = tokenHistory.redo();
    if (!transaction) return;

    const nextRegistry = tokenHistory.getSnapshot().value;
    publishRegistry(nextRegistry);
    restoreSelection(transaction.selectionAfter, nextRegistry);
    queueHistoryPersist();
    scheduleAutosave();
    setNoticeIfMounted({ tone: 'info', message: `Redid ${transaction.label}.` });
  }

  useEffect(() => {
    function handleHistoryShortcut(event: KeyboardEvent) {
      const isModifierPressed = event.metaKey || event.ctrlKey;
      if (!isModifierPressed || event.altKey || event.key.toLowerCase() !== 'z') return;

      const snapshot = tokenHistory.getSnapshot();
      if (event.shiftKey) {
        if (!snapshot.canRedo) return;
        event.preventDefault();
        redoTokenEdit();
        return;
      }

      if (!snapshot.canUndo) return;
      event.preventDefault();
      undoTokenEdit();
    }

    window.addEventListener('keydown', handleHistoryShortcut);
    return () => window.removeEventListener('keydown', handleHistoryShortcut);
  });

  useEffect(() => {
    unmountedRef.current = false;

    function flushPendingAutosave() {
      if (!tokenHistory.getSnapshot().isDirty) return;
      void persistTokens('flush');
    }

    window.addEventListener('beforeunload', flushPendingAutosave);
    return () => {
      unmountedRef.current = true;
      if (tokenHistory.getSnapshot().isDirty) {
        void persistTokens('flush');
      } else {
        clearAutosaveTimer();
      }
      window.removeEventListener('beforeunload', flushPendingAutosave);
    };
  }, []);

  async function persistTokens(trigger: SaveTrigger) {
    clearAutosaveTimer();

    if (saveInFlightRef.current) {
      saveQueuedRef.current = true;
      setSaveStateIfMounted('saving');
      return;
    }

    const snapshot = tokenHistory.getSnapshot();
    if (!snapshot.isDirty) {
      if (trigger === 'manual') {
        setSaveStateIfMounted('saved');
        setNoticeIfMounted({ tone: 'info', message: 'Tokens are already saved.' });
      }
      return;
    }

    const revisionToSave = snapshot.workingRevision;
    const registryToSave = cloneTokenRegistry(snapshot.value);
    let savedSuccessfully = false;

    saveInFlightRef.current = true;
    setSaveStateIfMounted('saving');
    try {
      await saveWorkbenchTokens(tokenPath, registryToSave);
      await saveWorkbenchTokenCss(tokenCssPath, registryToSave);
      tokenHistory.markSaved(revisionToSave, registryToSave);
      refreshHistoryView();
      queueHistoryPersistWithExtensions(createTokenFlushHistoryExtensions(trigger, tokenPath, tokenCssPath));
      savedSuccessfully = true;
      const stillDirty = tokenHistory.getSnapshot().isDirty;
      setSaveStateIfMounted(stillDirty ? 'pending' : 'saved');
      setNoticeIfMounted(stillDirty
        ? null
        : {
            tone: 'info',
            message: trigger === 'manual'
              ? 'Saved token JSON and project CSS.'
              : 'Autosaved token JSON and project CSS.',
          });
    } catch (error) {
      setSaveStateIfMounted('error');
      setNoticeIfMounted({ tone: 'error', message: error instanceof Error ? error.message : 'Save failed.' });
    } finally {
      saveInFlightRef.current = false;

      const shouldSaveQueuedEdit = saveQueuedRef.current;
      saveQueuedRef.current = false;

      if (savedSuccessfully && shouldSaveQueuedEdit && tokenHistory.getSnapshot().isDirty) {
        void persistTokens('auto');
      }
    }
  }

  return {
    commit,
    endMergeSession,
    historySnapshot,
    isDirty,
    notice,
    persistTokens,
    redoTokenEdit,
    registry,
    saveState,
    setNotice,
    startMergeSession,
    undoTokenEdit,
  };
}

function createTokenCommitInput({
  owner,
  laneId,
  selectionBefore,
  tokenPath,
  options,
}: {
  owner: EditOwner;
  laneId: CommitEditInput<TokenRegistry>['laneId'];
  selectionBefore: WorkbenchSelectionSnapshot;
  tokenPath: string;
  options?: TokenCommitOptions;
}): CommitEditInput<TokenRegistry> {
  return {
    laneId,
    owner,
    label: options?.label ?? 'Update tokens',
    scope: 'tokens',
    kind: options?.kind ?? 'patch',
    affectedFiles: options?.affectedFiles ?? [tokenPath],
    mergeKey: options?.mergeKey,
    mergeSessionId: options?.mergeSessionId,
    selectionBefore,
    selectionAfter: options?.selectionAfter ?? selectionBefore,
    changes: options?.changes,
  };
}

function createTokenEditOperation({
  tokenPath,
  options,
}: {
  tokenPath: string;
  options?: TokenCommitOptions;
}): WorkbenchEditOperationInput {
  const intent = options?.intent ?? inferTokenIntent(options?.kind);
  return {
    intent,
    target: options?.target ?? { kind: 'token-registry', path: [tokenPath] },
    identityEffect: options?.identityEffect ?? inferTokenIdentityEffect(intent),
    provenance: options?.provenance,
    persistence: options?.persistence ?? {
      boundary: 'autosave',
      affectedFiles: options?.affectedFiles ?? [tokenPath],
    },
    projection: options?.projection ?? {
      invalidates: ['token-css', 'token-query', 'token-usage', 'preview', 'selection'],
      reason: 'Token registry changed.',
    },
    cleanup: options?.cleanup,
    cache: options?.cache ?? {
      strategy: 'discard-derived',
      keys: ['token-css', 'token-query', 'token-usage', 'preview-projection'],
      reason: 'Token edits invalidate disposable token and preview projections.',
    },
  };
}

function createTokenFlushHistoryExtensions(trigger: SaveTrigger, tokenPath: string, tokenCssPath: string): Record<string, unknown> {
  const flushTrigger = getTokenFlushTrigger(trigger);
  return createFlushHistoryExtensions(
    createWorkbenchFlushOperation({
      affectedFiles: [tokenPath, tokenCssPath],
      target: { kind: 'token-registry', path: [tokenPath] },
      trigger: flushTrigger,
    }),
    flushTrigger,
  );
}

function getTokenFlushTrigger(trigger: SaveTrigger): WorkbenchFlushTrigger {
  if (trigger === 'manual') return 'manual';
  if (trigger === 'flush') return 'beforeunload';
  return 'auto';
}

function inferTokenIntent(kind: WorkbenchEditKind | undefined): WorkbenchEditIntent {
  if (kind === 'delete') return 'delete';
  if (kind === 'restore') return 'restore';
  if (kind === 'reorder') return 'reorder';
  if (kind === 'import') return 'import';
  if (kind === 'paste') return 'paste';
  if (kind === 'duplicate') return 'duplicate';
  if (kind === 'move') return 'move';
  if (kind === 'cut') return 'cut';
  if (kind === 'create') return 'create';
  return 'patch';
}

function inferTokenIdentityEffect(intent: WorkbenchEditIntent): WorkbenchEditIdentityEffect {
  if (intent === 'duplicate') return 'clone';
  if (intent === 'paste' || intent === 'import' || intent === 're-import' || intent === 'create') return 'create';
  if (intent === 'move' || intent === 'reorder' || intent === 'cut') return 'move';
  if (intent === 'delete') return 'delete';
  if (intent === 'restore') return 'restore';
  return 'preserve';
}

function createMergeSessionId(mergeKey: string): string {
  return `${mergeKey}:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 8)}`;
}

function isNotice(value: TokenCommitOptions | Notice | undefined): value is Exclude<Notice, null> {
  return Boolean(value && 'tone' in value && 'message' in value);
}
