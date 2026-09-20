import { setTokenFieldScope } from '@domain/design-system/tokens/fieldScopes';
import type { InspectorField } from '@domain/design-system/tokens/types';
import type { TokenEditorActionContext } from './tokenEditorActionTypes';

export function useTokenScopeCommands({
  commit,
  registry,
}: TokenEditorActionContext) {
  function toggleTokenFieldScope(collectionId: string, groupId: string | undefined, field: InspectorField, enabled: boolean) {
    commit(
      setTokenFieldScope(registry, field, { collectionId, groupId }, enabled),
      {
        label: enabled ? 'Expose token scope' : 'Hide token scope',
        kind: 'patch',
        intent: 'patch',
        target: { kind: 'token-field-scope', collectionId, groupId: groupId ?? null, field },
        identityEffect: 'preserve',
        cleanup: { fieldScopes: true },
      },
    );
  }

  return {
    toggleTokenFieldScope,
  };
}
