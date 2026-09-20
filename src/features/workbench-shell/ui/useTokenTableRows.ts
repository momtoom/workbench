import { useMemo, useState, type DragEvent as ReactDragEvent } from 'react';
import type { DesignToken, TokenCollection, TokenGroup, TokenReference, TokenRegistry } from '@domain/design-system/tokens/types';
import { moveTokensToGroup } from '@domain/design-system/tokens/operations';
import type { TokenCommit } from './useTokenEditorHistory';

export type TokenTableRow =
  | { type: 'group'; group: TokenGroup }
  | { type: 'token'; token: DesignToken };

export type TokenDropTarget =
  | { type: 'group'; groupId: string }
  | { type: 'token'; tokenId: string };

type UseTokenTableRowsOptions = {
  activeGroupId: string;
  collection: TokenCollection;
  commit: TokenCommit;
  dragTokenId: string | null;
  registry: TokenRegistry;
  selectedTokenRefs: TokenReference[];
  setDragTokenId: (id: string | null) => void;
  visibleTokens: DesignToken[];
};

export function useTokenTableRows({
  activeGroupId,
  collection,
  commit,
  dragTokenId,
  registry,
  selectedTokenRefs,
  setDragTokenId,
  visibleTokens,
}: UseTokenTableRowsOptions) {
  const [dropTarget, setDropTarget] = useState<TokenDropTarget | null>(null);
  const rows = useMemo<TokenTableRow[]>(() => {
    const visibleGroups = activeGroupId === 'all'
      ? collection.groups
      : collection.groups.filter((group) => group.id === activeGroupId);
    const visibleGroupIds = new Set(visibleGroups.map((group) => group.id));
    const ungrouped: DesignToken[] = [];
    const tokensByGroup = new Map<string, DesignToken[]>();

    for (const token of visibleTokens) {
      if (!token.groupId) {
        ungrouped.push(token);
        continue;
      }
      if (!visibleGroupIds.has(token.groupId)) continue;
      const groupTokens = tokensByGroup.get(token.groupId);
      if (groupTokens) {
        groupTokens.push(token);
      } else {
        tokensByGroup.set(token.groupId, [token]);
      }
    }

    return [
      ...ungrouped.map((token) => ({ type: 'token' as const, token })),
      ...visibleGroups.flatMap((group) => [
        { type: 'group' as const, group },
        ...((group.collapsed ? [] : tokensByGroup.get(group.id) ?? []).map((token) => ({
          type: 'token' as const,
          token,
        }))),
      ]),
    ];
  }, [activeGroupId, collection.groups, visibleTokens]);

  function handleTokenDrop(targetToken: DesignToken, event: ReactDragEvent<HTMLTableRowElement>) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    const draggedTokenIds = getDraggedTokenIds(collection, dragTokenId, selectedTokenRefs);
    setDropTarget(null);
    if (draggedTokenIds.length === 0 || draggedTokenIds.includes(targetToken.id)) {
      setDragTokenId(null);
      return;
    }
    commit(
      moveTokensToGroup(registry, collection.id, draggedTokenIds, targetToken.groupId, targetToken.id),
      {
        label: draggedTokenIds.length > 1 ? 'Move tokens' : targetToken.groupId ? 'Move token to group' : 'Move token out of group',
        kind: 'reorder',
        intent: 'reorder',
        target: { kind: 'token-set', collectionId: collection.id, groupId: targetToken.groupId ?? null, refs: draggedTokenIds.map((tokenId) => ({ collectionId: collection.id, tokenId })) },
        identityEffect: 'move',
        selectionAfter: createMovedSelectionSnapshot(collection.id, activeGroupId, draggedTokenIds),
      },
    );
    setDragTokenId(null);
  }

  function handleGroupDrop(groupId: string, event: ReactDragEvent<HTMLTableRowElement>) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    const draggedTokenIds = getDraggedTokenIds(collection, dragTokenId, selectedTokenRefs);
    setDropTarget(null);
    if (draggedTokenIds.length === 0) return;
    commit(
      moveTokensToGroup(registry, collection.id, draggedTokenIds, groupId),
      {
        label: draggedTokenIds.length > 1 ? 'Move tokens to group' : 'Move token to group',
        kind: 'move',
        intent: 'move',
        target: { kind: 'token-set', collectionId: collection.id, groupId, refs: draggedTokenIds.map((tokenId) => ({ collectionId: collection.id, tokenId })) },
        identityEffect: 'move',
        selectionAfter: createMovedSelectionSnapshot(collection.id, activeGroupId, draggedTokenIds),
      },
    );
    setDragTokenId(null);
  }

  function handleTokenDragOver(targetToken: DesignToken, event: ReactDragEvent<HTMLElement>) {
    if (!dragTokenId) return;
    const draggedTokenIds = getDraggedTokenIds(collection, dragTokenId, selectedTokenRefs);
    if (draggedTokenIds.includes(targetToken.id)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDropTarget((current) => (
      current?.type === 'token' && current.tokenId === targetToken.id
        ? current
        : { type: 'token', tokenId: targetToken.id }
    ));
  }

  function handleGroupDragOver(groupId: string, event: ReactDragEvent<HTMLElement>) {
    if (!dragTokenId) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDropTarget((current) => (
      current?.type === 'group' && current.groupId === groupId
        ? current
        : { type: 'group', groupId }
    ));
  }

  function handleDragLeave(event: ReactDragEvent<HTMLElement>) {
    const relatedTarget = event.relatedTarget;
    if (relatedTarget instanceof Node && event.currentTarget.contains(relatedTarget)) return;
    setDropTarget((current) => current === null ? current : null);
  }

  function clearDropTarget() {
    setDropTarget((current) => current === null ? current : null);
  }

  return {
    clearDropTarget,
    dropTarget,
    handleDragLeave,
    handleGroupDragOver,
    handleGroupDrop,
    handleTokenDragOver,
    handleTokenDrop,
    rows,
  };
}

function getDraggedTokenIds(
  collection: TokenCollection,
  dragTokenId: string | null,
  selectedTokenRefs: TokenReference[],
): string[] {
  if (!dragTokenId) return [];

  const selectedTokenIdSet = new Set(
    selectedTokenRefs
      .filter((reference) => reference.collectionId === collection.id)
      .map((reference) => reference.tokenId),
  );
  if (!selectedTokenIdSet.has(dragTokenId)) return [dragTokenId];

  return [...collection.tokens]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .filter((token) => selectedTokenIdSet.has(token.id))
    .map((token) => token.id);
}

function createMovedSelectionSnapshot(
  collectionId: string,
  activeGroupId: string,
  tokenIds: string[],
) {
  const selectedTokenRefs = tokenIds.map((tokenId) => ({ collectionId, tokenId }));
  const activeTokenRef = selectedTokenRefs[0] ?? null;
  return {
    activeTokenCollectionId: collectionId,
    activeTokenGroupId: activeGroupId,
    selectedTokenCollectionId: activeTokenRef?.collectionId ?? null,
    selectedTokenId: activeTokenRef?.tokenId ?? null,
    selectedTokenRefs,
    tokenSelectionAnchorRef: activeTokenRef,
  };
}
