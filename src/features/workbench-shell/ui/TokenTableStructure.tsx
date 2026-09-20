import { type DragEvent as ReactDragEvent } from 'react';
import { ChevronDown, ChevronRight, Plus, X } from 'lucide-react';
import { IconButton } from '@shared/ui/primitives';
import type { TokenCollection, TokenGroup } from '@domain/design-system/tokens/types';
import { InlineEditableText } from './InlineEditControls';
import { TokenNameLayout } from './TokenNameLayout';
import type { TokenDropTarget } from './useTokenTableRows';
import type { TokenEditorActions } from './useTokenEditorActions';
import type { TokenTableColumnLayout } from './useTokenTableLayout';

export function TokenTableColGroup({ layout, modes }: { layout: TokenTableColumnLayout; modes: TokenCollection['modes'] }) {
  return (
    <colgroup>
      <col style={{ width: layout.nameColumnWidth }} />
      {modes.map((mode, index) => <col key={mode.id} style={{ width: layout.modeColumnWidths[index] }} />)}
      <col className="wb-token-actions-col" />
    </colgroup>
  );
}

export function ModeHeader({
  collection,
  draggable,
  endMergeSession,
  mode,
  onDragEnd,
  onDragStart,
  showAddMode,
  startMergeSession,
  tokenActions,
}: {
  collection: TokenCollection;
  draggable?: boolean;
  endMergeSession: (mergeKey: string) => void;
  mode: TokenCollection['modes'][number];
  onDragEnd?: (event: ReactDragEvent<HTMLDivElement>) => void;
  onDragStart?: (event: ReactDragEvent<HTMLDivElement>) => void;
  showAddMode: boolean;
  startMergeSession: (mergeKey: string) => void;
  tokenActions: TokenEditorActions;
}) {
  const canRemove = collection.modes.length > 1 && collection.modes.some((candidate) => candidate.id === mode.id);
  const modeNameMergeKey = `mode:${mode.id}:name`;

  return (
    <div
      className={collection.activeMode === mode.id ? 'wb-mode-header wb-mode-header--active' : 'wb-mode-header'}
      draggable={draggable}
      onClick={() => tokenActions.setActiveTokenMode(collection.id, mode.id)}
      onDragEnd={onDragEnd}
      onDragStart={onDragStart}
    >
      <InlineEditableText
        className="wb-token-table-text-field"
        editLabel={`Rename mode ${mode.name}`}
        emptyLabel="Untitled mode"
        startOnClick={false}
        startOnDoubleClick
        title="Double-click to rename mode"
        value={mode.name}
        onEditStart={() => {
          startMergeSession(modeNameMergeKey);
          tokenActions.setActiveTokenMode(collection.id, mode.id);
        }}
        onEditEnd={() => endMergeSession(modeNameMergeKey)}
        onCommit={(value) => tokenActions.renameTokenMode(collection.id, mode.id, value)}
      />
      <div className="wb-mode-header-actions">
        {canRemove ? (
          <IconButton label={`Remove mode ${mode.name}`} title="Remove mode" tone="danger" onClick={() => tokenActions.removeTokenMode(collection.id, mode.id)}>
            <X size={13} />
          </IconButton>
        ) : null}
        {showAddMode ? (
          <IconButton
            label="Add mode"
            title="Add mode"
            onClick={() => tokenActions.addTokenMode(collection.id)}
          >
            <Plus size={13} />
          </IconButton>
        ) : null}
      </div>
    </div>
  );
}

export function GroupRow({
  collection,
  dropTarget,
  group,
  dragTokenId,
  handleDragLeave,
  handleGroupDragOver,
  handleGroupDrop,
  modeCount,
  tokenActions,
}: {
  collection: TokenCollection;
  dropTarget: TokenDropTarget | null;
  group: TokenGroup;
  dragTokenId: string | null;
  handleDragLeave: (event: ReactDragEvent<HTMLElement>) => void;
  handleGroupDragOver: (groupId: string, event: ReactDragEvent<HTMLElement>) => void;
  handleGroupDrop: (groupId: string, event: ReactDragEvent<HTMLTableRowElement>) => void;
  modeCount: number;
  tokenActions: TokenEditorActions;
}) {
  const isDropTarget = dropTarget?.type === 'group' && dropTarget.groupId === group.id;

  return (
    <tr
      className={isDropTarget ? 'wb-token-group-row wb-token-group-row--drop-target' : 'wb-token-group-row'}
      onDragLeave={handleDragLeave}
      onDragOver={(event) => handleGroupDragOver(group.id, event)}
      onDrop={(event) => handleGroupDrop(group.id, event)}
    >
      <td className="wb-group-band-cell">
        <TokenNameLayout
          className={dragTokenId ? 'wb-token-name-layout--drop-target' : undefined}
          handle={(
            <IconButton label={group.collapsed ? 'Expand group' : 'Collapse group'} onClick={() => tokenActions.toggleTokenGroupCollapsed(collection.id, group.id, !group.collapsed)}>
              {group.collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
            </IconButton>
          )}
        >
          <span className="wb-group-name-label">{group.name}</span>
        </TokenNameLayout>
      </td>
      {Array.from({ length: modeCount }, (_, index) => (
        <td key={`${group.id}-mode-band-${index}`} className="wb-group-band-fill" aria-hidden="true" />
      ))}
      <td className="wb-group-band-fill wb-token-actions-fill-cell" aria-hidden="true" />
    </tr>
  );
}
