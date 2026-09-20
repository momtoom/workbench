import type { TokenEditorActionContext } from './tokenEditorActionTypes';
import { useTokenCollectionCommands } from './useTokenCollectionCommands';
import { useTokenCommands } from './useTokenCommands';
import { useTokenGroupCommands } from './useTokenGroupCommands';
import { useTokenModeCommands } from './useTokenModeCommands';
import { useTokenScopeCommands } from './useTokenScopeCommands';

export function useTokenEditorActions(context: TokenEditorActionContext) {
  return {
    ...useTokenCollectionCommands(context),
    ...useTokenGroupCommands(context),
    ...useTokenModeCommands(context),
    ...useTokenCommands(context),
    ...useTokenScopeCommands(context),
  };
}

export type TokenEditorActions = ReturnType<typeof useTokenEditorActions>;
