import type {
  DragEvent as ReactDragEvent,
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
  ReactNode,
  Ref,
} from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Copy, Pencil, Trash2 } from 'lucide-react';
import { Button, IconButton, SearchField, TextField } from '@shared/ui/primitives';
import type { TokenCollection, TokenRegistry } from '@domain/design-system/tokens/types';
import type { TokenEditorActions } from './useTokenEditorActions';
import { InlineEditActions, InlineEditFrame } from './InlineEditControls';
import {
  WorkbenchEditorSidebar,
  WorkbenchPanelFooter,
  WorkbenchSidebarSplitHandle,
} from './WorkbenchEditorShell';
import {
  WorkbenchSidebarMeta,
  WorkbenchSidebarRow,
  WorkbenchSidebarRowList,
  WorkbenchSidebarSectionHeader,
  type WorkbenchSidebarDropPosition,
} from './WorkbenchSidebarPrimitives';

type TokenEditorSidebarProps = {
  activeCollection: TokenCollection | null;
  activeGroupId: string;
  collectionListHeight: number;
  editingCollectionId: string | null;
  editingGroupId: string | null;
  endMergeSession: (mergeKey: string) => void;
  groupCounts: Map<string, number>;
  initialSearchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
  registry: TokenRegistry;
  setEditingCollectionId: (id: string | null) => void;
  setEditingGroupId: (id: string | null) => void;
  sidebarRef: Ref<HTMLElement>;
  startMergeSession: (mergeKey: string) => void;
  startSidebarPanelResize: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  surfaceNav?: ReactNode;
  tokenActions: TokenEditorActions;
};

type SidebarReorderKind = 'collection' | 'group';
type SidebarDropTarget = {
  id: string;
  kind: SidebarReorderKind;
  position: WorkbenchSidebarDropPosition;
};

export function TokenEditorSidebar({
  activeCollection,
  activeGroupId,
  collectionListHeight,
  editingCollectionId,
  editingGroupId,
  endMergeSession,
  groupCounts,
  initialSearchQuery = '',
  onSearchQueryChange,
  registry,
  setEditingCollectionId,
  setEditingGroupId,
  sidebarRef,
  startMergeSession,
  startSidebarPanelResize,
  surfaceNav,
  tokenActions,
}: TokenEditorSidebarProps) {
  const [draggedCollectionId, setDraggedCollectionId] = useState<string | null>(null);
  const [draggedGroupId, setDraggedGroupId] = useState<string | null>(null);
  const [sidebarDropTarget, setSidebarDropTarget] = useState<SidebarDropTarget | null>(null);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const importFileInputRef = useRef<HTMLInputElement>(null);

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const matchesSearchQuery = (name: string): boolean =>
    normalizedSearchQuery === '' || name.toLowerCase().includes(normalizedSearchQuery);
  // A collection is visible when its own name matches, or any of its group names matches.
  // (When the search is empty everything is visible.)
  const visibleCollections = useMemo(() => (
    normalizedSearchQuery === ''
      ? registry.collections
      : registry.collections.filter((collection) => (
          matchesSearchQuery(collection.name)
          || collection.groups.some((group) => matchesSearchQuery(group.name))
        ))
  ), [registry.collections, normalizedSearchQuery]);
  const visibleGroups = useMemo(() => (
    !activeCollection
      ? []
      : normalizedSearchQuery === ''
        ? activeCollection.groups
        : activeCollection.groups.filter((group) => matchesSearchQuery(group.name))
  ), [activeCollection, normalizedSearchQuery]);

  function clearSidebarDragState() {
    setDraggedCollectionId(null);
    setDraggedGroupId(null);
    setSidebarDropTarget(null);
  }

  function startCollectionDrag(collectionId: string, event: ReactDragEvent<HTMLElement>) {
    if (shouldIgnoreSidebarDragStart(event.target)) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('application/workbench-token-collection', collectionId);
    setDraggedCollectionId(collectionId);
    setSidebarDropTarget(null);
  }

  function dragOverCollection(collectionId: string, event: ReactDragEvent<HTMLDivElement>) {
    if (!draggedCollectionId || draggedCollectionId === collectionId) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setSidebarDropTarget({ kind: 'collection', id: collectionId, position: getVerticalDropPosition(event) });
  }

  function dropCollection(collectionId: string, event: ReactDragEvent<HTMLDivElement>) {
    if (!draggedCollectionId || draggedCollectionId === collectionId) return;
    event.preventDefault();
    tokenActions.reorderTokenCollection(draggedCollectionId, collectionId, getVerticalDropPosition(event));
    clearSidebarDragState();
  }

  function startGroupDrag(groupId: string, event: ReactDragEvent<HTMLElement>) {
    if (shouldIgnoreSidebarDragStart(event.target)) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('application/workbench-token-group', groupId);
    setDraggedGroupId(groupId);
    setSidebarDropTarget(null);
  }

  function dragOverGroup(groupId: string, event: ReactDragEvent<HTMLDivElement>) {
    if (!draggedGroupId) {
      tokenActions.dragOverTokenGroup(event);
      return;
    }
    if (draggedGroupId === groupId) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setSidebarDropTarget({ kind: 'group', id: groupId, position: getVerticalDropPosition(event) });
  }

  function dropGroup(groupId: string, event: ReactDragEvent<HTMLDivElement>) {
    if (draggedGroupId) {
      if (draggedGroupId !== groupId) {
        event.preventDefault();
        tokenActions.reorderTokenGroup(draggedGroupId, groupId, getVerticalDropPosition(event));
      }
      clearSidebarDragState();
      return;
    }
    tokenActions.dropTokenOnSidebarGroup(groupId, event);
  }

  function handleSidebarDragLeave(event: ReactDragEvent<HTMLDivElement>) {
    const relatedTarget = event.relatedTarget;
    if (relatedTarget instanceof Node && event.currentTarget.contains(relatedTarget)) return;
    setSidebarDropTarget(null);
  }

  function handleSearchQueryChange(nextQuery: string) {
    setSearchQuery(nextQuery);
    onSearchQueryChange?.(nextQuery);
  }

  return (
    <WorkbenchEditorSidebar
      ref={sidebarRef}
      className={activeCollection ? 'wb-token-sidebar' : 'wb-token-sidebar wb-token-sidebar--empty-state'}
      ariaLabel="Token navigation"
      navigation={surfaceNav}
      primaryListHeight={collectionListHeight}
    >
      <div className="wb-token-sidebar-search">
        <SearchField
          aria-label="Search collections and groups"
          className="wb-token-sidebar-search-input"
          clearLabel="Clear collection and group search"
          placeholder="Search collections / groups"
          value={searchQuery}
          onValueChange={handleSearchQueryChange}
        />
      </div>
      <WorkbenchSidebarSectionHeader title="Collections" actionLabel="Create collection" density="compact" onAction={tokenActions.createTokenCollection} />
      <WorkbenchSidebarRowList className="wb-token-sidebar-list wb-token-sidebar-list--collections" ariaLabel="Collections" density="compact">
        {visibleCollections.length === 0 ? (
          <div className="wb-token-sidebar-empty">No matching collections</div>
        ) : null}
        {visibleCollections.map((collection) => (
          <CollectionSidebarRow
            key={collection.id}
            activeCollection={activeCollection}
            collection={collection}
            editingCollectionId={editingCollectionId}
            endMergeSession={endMergeSession}
            onDragEnd={clearSidebarDragState}
            onDragLeave={handleSidebarDragLeave}
            onDragOver={(event) => dragOverCollection(collection.id, event)}
            onDragStart={(event) => startCollectionDrag(collection.id, event)}
            onDrop={(event) => dropCollection(collection.id, event)}
            dropPosition={sidebarDropTarget?.kind === 'collection' && sidebarDropTarget.id === collection.id ? sidebarDropTarget.position : null}
            setEditingCollectionId={setEditingCollectionId}
            startMergeSession={startMergeSession}
            tokenActions={tokenActions}
          />
        ))}
      </WorkbenchSidebarRowList>

      {activeCollection ? (
        <>
          <WorkbenchSidebarSplitHandle
            label="Resize collections and groups"
            onPointerDown={startSidebarPanelResize}
          />

          <WorkbenchSidebarSectionHeader title="Groups" actionLabel="Create group" density="compact" onAction={tokenActions.createTokenGroup} />
          <WorkbenchSidebarRowList className="wb-token-sidebar-list wb-token-sidebar-list--groups" ariaLabel="Groups" density="compact">
            {normalizedSearchQuery === '' ? (
              <WorkbenchSidebarRow
                collapseSlot={false}
                density="compact"
                selected={activeGroupId === 'all'}
                label="All"
                meta={<WorkbenchSidebarMeta>{activeCollection.tokens.length}</WorkbenchSidebarMeta>}
                onSelect={tokenActions.selectAllGroups}
              />
            ) : null}
            {visibleGroups.length === 0 && normalizedSearchQuery !== '' ? (
              <div className="wb-token-sidebar-empty">No matching groups</div>
            ) : null}
            {visibleGroups.map((group) => {
              const isActive = activeGroupId === group.id;
              const isEditing = editingGroupId === group.id;
              const groupNameMergeKey = `group:${group.id}:name`;

              return (
                <WorkbenchSidebarRow
                  key={group.id}
                  collapseSlot={false}
                  density="compact"
                  selected={isActive}
                  label={group.name}
                  meta={<WorkbenchSidebarMeta>{groupCounts.get(group.id) ?? 0}</WorkbenchSidebarMeta>}
                  editingControl={isEditing ? (
                    <TokenSidebarRenameControl
                      ariaLabel={`Rename group ${group.name}`}
                      mergeKey={groupNameMergeKey}
                      value={group.name}
                      onCancel={() => setEditingGroupId(null)}
                      onCommit={(value) => tokenActions.renameTokenGroup(group.id, value)}
                      onEditingEnd={() => endMergeSession(groupNameMergeKey)}
                      onEditingStart={() => startMergeSession(groupNameMergeKey)}
                    />
                  ) : null}
                  draggable
                  dropPosition={sidebarDropTarget?.kind === 'group' && sidebarDropTarget.id === group.id ? sidebarDropTarget.position : null}
                  onSelect={() => tokenActions.selectTokenGroup(group.id)}
                  onDragEnd={clearSidebarDragState}
                  onDragLeave={handleSidebarDragLeave}
                  onDragOver={(event) => dragOverGroup(group.id, event)}
                  onDragStart={(event) => startGroupDrag(group.id, event)}
                  onDrop={(event) => dropGroup(group.id, event)}
                  actions={isEditing ? null : (
                    <>
                      <IconButton label={`Rename group ${group.name}`} title="Rename group" onClick={() => tokenActions.startRenamingGroup(group.id)}>
                        <Pencil size={13} />
                      </IconButton>
                      <IconButton label={`Duplicate group ${group.name}`} title="Duplicate group" onClick={() => tokenActions.duplicateTokenGroup(group.id)}>
                        <Copy size={13} />
                      </IconButton>
                      <IconButton label={`Delete group ${group.name}`} title="Delete group" tone="danger" onClick={() => tokenActions.deleteTokenGroup(group.id)}>
                        <Trash2 size={13} />
                      </IconButton>
                    </>
                  )}
                />
              );
            })}
          </WorkbenchSidebarRowList>
        </>
      ) : null}

      <WorkbenchPanelFooter>
        <Button
          tone="ghost"
          onClick={() => importFileInputRef.current?.click()}
        >Import…</Button>
        <input
          ref={importFileInputRef}
          type="file"
          accept=".json,.css,application/json,text/css"
          style={{ display: 'none' }}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void tokenActions.importTokensFromFile(file);
            event.target.value = '';
          }}
        />
      </WorkbenchPanelFooter>
    </WorkbenchEditorSidebar>
  );
}

function CollectionSidebarRow({
  activeCollection,
  collection,
  dropPosition,
  editingCollectionId,
  endMergeSession,
  onDragEnd,
  onDragLeave,
  onDragOver,
  onDragStart,
  onDrop,
  setEditingCollectionId,
  startMergeSession,
  tokenActions,
}: {
  activeCollection: TokenCollection | null;
  collection: TokenCollection;
  dropPosition?: WorkbenchSidebarDropPosition | null;
  editingCollectionId: string | null;
  endMergeSession: (mergeKey: string) => void;
  onDragEnd?: (event: ReactDragEvent<HTMLElement>) => void;
  onDragLeave?: (event: ReactDragEvent<HTMLDivElement>) => void;
  onDragOver?: (event: ReactDragEvent<HTMLDivElement>) => void;
  onDragStart?: (event: ReactDragEvent<HTMLElement>) => void;
  onDrop?: (event: ReactDragEvent<HTMLDivElement>) => void;
  setEditingCollectionId: (id: string | null) => void;
  startMergeSession: (mergeKey: string) => void;
  tokenActions: TokenEditorActions;
}) {
  const isActive = collection.id === activeCollection?.id;
  const isEditing = editingCollectionId === collection.id;
  const collectionNameMergeKey = `collection:${collection.id}:name`;

  return (
    <WorkbenchSidebarRow
      collapseSlot={false}
      density="compact"
      selected={isActive}
      label={collection.name}
      meta={<WorkbenchSidebarMeta>{`${collection.tokens.length} tokens · ${collection.modes.length} modes`}</WorkbenchSidebarMeta>}
      editingControl={isEditing ? (
        <TokenSidebarRenameControl
          ariaLabel={`Rename collection ${collection.name}`}
          mergeKey={collectionNameMergeKey}
          value={collection.name}
          onCancel={() => setEditingCollectionId(null)}
          onCommit={(value) => tokenActions.renameTokenCollection(collection.id, value)}
          onEditingEnd={() => endMergeSession(collectionNameMergeKey)}
          onEditingStart={() => startMergeSession(collectionNameMergeKey)}
        />
      ) : null}
      draggable
      dropPosition={dropPosition}
      onSelect={() => tokenActions.selectTokenCollection(collection.id)}
      onDragEnd={onDragEnd}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDragStart={onDragStart}
      onDrop={onDrop}
      actions={isEditing ? null : (
        <>
          <IconButton label={`Rename collection ${collection.name}`} title="Rename collection" onClick={() => tokenActions.startRenamingCollection(collection.id)}>
            <Pencil size={13} />
          </IconButton>
          <IconButton label={`Duplicate collection ${collection.name}`} title="Duplicate collection" onClick={() => tokenActions.duplicateTokenCollection(collection.id)}>
            <Copy size={13} />
          </IconButton>
          <IconButton label={`Delete collection ${collection.name}`} title="Delete collection" tone="danger" onClick={() => tokenActions.deleteTokenCollection(collection.id)}>
            <Trash2 size={13} />
          </IconButton>
        </>
      )}
    />
  );
}

function TokenSidebarRenameControl({
  ariaLabel,
  onCancel,
  onCommit,
  onEditingEnd,
  onEditingStart,
  value,
}: {
  ariaLabel: string;
  mergeKey: string;
  onCancel: () => void;
  onCommit: (value: string) => void;
  onEditingEnd: () => void;
  onEditingStart: () => void;
  value: string;
}) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    onEditingStart();
    return onEditingEnd;
  }, [onEditingEnd, onEditingStart]);

  function commitDraft() {
    const nextValue = draft.trim();
    if (nextValue && nextValue !== value) onCommit(nextValue);
    onCancel();
  }

  function cancelDraft() {
    setDraft(value);
    onCancel();
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      commitDraft();
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      cancelDraft();
    }
  }

  return (
    <InlineEditFrame>
      <input
        autoFocus
        aria-label={ariaLabel}
        className="wb-inline-edit-input"
        type="text"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={handleKeyDown}
      />
      <InlineEditActions onCancel={cancelDraft} onCommit={commitDraft} />
    </InlineEditFrame>
  );
}

function getVerticalDropPosition(event: ReactDragEvent<HTMLElement>): WorkbenchSidebarDropPosition {
  const rect = event.currentTarget.getBoundingClientRect();
  return event.clientY < rect.top + rect.height / 2 ? 'before' : 'after';
}

function shouldIgnoreSidebarDragStart(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest('.wb-sidebar-item-actions, input, select, textarea, .wb-inline-edit-frame'));
}
