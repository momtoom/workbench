import {
  createCollection,
  deleteCollection,
  duplicateCollection,
  normalizeImportedRegistry,
  renameCollection,
  reorderCollections,
  setCollectionI18n,
  type ReorderPosition,
} from '@domain/design-system/tokens/operations';
import type { TokenRegistry } from '@domain/design-system/tokens/types';
import { importTokensFromSource } from '@domain/design-system/tokens/importSource';
import type { TokenEditorActionContext } from './tokenEditorActionTypes';

export function useTokenCollectionCommands({
  activeCollectionId,
  activeGroupId,
  captureSelection,
  commit,
  registry,
  selectedTokenRef,
  setActiveCollectionId,
  setActiveGroupId,
  setEditingCell,
  setEditingCollectionId,
  setSelectedTokenRef,
}: TokenEditorActionContext) {
  async function importTokensFromFile(file: File) {
    const contents = await file.text();
    const fileName = file.name;
    let imported: TokenRegistry | null = null;
    let mode: 'replace' | 'merge' = 'replace';
    let label = `Import tokens from ${fileName}`;

    /* If the file is a full TokenRegistry JSON, use it as a complete
       replacement. Otherwise fall back
       to the generic importer that merges discovered tokens into an
       `imported` collection on top of the current registry. */
    try {
      const parsed = JSON.parse(contents);
      if (parsed && typeof parsed === 'object' && Array.isArray(parsed.collections)) {
        imported = normalizeImportedRegistry(parsed as TokenRegistry);
      }
    } catch {
      /* not JSON-registry shape — fall through to generic importer */
    }

    if (!imported) {
      const result = importTokensFromSource(registry, contents, fileName);
      if (result.importedCount === 0) {
        commit(registry, null, { tone: 'error', message: `${fileName} did not yield any tokens.` });
        return;
      }
      imported = result.registry;
      mode = 'merge';
      label = `Import ${result.importedCount} token${result.importedCount === 1 ? '' : 's'} from ${fileName}`;
    }

    const firstCollectionId = imported.collections[0]?.id ?? null;
    commit(
      imported,
      {
        label,
        kind: 'import',
        intent: 'import',
        target: { kind: 'token-registry', path: ['imported', fileName] },
        identityEffect: mode === 'replace' ? 'create' : 'preserve',
        provenance: { importedFrom: fileName },
        cleanup: mode === 'replace'
          ? { refs: true, fieldScopes: true, notes: [`Replaced registry with tokens from ${fileName}.`] }
          : { notes: [`Merged tokens from ${fileName} into the imported collection.`] },
        selectionAfter: captureSelection({
          activeTokenCollectionId: mode === 'replace' ? firstCollectionId : activeCollectionId,
          activeTokenGroupId: 'all',
          selectedTokenCollectionId: null,
          selectedTokenId: null,
        }),
      },
      { tone: 'info', message: `${label}. Save to persist it.` },
    );
    if (mode === 'replace' && firstCollectionId) {
      setActiveCollectionId(firstCollectionId);
      setActiveGroupId('all');
      setSelectedTokenRef(null);
    }
  }

  function createTokenCollection() {
    const result = createCollection(registry);
    commit(result.registry, {
      label: 'Create token collection',
      kind: 'create',
      intent: 'create',
      target: { kind: 'token-collection', collectionId: result.collection.id },
      identityEffect: 'create',
      selectionAfter: captureSelection({
        activeTokenCollectionId: result.collection.id,
        activeTokenGroupId: 'all',
        selectedTokenCollectionId: null,
        selectedTokenId: null,
      }),
    });
    setActiveCollectionId(result.collection.id);
    setActiveGroupId('all');
    setSelectedTokenRef(null);
  }

  function selectTokenCollection(collectionId: string) {
    setActiveCollectionId(collectionId);
    setActiveGroupId('all');
    setEditingCell(null);
  }

  function renameTokenCollection(collectionId: string, name: string) {
    const result = renameCollection(registry, collectionId, name);
    commit(
      result.registry,
      {
        label: 'Rename token collection',
        kind: 'patch',
        intent: 'patch',
        target: { kind: 'token-collection', collectionId, field: 'name' },
        identityEffect: 'preserve',
        mergeKey: `collection:${collectionId}:name`,
      },
      result.error ? { tone: 'error', message: result.error } : null,
    );
  }

  function duplicateTokenCollection(collectionId: string) {
    const result = duplicateCollection(registry, collectionId);
    commit(result.registry, {
      label: 'Duplicate token collection',
      kind: 'duplicate',
      intent: 'duplicate',
      target: { kind: 'token-collection', collectionId },
      identityEffect: 'clone',
      selectionAfter: captureSelection({
        activeTokenCollectionId: result.collection.id,
        activeTokenGroupId: 'all',
        selectedTokenCollectionId: null,
        selectedTokenId: null,
      }),
    });
    setActiveCollectionId(result.collection.id);
    setActiveGroupId('all');
    setSelectedTokenRef(null);
  }

  function deleteTokenCollection(collectionId: string) {
    const next = deleteCollection(registry, collectionId);
    const deletesActiveCollection = activeCollectionId === collectionId;
    const selectionAfter = captureSelection({
      activeTokenCollectionId: deletesActiveCollection ? next.collections[0]?.id ?? null : activeCollectionId,
      activeTokenGroupId: deletesActiveCollection ? 'all' : activeGroupId,
      selectedTokenCollectionId: selectedTokenRef?.collectionId === collectionId ? null : selectedTokenRef?.collectionId ?? null,
      selectedTokenId: selectedTokenRef?.collectionId === collectionId ? null : selectedTokenRef?.tokenId ?? null,
    });
    commit(next, {
      label: 'Delete token collection',
      kind: 'delete',
      intent: 'delete',
      target: { kind: 'token-collection', collectionId },
      identityEffect: 'delete',
      cleanup: { refs: true, bindings: true, fieldScopes: true },
      selectionAfter,
    });
    if (deletesActiveCollection) {
      setActiveCollectionId(next.collections[0]?.id ?? '');
      setActiveGroupId('all');
    }
    if (selectedTokenRef?.collectionId === collectionId) setSelectedTokenRef(null);
  }

  function startRenamingCollection(collectionId: string) {
    setEditingCollectionId(collectionId);
  }

  function toggleTokenCollectionI18n(collectionId: string, enabled: boolean) {
    commit(
      setCollectionI18n(registry, collectionId, enabled),
      {
        label: enabled ? 'Mark collection as i18n source' : 'Unmark collection as i18n source',
        kind: 'patch',
        intent: 'patch',
        target: { kind: 'token-collection', collectionId, field: 'extensions.i18n' },
        identityEffect: 'preserve',
        mergeKey: `collection:${collectionId}:i18n`,
      },
    );
  }

  function reorderTokenCollection(sourceCollectionId: string, targetCollectionId: string, position: ReorderPosition) {
    if (sourceCollectionId === targetCollectionId) return;
    commit(
      reorderCollections(registry, sourceCollectionId, targetCollectionId, position),
      {
        label: 'Reorder token collection',
        kind: 'reorder',
        intent: 'reorder',
        target: { kind: 'token-collection', collectionId: sourceCollectionId },
        identityEffect: 'move',
      },
    );
  }

  return {
    createTokenCollection,
    deleteTokenCollection,
    duplicateTokenCollection,
    importTokensFromFile,
    renameTokenCollection,
    reorderTokenCollection,
    selectTokenCollection,
    startRenamingCollection,
    toggleTokenCollectionI18n,
  };
}
