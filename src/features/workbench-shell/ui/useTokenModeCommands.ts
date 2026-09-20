import {
  addMode,
  renameMode,
  removeMode,
  reorderModes,
  setActiveMode,
  type ReorderPosition,
} from '@domain/design-system/tokens/operations';
import type { TokenEditorActionContext } from './tokenEditorActionTypes';

export function useTokenModeCommands({
  commit,
  registry,
  setEditingCell,
}: TokenEditorActionContext) {
  function setActiveTokenMode(collectionId: string, modeId: string) {
    const result = setActiveMode(registry, collectionId, modeId);
    commit(
      result.registry,
      {
        label: 'Set active token mode',
        kind: 'patch',
        intent: 'patch',
        target: { kind: 'token-mode', collectionId, modeId, field: 'activeModeId' },
        identityEffect: 'preserve',
        mergeKey: `collection:${collectionId}:active-mode`,
      },
      result.error ? { tone: 'error', message: result.error } : null,
    );
  }

  function renameTokenMode(collectionId: string, modeId: string, name: string) {
    const result = renameMode(registry, collectionId, modeId, name);
    commit(
      result.registry,
      {
        label: 'Rename token mode',
        kind: 'patch',
        intent: 'patch',
        target: { kind: 'token-mode', collectionId, modeId, field: 'name' },
        identityEffect: 'preserve',
        mergeKey: `mode:${modeId}:name`,
      },
      result.error ? { tone: 'error', message: result.error } : null,
    );
  }

  function addTokenMode(collectionId: string) {
    const result = addMode(registry, collectionId);
    commit(result.registry, {
      label: 'Add token mode',
      kind: 'create',
      intent: 'create',
      target: { kind: 'token-mode', collectionId, modeId: result.mode.id },
      identityEffect: 'create',
    });
  }

  function removeTokenMode(collectionId: string, modeId: string) {
    commit(removeMode(registry, collectionId, modeId), {
      label: 'Remove token mode',
      kind: 'delete',
      intent: 'delete',
      target: { kind: 'token-mode', collectionId, modeId },
      identityEffect: 'delete',
      cleanup: { refs: true, notes: ['Token values for the removed mode are dropped by token domain operations.'] },
    });
    setEditingCell((current) => current?.modeId === modeId ? null : current);
  }

  function reorderTokenMode(collectionId: string, sourceModeId: string, targetModeId: string, position: ReorderPosition) {
    if (sourceModeId === targetModeId) return;
    commit(
      reorderModes(registry, collectionId, sourceModeId, targetModeId, position),
      {
        label: 'Reorder token mode',
        kind: 'reorder',
        intent: 'reorder',
        target: { kind: 'token-mode', collectionId, modeId: sourceModeId },
        identityEffect: 'move',
      },
    );
  }

  return {
    addTokenMode,
    removeTokenMode,
    reorderTokenMode,
    renameTokenMode,
    setActiveTokenMode,
  };
}
