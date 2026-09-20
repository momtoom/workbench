import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import type { WorkbenchSelectionSnapshot } from '@domain/history/historyController';
import type { WorkbenchHistoryFile } from '@domain/history/historyPersistence';
import type { WorkbenchTokenEditorSessionState } from '@domain/project/workbenchProject';
import type { DesignToken, TokenRegistry } from '@domain/design-system/tokens/types';
import { getTokenDeletionImpact, hasTokenDeletionImpact } from '@domain/design-system/tokens/impact';
import { buildTokenUsageIndex, type TokenUsageSourceInput } from '@domain/design-system/tokens/usageIndex';
import { useTokenEditorActions } from './useTokenEditorActions';
import {
  useTokenEditorHistory,
  type Notice,
  type SaveState,
} from './useTokenEditorHistory';
import { useTokenEditorFilters, type TokenEditorFilterState } from './useTokenEditorFilters';
import { useTokenEditorSidebarLayout } from './useTokenEditorSidebarLayout';
import { useTokenEditorSelection } from './useTokenEditorSelection';
import { TokenEditorSidebar } from './TokenEditorSidebar';
import { TokenEditorToolbar } from './TokenEditorToolbar';
import { TokenScopeBar } from './TokenScopeControls';
import { TokenTable, type EditingCell } from './TokenTable';
import type { TokenTableColumnWidths } from './useTokenTableLayout';
import { TokenDeletionDialog, type TokenDeletionDialogState } from './TokenDeletionDialog';
import { WorkbenchEditorFrame, WorkbenchEditorSurface, WorkbenchResizeHandle } from './WorkbenchEditorShell';

export type TokenEditorSaveStatus = { state: SaveState; message: string } | null;
export type TokenEditorSessionState = WorkbenchTokenEditorSessionState;

type TokenEditorProps = {
  history: WorkbenchHistoryFile;
  historyPath: string;
  initialCollectionListHeight?: number | null;
  initialRegistry: TokenRegistry;
  initialSelection?: WorkbenchSelectionSnapshot;
  initialSessionState?: TokenEditorSessionState | null;
  onCollectionListHeightChange?: (height: number) => void;
  onRegistryChange?: (registry: TokenRegistry) => void;
  onSelectionChange?: (selection: WorkbenchSelectionSnapshot) => void;
  onSessionStateChange?: (state: TokenEditorSessionState) => void;
  onTokenStatusChange?: (status: TokenEditorSaveStatus) => void;
  sidebarWidth: number;
  startSidebarWidthResize: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  surfaceNav?: ReactNode;
  tokenCssPath: string;
  tokenPath: string;
  tokenUsageSources?: TokenUsageSourceInput[];
};

export function TokenEditor({
  history,
  historyPath,
  initialCollectionListHeight,
  initialRegistry,
  initialSelection,
  initialSessionState,
  onCollectionListHeightChange,
  onRegistryChange,
  onSelectionChange,
  onSessionStateChange,
  onTokenStatusChange,
  sidebarWidth,
  startSidebarWidthResize,
  surfaceNav,
  tokenCssPath,
  tokenPath,
  tokenUsageSources = [],
}: TokenEditorProps) {
  /* No automatic seed fallback here. Token presets enter through explicit
     token imports or component-library imports that include token sources. */
  const initialTokenRegistry = initialRegistry;
  const [editingCell, setEditingCell] = useState<EditingCell>(null);
  const [dragTokenId, setDragTokenId] = useState<string | null>(null);
  const [pendingDeletion, setPendingDeletion] = useState<TokenDeletionDialogState | null>(null);
  const [editingCollectionId, setEditingCollectionId] = useState<string | null>(null);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const initialSession = useMemo(() => reconcileTokenEditorSessionState(initialSessionState), [initialSessionState]);
  const sessionQueryRef = useRef(initialSession.query);
  const sessionSidebarSearchQueryRef = useRef(initialSession.sidebarSearchQuery);
  const sessionTypeFilterRef = useRef(initialSession.typeFilter);
  const sessionExtensionsRef = useRef<Record<string, unknown>>(initialSession);
  const tableColumnWidthsByCollectionRef = useRef(cloneTokenTableColumnWidthsByCollection(initialSession.tableColumnWidthsByCollection));
  const emitSessionState = useCallback(() => {
    onSessionStateChange?.({
      ...sessionExtensionsRef.current,
      query: sessionQueryRef.current,
      sidebarSearchQuery: sessionSidebarSearchQueryRef.current,
      tableColumnWidthsByCollection: cloneTokenTableColumnWidthsByCollection(tableColumnWidthsByCollectionRef.current),
      typeFilter: sessionTypeFilterRef.current,
    });
  }, [onSessionStateChange]);
  const handleFiltersChange = useCallback((state: TokenEditorFilterState) => {
    sessionQueryRef.current = state.query;
    sessionTypeFilterRef.current = state.typeFilter;
    emitSessionState();
  }, [emitSessionState]);
  const handleSidebarSearchQueryChange = useCallback((query: string) => {
    sessionSidebarSearchQueryRef.current = query;
    emitSessionState();
  }, [emitSessionState]);
  const handleTokenTableColumnWidthsChange = useCallback((collectionId: string, widths: TokenTableColumnWidths) => {
    tableColumnWidthsByCollectionRef.current = {
      ...tableColumnWidthsByCollectionRef.current,
      [collectionId]: { ...widths },
    };
    emitSessionState();
  }, [emitSessionState]);
  const {
    collectionListHeight,
    sidebarRef,
    startSidebarPanelResize,
  } = useTokenEditorSidebarLayout({
    initialCollectionListHeight,
    onCollectionListHeightChange,
  });
  const {
    activeCollectionId,
    activeGroupId,
    captureSelection: captureTokenSelection,
    clearSelectedTokenRefs,
    restoreSelection: restoreTokenSelectionState,
    selectTokenRange,
    selectedTokenRef,
    selectedTokenRefs,
    setActiveCollectionId,
    setActiveGroupId,
    setSelectedTokenRef: updateSelectedTokenRef,
    setSelectedTokenRefs: updateSelectedTokenRefs,
    toggleSelectedTokenRef,
  } = useTokenEditorSelection({
    initialRegistry: initialTokenRegistry,
    initialSelection,
    onSelectionChange,
  });

  function restoreTokenSelection(selection: WorkbenchSelectionSnapshot | undefined, nextRegistry: TokenRegistry) {
    restoreTokenSelectionState(selection, nextRegistry);
    setEditingCell(null);
  }

  const {
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
  } = useTokenEditorHistory({
    captureSelection: captureTokenSelection,
    history,
    historyPath,
    initialRegistry: initialTokenRegistry,
    initialSaved: initialRegistry.collections.length > 0,
    onRegistryChange,
    restoreSelection: restoreTokenSelection,
    tokenCssPath,
    tokenPath,
  });
  const activeCollection = registry.collections.find((collection) => collection.id === activeCollectionId) ?? registry.collections[0];
  const saveStatus = getTokenSaveStatus(notice, saveState);
  const activeGroup = activeGroupId === 'all'
    ? null
    : activeCollection?.groups.find((group) => group.id === activeGroupId) ?? null;
  const tokenUsageIndex = useMemo(() => buildTokenUsageIndex(registry, tokenUsageSources), [registry, tokenUsageSources]);
  const {
    groupCounts,
    query,
    setQuery,
    setTypeFilter,
    typeFilter,
    visibleTokens,
  } = useTokenEditorFilters({
    activeCollection,
    activeGroupId,
    initialQuery: initialSession.query,
    initialTypeFilter: initialSession.typeFilter,
    onFiltersChange: handleFiltersChange,
  });
  const tokenActions = useTokenEditorActions({
    activeCollection,
    activeCollectionId,
    activeGroupId,
    captureSelection: captureTokenSelection,
    commit,
    dragTokenId,
    editingGroupId,
    registry,
    selectedTokenRef,
    selectedTokenRefs,
    setActiveCollectionId,
    setActiveGroupId,
    setDragTokenId,
    setEditingCell,
    setEditingCollectionId,
    setEditingGroupId,
    setSelectedTokenRef: updateSelectedTokenRef,
    setSelectedTokenRefs: updateSelectedTokenRefs,
  });

  const toolbarTitle = activeCollection
    ? activeGroup ? `${activeCollection.name} / ${activeGroup.name}` : activeCollection.name
    : 'Tokens';
  const tokenEditorRef = useRef<HTMLElement>(null);
  const copiedTokensRef = useRef<DesignToken[]>([]);

  useEffect(() => {
    onTokenStatusChange?.(saveStatus);
  }, [onTokenStatusChange, saveStatus?.message, saveStatus?.state]);

  function exportFullTokenRegistry() {
    downloadJsonFile(
      createFullTokenRegistryExport(registry),
      createTokenRegistryExportFileName(),
    );
    setNotice({
      tone: 'info',
      message: 'Exported full token registry JSON with collections, modes, groups, values, scopes, and extensions.',
    });
  }

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (shouldKeepTokenSelection(target)) return;
      if (!tokenEditorRef.current?.contains(target) || !target.closest('.wb-token-row')) {
        clearSelectedTokenRefs();
      }
    }

    document.addEventListener('pointerdown', handlePointerDown, true);
    return () => document.removeEventListener('pointerdown', handlePointerDown, true);
  }, [clearSelectedTokenRefs]);

  useEffect(() => {
    function handleTokenShortcut(event: KeyboardEvent) {
      if (!activeCollection || shouldIgnoreTokenShortcut(event.target)) return;
      const isModifierPressed = event.metaKey || event.ctrlKey;
      const activeSelection = selectedTokenRefs.filter((reference) => reference.collectionId === activeCollection.id);
      if (activeSelection.length === 0 && !(isModifierPressed && event.key.toLowerCase() === 'v')) return;

      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        const selectedTokens = getSelectedTokens(activeCollection, activeSelection);
        if (selectedTokens.length === 0) return;

        const deletionImpact = getTokenDeletionImpact(tokenUsageIndex, {
          collectionId: activeCollection.id,
          tokens: selectedTokens,
        });
        if (hasTokenDeletionImpact(deletionImpact)) {
          setPendingDeletion({
            collectionId: activeCollection.id,
            impact: deletionImpact,
            tokenIds: selectedTokens.map((token) => token.id),
            tokenCount: selectedTokens.length,
          });
          return;
        }

        tokenActions.deleteSelectedDesignTokens(activeCollection);
        return;
      }

      if (!isModifierPressed || event.altKey) return;

      if (event.key.toLowerCase() === 'd') {
        event.preventDefault();
        tokenActions.duplicateSelectedDesignTokens(activeCollection);
        return;
      }

      if (event.key.toLowerCase() === 'c') {
        event.preventDefault();
        copiedTokensRef.current = getSelectedTokens(activeCollection, activeSelection);
        return;
      }

      if (event.key.toLowerCase() === 'v') {
        if (copiedTokensRef.current.length === 0) return;
        event.preventDefault();
        tokenActions.pasteDesignTokens(activeCollection, copiedTokensRef.current, selectedTokenRef?.tokenId ?? activeSelection[activeSelection.length - 1]?.tokenId);
      }
    }

    window.addEventListener('keydown', handleTokenShortcut);
    return () => window.removeEventListener('keydown', handleTokenShortcut);
  }, [activeCollection, selectedTokenRef, selectedTokenRefs, tokenActions]);

  return (
    <WorkbenchEditorFrame
      ref={tokenEditorRef}
      className="wb-token-editor"
      ariaLabel={activeCollection ? `${activeCollection.name} token editor` : 'Token editor'}
      sidebarWidth={sidebarWidth}
    >
      <TokenEditorSidebar
        activeCollection={activeCollection}
        activeGroupId={activeGroupId}
        collectionListHeight={collectionListHeight}
        editingCollectionId={editingCollectionId}
        editingGroupId={editingGroupId}
        endMergeSession={endMergeSession}
        groupCounts={groupCounts}
        initialSearchQuery={initialSession.sidebarSearchQuery}
        onSearchQueryChange={handleSidebarSearchQueryChange}
        registry={registry}
        setEditingCollectionId={setEditingCollectionId}
        setEditingGroupId={setEditingGroupId}
        sidebarRef={sidebarRef}
        startMergeSession={startMergeSession}
        startSidebarPanelResize={startSidebarPanelResize}
        surfaceNav={surfaceNav}
        tokenActions={tokenActions}
      />

      <WorkbenchResizeHandle
        label="Resize sidebar and token list"
        placement="sidebar"
        title="Resize sidebar and token list"
        onPointerDown={startSidebarWidthResize}
      />

      <WorkbenchEditorSurface className="wb-token-workbench" ariaLabel="Token table surface">
        <TokenEditorToolbar
          canRedo={historySnapshot.canRedo}
          canUndo={historySnapshot.canUndo}
          isDirty={isDirty}
          onExportRegistry={exportFullTokenRegistry}
          onRedo={redoTokenEdit}
          onUndo={undoTokenEdit}
          persistTokens={persistTokens}
          query={query}
          saveState={saveState}
          setQuery={setQuery}
          setTypeFilter={setTypeFilter}
          title={toolbarTitle}
          typeFilter={typeFilter}
        />

        {activeCollection ? (
          <>
            <TokenScopeBar
              activeGroupId={activeGroupId}
              collection={activeCollection}
              registry={registry}
              tokenActions={tokenActions}
            />

            <TokenTable
              activeGroupId={activeGroupId}
              collection={activeCollection}
              registry={registry}
              usageIndex={tokenUsageIndex}
              visibleTokens={visibleTokens}
              selectedTokenRefs={selectedTokenRefs}
              dragTokenId={dragTokenId}
              editingCell={editingCell}
              endMergeSession={endMergeSession}
              initialColumnWidths={tableColumnWidthsByCollectionRef.current[activeCollection.id]}
              onColumnWidthsChange={(widths) => handleTokenTableColumnWidthsChange(activeCollection.id, widths)}
              setDragTokenId={setDragTokenId}
              setEditingCell={setEditingCell}
              selectTokenRange={selectTokenRange}
              setSelectedTokenRef={updateSelectedTokenRef}
              toggleSelectedTokenRef={toggleSelectedTokenRef}
              startMergeSession={startMergeSession}
              commit={commit}
              setNotice={setNotice}
              tokenActions={tokenActions}
            />
          </>
        ) : (
          <section className="wb-token-empty wb-token-empty--table">
            <h2>No token collections</h2>
            <p>Create a collection in the sidebar or import a token file to begin.</p>
          </section>
        )}
      </WorkbenchEditorSurface>
      {pendingDeletion && activeCollection ? (
        <TokenDeletionDialog
          deletion={pendingDeletion}
          onCancel={() => setPendingDeletion(null)}
          onConfirm={() => {
            tokenActions.deleteDesignTokens(activeCollection, pendingDeletion.tokenIds);
            setNotice({
              tone: 'info',
              message: `Deleted ${pendingDeletion.tokenCount} token${pendingDeletion.tokenCount === 1 ? '' : 's'}.`,
            });
            setPendingDeletion(null);
          }}
        />
      ) : null}
    </WorkbenchEditorFrame>
  );
}

function shouldKeepTokenSelection(target: Element): boolean {
  return Boolean(target.closest([
    '.wb-token-row',
    '.wb-token-value-popover',
    '.wb-token-picker-popover',
    '.wb-gradient-modal',
    '.wb-row-more-menu',
    '.wb-popover-panel',
  ].join(',')));
}

function reconcileTokenEditorSessionState(value: TokenEditorSessionState | null | undefined): TokenEditorSessionState {
  return {
    ...(value ?? {}),
    query: typeof value?.query === 'string' ? value.query : '',
    sidebarSearchQuery: typeof value?.sidebarSearchQuery === 'string' ? value.sidebarSearchQuery : '',
    tableColumnWidthsByCollection: cloneTokenTableColumnWidthsByCollection(value?.tableColumnWidthsByCollection),
    typeFilter: value?.typeFilter ?? 'all',
  };
}

function cloneTokenTableColumnWidthsByCollection(
  value: Record<string, TokenTableColumnWidths> | null | undefined,
): Record<string, TokenTableColumnWidths> {
  if (!value) return {};
  const next: Record<string, TokenTableColumnWidths> = {};
  for (const [collectionId, widths] of Object.entries(value)) {
    if (!collectionId || !widths) continue;
    const nextWidths = Object.fromEntries(
      Object.entries(widths).filter((entry): entry is [string, number] => (
        typeof entry[0] === 'string' &&
        entry[0].trim().length > 0 &&
        Number.isFinite(entry[1]) &&
        entry[1] > 0
      )),
    );
    if (Object.keys(nextWidths).length > 0) next[collectionId] = nextWidths;
  }
  return next;
}

function shouldIgnoreTokenShortcut(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  const editable = target.closest('input, textarea, select, [contenteditable="true"], .wb-inline-edit-frame, .wb-gradient-modal, .wb-token-picker-popover');
  return Boolean(editable);
}

function getSelectedTokens(
  collection: NonNullable<TokenRegistry['collections'][number]>,
  references: Array<{ collectionId: string; tokenId: string }>,
): DesignToken[] {
  const selectedIds = new Set(references.map((reference) => reference.tokenId));
  return [...collection.tokens]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .filter((token) => selectedIds.has(token.id))
    .map((token) => JSON.parse(JSON.stringify(token)) as DesignToken);
}

function createFullTokenRegistryExport(registry: TokenRegistry): TokenRegistry {
  return {
    schemaVersion: registry.schemaVersion ?? '0.1',
    collections: registry.collections.map((collection) => ({
      ...collection,
      modes: collection.modes.map((mode) => ({ ...mode })),
      groups: collection.groups.map((group) => ({ ...group })),
      tokens: collection.tokens.map((token) => ({
        ...token,
        values: JSON.parse(JSON.stringify(token.values)) as DesignToken['values'],
        extensions: token.extensions ? { ...token.extensions } : undefined,
      })),
      extensions: collection.extensions ? { ...collection.extensions } : undefined,
    })),
    ...(registry.fieldScopes ? { fieldScopes: JSON.parse(JSON.stringify(registry.fieldScopes)) as TokenRegistry['fieldScopes'] } : null),
    extensions: { ...(registry.extensions ?? {}) },
  };
}

function createTokenRegistryExportFileName(): string {
  const stamp = new Date().toISOString().slice(0, 10);
  return `workbench-tokens-${stamp}.json`;
}

function downloadJsonFile(value: unknown, fileName: string) {
  const blob = new Blob([`${JSON.stringify(value, null, 2)}\n`], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function getTokenSaveStatus(notice: Notice, saveState: SaveState): TokenEditorSaveStatus {
  if (notice) {
    return {
      state: notice.tone === 'error' ? 'error' : saveState,
      message: notice.message,
    };
  }

  if (saveState === 'pending') return { state: 'pending', message: 'Autosave pending.' };
  if (saveState === 'saving') return { state: 'saving', message: 'Saving tokens...' };
  if (saveState === 'saved') return { state: 'saved', message: 'Saved.' };
  if (saveState === 'error') return { state: 'error', message: 'Save failed.' };
  return null;
}
