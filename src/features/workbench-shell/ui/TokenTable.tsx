import { useMemo, useState, type DragEvent as ReactDragEvent } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { GripVertical, Plus } from 'lucide-react';
import type { DesignToken, TokenCollection, TokenReference, TokenRegistry } from '@domain/design-system/tokens/types';
import { getTokenMode, resolveTokenValue } from '@domain/design-system/tokens/resolver';
import type { TokenUsageIndex } from '@domain/design-system/tokens/usageIndex';
import { InlineEditableText } from './InlineEditControls';
import { TokenNameLayout } from './TokenNameLayout';
import { TokenRowActions } from './TokenRowActions';
import type { TokenEditorActions } from './useTokenEditorActions';
import type { Notice, TokenCommit } from './useTokenEditorHistory';
import { useTokenRowSettings } from './useTokenRowSettings';
import { useTokenTableLayout, type TokenTableColumnWidths } from './useTokenTableLayout';
import { type TokenTableRow, useTokenTableRows } from './useTokenTableRows';
import { GroupRow, ModeHeader, TokenTableColGroup } from './TokenTableStructure';
import { TokenValueCells } from './TokenValueEditor';
import { TokenPreview } from './TokenVisuals';

export type EditingCell = { tokenId: string; modeId: string } | null;

const TOKEN_TABLE_ROW_OVERSCAN = 12;
const TOKEN_TABLE_GROUP_ROW_HEIGHT = 34;
const TOKEN_TABLE_TOKEN_ROW_HEIGHT = 38;

type TokenTableProps = {
  activeGroupId: string;
  collection: TokenCollection;
  commit: TokenCommit;
  dragTokenId: string | null;
  editingCell: EditingCell;
  endMergeSession: (mergeKey: string) => void;
  initialColumnWidths?: TokenTableColumnWidths;
  onColumnWidthsChange?: (widths: TokenTableColumnWidths) => void;
  registry: TokenRegistry;
  selectedTokenRefs: TokenReference[];
  setDragTokenId: (id: string | null) => void;
  setEditingCell: (cell: EditingCell) => void;
  selectTokenRange: (collectionId: string, orderedTokenIds: string[], targetReference: TokenReference) => void;
  setNotice: (notice: Notice) => void;
  setSelectedTokenRef: (ref: TokenReference | null) => void;
  toggleSelectedTokenRef: (ref: TokenReference) => void;
  startMergeSession: (mergeKey: string) => void;
  tokenActions: TokenEditorActions;
  usageIndex: TokenUsageIndex;
  visibleTokens: DesignToken[];
};

export function TokenTable({
  activeGroupId,
  collection,
  registry,
  usageIndex,
  visibleTokens,
  selectedTokenRefs,
  dragTokenId,
  editingCell,
  endMergeSession,
  initialColumnWidths,
  onColumnWidthsChange,
  setDragTokenId,
  setEditingCell,
  selectTokenRange,
  setSelectedTokenRef,
  startMergeSession,
  commit,
  setNotice,
  tokenActions,
  toggleSelectedTokenRef,
}: TokenTableProps) {
  const modes = collection.modes.length > 0 ? collection.modes : [{ id: 'default', name: 'Default' }];
  const { openSettingsTokenId, setTokenSettingsOpen } = useTokenRowSettings();
  const {
    columnLayout,
    startModeColumnResize,
    startNameColumnResize,
    tableWrapRef,
  } = useTokenTableLayout(modes, {
    initialColumnWidths,
    layoutKey: collection.id,
    onColumnWidthsChange,
  });
  const [dragModeId, setDragModeId] = useState<string | null>(null);
  const [modeDropTarget, setModeDropTarget] = useState<ModeDropTarget | null>(null);
  const {
    clearDropTarget,
    dropTarget,
    handleDragLeave,
    handleGroupDragOver,
    handleGroupDrop,
    handleTokenDragOver,
    handleTokenDrop,
    rows,
  } = useTokenTableRows({
    activeGroupId,
    collection,
    commit,
    dragTokenId,
    registry,
    setDragTokenId,
    selectedTokenRefs,
    visibleTokens,
  });
  const orderedTokenIds = useMemo(
    () => rows.flatMap((row) => row.type === 'token' ? [row.token.id] : []),
    [rows],
  );
  const rowVirtualizer = useVirtualizer<HTMLDivElement, HTMLTableRowElement>({
    count: rows.length,
    estimateSize: (index) => getEstimatedTokenTableRowHeight(rows[index]),
    getItemKey: (index) => getTokenTableRowKey(rows[index]),
    getScrollElement: () => tableWrapRef.current,
    overscan: TOKEN_TABLE_ROW_OVERSCAN,
  });
  const virtualRows = rowVirtualizer.getVirtualItems();
  const firstVirtualRow = virtualRows[0];
  const lastVirtualRow = virtualRows[virtualRows.length - 1];
  const topSpacerHeight = firstVirtualRow ? firstVirtualRow.start : 0;
  const bottomSpacerHeight = lastVirtualRow ? Math.max(0, rowVirtualizer.getTotalSize() - lastVirtualRow.end) : 0;
  const tableColumnCount = modes.length + 2;
  const selectedTokenIds = useMemo(() => {
    const nextSelectedTokenIds = new Set<string>();
    selectedTokenRefs.forEach((reference) => {
      if (reference.collectionId === collection.id) nextSelectedTokenIds.add(reference.tokenId);
    });
    return nextSelectedTokenIds;
  }, [collection.id, selectedTokenRefs]);
  const selectedTokenCount = selectedTokenIds.size;

  return (
    <div className="wb-token-table-frame">
      <div ref={tableWrapRef} className="wb-token-table-wrap">
        <div className="wb-token-table-header-surface" aria-hidden="true" />
        <table className="wb-token-table" style={{ minWidth: columnLayout.tableMinWidth, width: columnLayout.tableWidth }}>
          <TokenTableColGroup layout={columnLayout} modes={modes} />
          <thead className="wb-token-table-header">
            <tr className="wb-token-header-row">
              <th className="wb-token-name-column" style={{ width: columnLayout.nameColumnWidth }}>
                <span>Name</span>
                <button type="button" className="wb-column-resizer" aria-label="Resize Name column" onPointerDown={startNameColumnResize} />
              </th>
              {modes.map((mode, index) => (
                <th
                  key={mode.id}
                  className={[
                    'wb-token-mode-header-cell',
                    modeDropTarget?.modeId === mode.id && modeDropTarget.position === 'before' ? 'wb-token-mode-header-cell--drop-before' : '',
                    modeDropTarget?.modeId === mode.id && modeDropTarget.position === 'after' ? 'wb-token-mode-header-cell--drop-after' : '',
                  ].filter(Boolean).join(' ')}
                  style={{ width: columnLayout.modeColumnWidths[index] }}
                  onDragLeave={(event) => {
                    const relatedTarget = event.relatedTarget;
                    if (relatedTarget instanceof Node && event.currentTarget.contains(relatedTarget)) return;
                    setModeDropTarget((current) => current === null ? current : null);
                  }}
                  onDragOver={(event) => {
                    if (!dragModeId || dragModeId === mode.id) return;
                    event.preventDefault();
                    event.dataTransfer.dropEffect = 'move';
                    const nextDropTarget = { modeId: mode.id, position: getHorizontalDropPosition(event) };
                    setModeDropTarget((current) => (
                      current?.modeId === nextDropTarget.modeId && current.position === nextDropTarget.position
                        ? current
                        : nextDropTarget
                    ));
                  }}
                  onDrop={(event) => {
                    if (!dragModeId || dragModeId === mode.id) return;
                    event.preventDefault();
                    tokenActions.reorderTokenMode(collection.id, dragModeId, mode.id, getHorizontalDropPosition(event));
                    setDragModeId(null);
                    setModeDropTarget((current) => current === null ? current : null);
                  }}
                >
                  <ModeHeader
                    collection={collection}
                    draggable={modes.length > 1}
                    endMergeSession={endMergeSession}
                    mode={mode}
                    onDragEnd={() => {
                      setDragModeId(null);
                      setModeDropTarget((current) => current === null ? current : null);
                    }}
                    onDragStart={(event) => {
                      if (shouldIgnoreModeDragStart(event.target)) {
                        event.preventDefault();
                        return;
                      }
                      event.dataTransfer.effectAllowed = 'move';
                      event.dataTransfer.setData('application/workbench-token-mode', mode.id);
                      setDragModeId(mode.id);
                      setModeDropTarget((current) => current === null ? current : null);
                    }}
                    showAddMode={index === modes.length - 1}
                    startMergeSession={startMergeSession}
                    tokenActions={tokenActions}
                  />
                  <button type="button" className="wb-column-resizer" aria-label={`Resize ${mode.name} column`} onPointerDown={(event) => startModeColumnResize(mode.id, event)} />
                </th>
              ))}
              <th className="wb-token-actions-column" aria-hidden="true" />
            </tr>
          </thead>
          <tbody>
            <TokenVirtualSpacerRow colSpan={tableColumnCount} height={topSpacerHeight} position="top" />
            {virtualRows.map((virtualRow) => {
              const row = rows[virtualRow.index];
              if (!row) return null;
              if (row.type === 'group') {
                return (
                  <GroupRow
                    key={getTokenTableRowKey(row)}
                    collection={collection}
                    dropTarget={dropTarget}
                    group={row.group}
                    dragTokenId={dragTokenId}
                    handleDragLeave={handleDragLeave}
                    handleGroupDragOver={handleGroupDragOver}
                    handleGroupDrop={handleGroupDrop}
                    modeCount={modes.length}
                    tokenActions={tokenActions}
                  />
                );
              }
              return (
                <TokenRow
                  key={getTokenTableRowKey(row)}
                  collection={collection}
                  commit={commit}
                  clearDropTarget={clearDropTarget}
                  dropTarget={dropTarget}
                  handleDragLeave={handleDragLeave}
                  handleTokenDragOver={handleTokenDragOver}
                  handleTokenDrop={handleTokenDrop}
                  modes={modes}
                  openSettings={openSettingsTokenId === row.token.id}
                  orderedTokenIds={orderedTokenIds}
                  registry={registry}
                  usageIndex={usageIndex}
                  selected={selectedTokenIds.has(row.token.id)}
                  selectedTokenCount={selectedTokenCount}
                  editingCell={editingCell}
                  endMergeSession={endMergeSession}
                  setDragTokenId={setDragTokenId}
                  setEditingCell={setEditingCell}
                  setOpenSettings={(open) => setTokenSettingsOpen(row.token.id, open)}
                  setNotice={setNotice}
                  selectTokenRange={selectTokenRange}
                  setSelectedTokenRef={setSelectedTokenRef}
                  toggleSelectedTokenRef={toggleSelectedTokenRef}
                  startMergeSession={startMergeSession}
                  tokenActions={tokenActions}
                  token={row.token}
                />
              );
            })}
            <TokenVirtualSpacerRow colSpan={tableColumnCount} height={bottomSpacerHeight} position="bottom" />
          </tbody>
        </table>
      </div>
      <button type="button" className="wb-token-create-row" aria-label="Create token" title="Create token" onClick={() => tokenActions.createTokenInActiveGroup(collection)}>
        <Plus size={14} />
        <span>Create token</span>
      </button>
    </div>
  );
}

function TokenVirtualSpacerRow({
  colSpan,
  height,
  position,
}: {
  colSpan: number;
  height: number;
  position: 'top' | 'bottom';
}) {
  if (height <= 0) return null;

  return (
    <tr className="wb-token-virtual-spacer" aria-hidden="true" data-position={position}>
      <td className="wb-token-virtual-spacer-cell" colSpan={colSpan} style={{ height }} />
    </tr>
  );
}

function getTokenTableRowKey(row: TokenTableRow | undefined): string {
  if (!row) return 'missing';
  return row.type === 'group' ? `group:${row.group.id}` : `token:${row.token.id}`;
}

function getEstimatedTokenTableRowHeight(row: TokenTableRow | undefined): number {
  return row?.type === 'group' ? TOKEN_TABLE_GROUP_ROW_HEIGHT : TOKEN_TABLE_TOKEN_ROW_HEIGHT;
}

type ModeDropTarget = {
  modeId: string;
  position: 'before' | 'after';
};

function getHorizontalDropPosition(event: ReactDragEvent<HTMLElement>): ModeDropTarget['position'] {
  const rect = event.currentTarget.getBoundingClientRect();
  return event.clientX < rect.left + rect.width / 2 ? 'before' : 'after';
}

function shouldIgnoreModeDragStart(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest('.wb-column-resizer, .wb-mode-header-actions, input, select, textarea, .wb-inline-edit-frame'));
}

function TokenRow({
  collection,
  commit,
  clearDropTarget,
  dropTarget,
  handleDragLeave,
  handleTokenDragOver,
  handleTokenDrop,
  modes,
  openSettings,
  orderedTokenIds,
  registry,
  usageIndex,
  selected,
  selectedTokenCount,
  editingCell,
  endMergeSession,
  setDragTokenId,
  setEditingCell,
  setOpenSettings,
  setNotice,
  selectTokenRange,
  setSelectedTokenRef,
  toggleSelectedTokenRef,
  startMergeSession,
  tokenActions,
  token,
}: {
  collection: TokenCollection;
  commit: TokenCommit;
  clearDropTarget: () => void;
  dropTarget: { type: 'group'; groupId: string } | { type: 'token'; tokenId: string } | null;
  handleDragLeave: (event: ReactDragEvent<HTMLElement>) => void;
  handleTokenDragOver: (targetToken: DesignToken, event: ReactDragEvent<HTMLElement>) => void;
  handleTokenDrop: (targetToken: DesignToken, event: ReactDragEvent<HTMLTableRowElement>) => void;
  modes: TokenCollection['modes'];
  openSettings: boolean;
  orderedTokenIds: string[];
  registry: TokenRegistry;
  usageIndex: TokenUsageIndex;
  selected: boolean;
  selectedTokenCount: number;
  editingCell: EditingCell;
  endMergeSession: (mergeKey: string) => void;
  setDragTokenId: (id: string | null) => void;
  setEditingCell: (cell: EditingCell) => void;
  setOpenSettings: (open: boolean) => void;
  setNotice: (notice: Notice) => void;
  selectTokenRange: (collectionId: string, orderedTokenIds: string[], targetReference: TokenReference) => void;
  setSelectedTokenRef: (ref: TokenReference | null) => void;
  toggleSelectedTokenRef: (ref: TokenReference) => void;
  startMergeSession: (mergeKey: string) => void;
  tokenActions: TokenEditorActions;
  token: DesignToken;
}) {
  const activeMode = getTokenMode(collection);
  const resolved = resolveTokenValue(token, collection, registry, activeMode);
  const tokenNameMergeKey = `token:${token.id}:name`;
  const isDropTarget = dropTarget?.type === 'token' && dropTarget.tokenId === token.id;

  return (
    <tr
      className={[
        'wb-token-row',
        selected ? 'wb-token-row--selected' : '',
        editingCell?.tokenId === token.id ? 'wb-token-row--editing' : '',
        isDropTarget ? 'wb-token-row--drop-before' : '',
      ].filter(Boolean).join(' ')}
      aria-selected={selected}
      data-collection-id={collection.id}
      data-token-id={token.id}
      draggable
      onClick={(event) => {
        const reference = { collectionId: collection.id, tokenId: token.id };
        if (event.shiftKey) {
          selectTokenRange(collection.id, orderedTokenIds, reference);
          return;
        }
        if (event.metaKey || event.ctrlKey) {
          toggleSelectedTokenRef(reference);
          return;
        }
        setSelectedTokenRef(reference);
      }}
      onDragEnd={() => {
        setDragTokenId(null);
        clearDropTarget();
      }}
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.dropEffect = 'move';
        event.dataTransfer.setData('text/plain', token.id);
        setTokenDragImage(event, selected && selectedTokenCount > 1 ? `${selectedTokenCount} tokens` : token.name);
        setDragTokenId(token.id);
        if (!selected) {
          setSelectedTokenRef({ collectionId: collection.id, tokenId: token.id });
        }
      }}
      onDragLeave={handleDragLeave}
      onDragOver={(event) => handleTokenDragOver(token, event)}
      onDrop={(event) => handleTokenDrop(token, event)}
    >
      <TokenNameCell
        endMergeSession={endMergeSession}
        registry={registry}
        renameTokenFromDraft={(nextName) => tokenActions.renameDesignToken(collection.id, token.id, tokenNameMergeKey, nextName)}
        resolved={resolved}
        startMergeSession={startMergeSession}
        token={token}
        tokenNameMergeKey={tokenNameMergeKey}
      />
      <TokenValueCells
        collection={collection}
        commit={commit}
        editingCell={editingCell}
        modes={modes}
        registry={registry}
        setEditingCell={setEditingCell}
        setNotice={setNotice}
        token={token}
      />
      <td className="wb-token-actions-cell">
        <TokenRowActions
          collection={collection}
          openSettings={openSettings}
          setOpenSettings={setOpenSettings}
          setNotice={setNotice}
          tokenActions={tokenActions}
          token={token}
          usageIndex={usageIndex}
        />
      </td>
    </tr>
  );
}

function setTokenDragImage(event: ReactDragEvent<HTMLTableRowElement>, label: string) {
  const preview = document.createElement('div');
  preview.className = 'wb-token-drag-preview';
  preview.textContent = label;
  document.body.appendChild(preview);
  event.dataTransfer.setDragImage(preview, 12, 14);
  window.setTimeout(() => preview.remove(), 0);
}

function TokenNameCell({
  endMergeSession,
  registry,
  renameTokenFromDraft,
  resolved,
  startMergeSession,
  token,
  tokenNameMergeKey,
}: {
  endMergeSession: (mergeKey: string) => void;
  registry: TokenRegistry;
  renameTokenFromDraft: (nextName: string) => void;
  resolved: ReturnType<typeof resolveTokenValue>;
  startMergeSession: (mergeKey: string) => void;
  token: DesignToken;
  tokenNameMergeKey: string;
}) {
  return (
    <td className="wb-token-name-cell">
      <TokenNameLayout
        handle={(
          <span className="wb-drag-handle" aria-hidden="true">
            <GripVertical size={14} />
          </span>
        )}
        chip={<TokenPreview token={token} resolved={resolved} registry={registry} />}
      >
        <InlineEditableText
          className="wb-token-name-editor"
          editLabel={`Rename token ${token.name}`}
          emptyLabel="Untitled token"
          startOnClick={false}
          startOnDoubleClick
          title="Double-click to rename token"
          value={token.name}
          onEditStart={() => startMergeSession(tokenNameMergeKey)}
          onEditEnd={() => endMergeSession(tokenNameMergeKey)}
          onCommit={renameTokenFromDraft}
        />
      </TokenNameLayout>
    </td>
  );
}
