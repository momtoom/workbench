import type { DesignToken, TokenCollection, TokenType } from '@domain/design-system/tokens/types';
import {
  changeTokenType,
  createToken,
  deleteToken,
  deleteTokens,
  duplicateToken,
  duplicateTokens,
  moveTokenToGroup,
  pasteTokens,
  renameToken,
  updateTokenDescription,
} from '@domain/design-system/tokens/operations';
import type { TokenEditorActionContext } from './tokenEditorActionTypes';

export function useTokenCommands({
  activeGroupId,
  commit,
  registry,
  selectedTokenRefs,
  setEditingCell,
  setSelectedTokenRef,
  setSelectedTokenRefs,
}: TokenEditorActionContext) {
  function createTokenInActiveGroup(collection: TokenCollection) {
    const result = createToken(registry, collection.id, activeGroupId === 'all' ? undefined : activeGroupId);
    commit(result.registry, {
      label: 'Create token',
      kind: 'create',
      intent: 'create',
      target: { kind: 'token', collectionId: collection.id, groupId: result.token.groupId ?? null, tokenId: result.token.id },
      identityEffect: 'create',
      selectionAfter: {
        activeTokenCollectionId: collection.id,
        activeTokenGroupId: activeGroupId,
        selectedTokenCollectionId: collection.id,
        selectedTokenId: result.token.id,
      },
    });
    setSelectedTokenRef({ collectionId: collection.id, tokenId: result.token.id });
    setEditingCell({ tokenId: result.token.id, modeId: collection.modes[0]?.id ?? 'default' });
  }

  function renameDesignToken(collectionId: string, tokenId: string, mergeKey: string, name: string) {
    const result = renameToken(registry, collectionId, tokenId, name);
    commit(
      result.registry,
      {
        label: 'Rename token',
        kind: 'patch',
        intent: 'patch',
        target: { kind: 'token', collectionId, tokenId, field: 'name' },
        identityEffect: 'preserve',
        mergeKey,
      },
      result.error ? { tone: 'error', message: result.error } : null,
    );
  }

  function duplicateDesignToken(collectionId: string, tokenId: string) {
    commit(duplicateToken(registry, collectionId, tokenId), {
      label: 'Duplicate token',
      kind: 'duplicate',
      intent: 'duplicate',
      target: { kind: 'token', collectionId, tokenId },
      identityEffect: 'clone',
    });
  }

  function duplicateSelectedDesignTokens(collection: TokenCollection) {
    const tokenIds = getSelectedTokenIds(collection.id, selectedTokenRefs);
    if (tokenIds.length === 0) return;
    const result = duplicateTokens(registry, collection.id, tokenIds, tokenIds[tokenIds.length - 1]);
    const nextSelection = result.tokenIds.map((tokenId) => ({ collectionId: collection.id, tokenId }));
    commit(result.registry, {
      label: result.tokenIds.length > 1 ? 'Duplicate tokens' : 'Duplicate token',
      kind: 'duplicate',
      intent: 'duplicate',
      target: { kind: 'token-set', collectionId: collection.id, refs: tokenIds.map((tokenId) => ({ collectionId: collection.id, tokenId })) },
      identityEffect: 'clone',
      selectionAfter: createSelectionSnapshot(collection.id, tokenIds[0] ? getTokenGroupId(collection, tokenIds[0]) ?? 'all' : 'all', nextSelection),
    });
    setSelectedTokenRefs(nextSelection);
  }

  function deleteDesignToken(collection: TokenCollection, token: DesignToken, selected: boolean) {
    commit(deleteToken(registry, collection.id, token.id), {
      label: 'Delete token',
      kind: 'delete',
      intent: 'delete',
      target: { kind: 'token', collectionId: collection.id, groupId: token.groupId ?? null, tokenId: token.id },
      identityEffect: 'delete',
      cleanup: { refs: true, bindings: true, notes: ['Dependent token refs are normalized by token domain operations.'] },
      selectionAfter: selected
        ? {
            activeTokenCollectionId: collection.id,
            activeTokenGroupId: token.groupId ?? 'all',
            selectedTokenCollectionId: null,
            selectedTokenId: null,
            selectedTokenRefs: [],
          }
        : undefined,
    });
    if (selected) setSelectedTokenRef(null);
    setEditingCell((current) => current?.tokenId === token.id ? null : current);
  }

  function deleteSelectedDesignTokens(collection: TokenCollection) {
    const tokenIds = getSelectedTokenIds(collection.id, selectedTokenRefs);
    deleteDesignTokens(collection, tokenIds);
  }

  function deleteDesignTokens(collection: TokenCollection, tokenIds: string[]) {
    if (tokenIds.length === 0) return;
    commit(deleteTokens(registry, collection.id, tokenIds), {
      label: tokenIds.length > 1 ? 'Delete tokens' : 'Delete token',
      kind: 'delete',
      intent: 'delete',
      target: { kind: 'token-set', collectionId: collection.id, refs: tokenIds.map((tokenId) => ({ collectionId: collection.id, tokenId })) },
      identityEffect: 'delete',
      cleanup: { refs: true, bindings: true, notes: ['Dependent token refs are normalized by token domain operations.'] },
      selectionAfter: createSelectionSnapshot(collection.id, activeGroupId, []),
    });
    setSelectedTokenRef(null);
    setEditingCell((current) => current && tokenIds.includes(current.tokenId) ? null : current);
  }

  function changeDesignTokenType(collectionId: string, tokenId: string, type: TokenType) {
    commit(
      changeTokenType(registry, collectionId, tokenId, type),
      {
        label: 'Change token type',
        kind: 'patch',
        intent: 'patch',
        target: { kind: 'token', collectionId, tokenId, field: 'type' },
        identityEffect: 'preserve',
      },
    );
    setEditingCell((current) => current?.tokenId === tokenId ? null : current);
  }

  function updateDesignTokenDescription(collectionId: string, tokenId: string, description: string) {
    commit(
      updateTokenDescription(registry, collectionId, tokenId, description),
      {
        label: 'Update token description',
        kind: 'patch',
        intent: 'patch',
        target: { kind: 'token', collectionId, tokenId, field: 'description' },
        identityEffect: 'preserve',
      },
    );
  }

  function moveDesignTokenToGroup(collectionId: string, tokenId: string, groupId: string | undefined) {
    commit(
      moveTokenToGroup(registry, collectionId, tokenId, groupId),
      {
        label: 'Move token to group',
        kind: 'move',
        intent: 'move',
        target: { kind: 'token', collectionId, groupId: groupId ?? null, tokenId },
        identityEffect: 'move',
      },
    );
  }

  function pasteDesignTokens(collection: TokenCollection, tokens: DesignToken[], afterTokenId?: string) {
    if (tokens.length === 0) return;
    const pasteAnchorToken = getVisiblePasteAnchorToken(collection, activeGroupId, afterTokenId);
    const targetGroupId = pasteAnchorToken
      ? pasteAnchorToken.groupId ?? null
      : activeGroupId === 'all' ? null : activeGroupId;
    const result = pasteTokens(registry, collection.id, tokens, pasteAnchorToken?.id, targetGroupId);
    const nextSelection = result.tokenIds.map((tokenId) => ({ collectionId: collection.id, tokenId }));
    commit(result.registry, {
      label: result.tokenIds.length > 1 ? 'Paste tokens' : 'Paste token',
      kind: 'paste',
      intent: 'paste',
      target: { kind: 'token-set', collectionId: collection.id, groupId: targetGroupId, refs: nextSelection },
      identityEffect: 'create',
      provenance: { pastedFrom: 'token-clipboard' },
      selectionAfter: createSelectionSnapshot(collection.id, activeGroupId, nextSelection),
    });
    setSelectedTokenRefs(nextSelection);
  }

  return {
    changeDesignTokenType,
    createTokenInActiveGroup,
    deleteDesignToken,
    deleteDesignTokens,
    deleteSelectedDesignTokens,
    duplicateDesignToken,
    duplicateSelectedDesignTokens,
    moveDesignTokenToGroup,
    pasteDesignTokens,
    renameDesignToken,
    updateDesignTokenDescription,
  };
}

function getSelectedTokenIds(collectionId: string, references: { collectionId: string; tokenId: string }[]): string[] {
  return references
    .filter((reference) => reference.collectionId === collectionId)
    .map((reference) => reference.tokenId);
}

function createSelectionSnapshot(
  collectionId: string,
  activeGroupId: string,
  selectedTokenRefs: { collectionId: string; tokenId: string }[],
) {
  const activeReference = selectedTokenRefs[0] ?? null;
  return {
    activeTokenCollectionId: collectionId,
    activeTokenGroupId: activeGroupId,
    selectedTokenCollectionId: activeReference?.collectionId ?? null,
    selectedTokenId: activeReference?.tokenId ?? null,
    selectedTokenRefs,
    tokenSelectionAnchorRef: activeReference,
  };
}

function getTokenGroupId(collection: TokenCollection, tokenId: string): string | undefined {
  return collection.tokens.find((token) => token.id === tokenId)?.groupId;
}

function getVisiblePasteAnchorToken(
  collection: TokenCollection,
  activeGroupId: string,
  tokenId?: string,
): DesignToken | null {
  if (!tokenId) return null;
  const token = collection.tokens.find((candidate) => candidate.id === tokenId);
  if (!token) return null;
  if (activeGroupId === 'all') return token;
  return token.groupId === activeGroupId ? token : null;
}
