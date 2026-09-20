import type { DragEvent as ReactDragEvent } from 'react';
import {
  createGroup,
  deleteGroup,
  duplicateGroup,
  getGroupAndDescendantIds,
  moveTokenToGroup,
  renameGroup,
  reorderGroups,
  type ReorderPosition,
  setGroupCollapsed,
} from '@domain/design-system/tokens/operations';
import type { TokenEditorActionContext } from './tokenEditorActionTypes';

export function useTokenGroupCommands({
  activeCollection,
  activeGroupId,
  captureSelection,
  commit,
  dragTokenId,
  editingGroupId,
  registry,
  setActiveGroupId,
  setDragTokenId,
  setEditingGroupId,
  setSelectedTokenRef,
}: TokenEditorActionContext) {
  function createTokenGroup() {
    if (!activeCollection) return;
    const result = createGroup(registry, activeCollection.id);
    commit(result.registry, {
      label: 'Create token group',
      kind: 'create',
      intent: 'create',
      target: { kind: 'token-group', collectionId: activeCollection.id, groupId: result.group.id },
      identityEffect: 'create',
      selectionAfter: captureSelection({
        activeTokenCollectionId: activeCollection.id,
        activeTokenGroupId: result.group.id,
        selectedTokenCollectionId: null,
        selectedTokenId: null,
      }),
    });
    setActiveGroupId(result.group.id);
    setSelectedTokenRef(null);
  }

  function renameTokenGroup(groupId: string, name: string) {
    if (!activeCollection) return;
    const result = renameGroup(registry, activeCollection.id, groupId, name);
    commit(
      result.registry,
      {
        label: 'Rename token group',
        kind: 'patch',
        intent: 'patch',
        target: { kind: 'token-group', collectionId: activeCollection.id, groupId, field: 'name' },
        identityEffect: 'preserve',
        mergeKey: `group:${groupId}:name`,
      },
      result.error ? { tone: 'error', message: result.error } : null,
    );
  }

  function dropTokenOnSidebarGroup(groupId: string, event: ReactDragEvent<HTMLDivElement>) {
    if (!activeCollection || !dragTokenId) return;
    event.preventDefault();
    commit(
      moveTokenToGroup(registry, activeCollection.id, dragTokenId, groupId),
      {
        label: 'Move token to group',
        kind: 'move',
        intent: 'move',
        target: { kind: 'token', collectionId: activeCollection.id, groupId, tokenId: dragTokenId },
        identityEffect: 'move',
      },
    );
    setDragTokenId(null);
  }

  function duplicateTokenGroup(groupId: string) {
    if (!activeCollection) return;
    commit(duplicateGroup(registry, activeCollection.id, groupId), {
      label: 'Duplicate token group',
      kind: 'duplicate',
      intent: 'duplicate',
      target: { kind: 'token-group', collectionId: activeCollection.id, groupId },
      identityEffect: 'clone',
    });
  }

  function deleteTokenGroup(groupId: string) {
    if (!activeCollection) return;
    const deletedGroupIds = getGroupAndDescendantIds(activeCollection.groups, groupId);
    const deletesActiveGroup = deletedGroupIds.has(activeGroupId);
    commit(deleteGroup(registry, activeCollection.id, groupId), {
      label: 'Delete token group',
      kind: 'delete',
      intent: 'delete',
      target: { kind: 'token-group', collectionId: activeCollection.id, groupId },
      identityEffect: 'delete',
      cleanup: { fieldScopes: true, notes: ['Deleted group and descendant field scopes are normalized by token domain operations.'] },
      selectionAfter: captureSelection({
        activeTokenCollectionId: activeCollection.id,
        activeTokenGroupId: deletesActiveGroup ? 'all' : activeGroupId,
      }),
    });
    if (deletesActiveGroup) setActiveGroupId('all');
    if (editingGroupId === groupId) setEditingGroupId(null);
  }

  function toggleTokenGroupCollapsed(collectionId: string, groupId: string, collapsed: boolean) {
    commit(
      setGroupCollapsed(registry, collectionId, groupId, collapsed),
      {
        label: collapsed ? 'Collapse token group' : 'Expand token group',
        kind: 'patch',
        intent: 'patch',
        target: { kind: 'token-group', collectionId, groupId, field: 'collapsed' },
        identityEffect: 'preserve',
      },
    );
  }

  function startRenamingGroup(groupId: string) {
    setEditingGroupId(groupId);
  }

  function reorderTokenGroup(sourceGroupId: string, targetGroupId: string, position: ReorderPosition) {
    if (!activeCollection || sourceGroupId === targetGroupId) return;
    commit(
      reorderGroups(registry, activeCollection.id, sourceGroupId, targetGroupId, position),
      {
        label: 'Reorder token group',
        kind: 'reorder',
        intent: 'reorder',
        target: { kind: 'token-group', collectionId: activeCollection.id, groupId: sourceGroupId },
        identityEffect: 'move',
      },
    );
  }

  function selectAllGroups() {
    setActiveGroupId('all');
    setSelectedTokenRef(null);
  }

  function selectTokenGroup(groupId: string) {
    setActiveGroupId(groupId);
    setSelectedTokenRef(null);
  }

  function canDropTokenOnGroup(): boolean {
    return Boolean(dragTokenId);
  }

  function dragOverTokenGroup(event: ReactDragEvent<HTMLDivElement>) {
    if (!dragTokenId) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }

  return {
    canDropTokenOnGroup,
    createTokenGroup,
    deleteTokenGroup,
    dragOverTokenGroup,
    dropTokenOnSidebarGroup,
    duplicateTokenGroup,
    renameTokenGroup,
    reorderTokenGroup,
    selectAllGroups,
    selectTokenGroup,
    startRenamingGroup,
    toggleTokenGroupCollapsed,
  };
}
