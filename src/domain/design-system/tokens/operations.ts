import type {
  DesignToken,
  InspectorField,
  TokenCollection,
  TokenFieldScope,
  TokenFieldScopesMap,
  TokenGroup,
  TokenMode,
  TokenRawLiteral,
  TokenReference,
  TokenRegistry,
  TokenType,
  TokenValue,
} from './types';
import { isGradientValue } from './types';
import { cssGradientLiteralToValue, defaultGradientValue, isCssGradientLiteral, makeTokenId, normalizeGradientValue } from './gradient';
import { wouldCreateTokenCycle } from './resolver';
import { validateTokenName } from './compatibility';
import { mapTokenValueReferences, tokenValueReferencesTarget } from './referenceGraph';
import { duplicateTokenFieldScopes } from './fieldScopes';
import { cleanupTokenFieldScopes } from './usageIndex';

export function updateCollection(
  registry: TokenRegistry,
  collectionId: string,
  updater: (collection: TokenCollection) => TokenCollection,
): TokenRegistry {
  return {
    ...registry,
    collections: registry.collections.map((collection) =>
      collection.id === collectionId ? updater(collection) : collection,
    ),
  };
}

export const COLLECTION_I18N_EXTENSION_KEY = 'i18n';

export function setCollectionI18n(
  registry: TokenRegistry,
  collectionId: string,
  enabled: boolean,
): TokenRegistry {
  return updateCollection(registry, collectionId, (collection) => {
    const extensions = { ...(collection.extensions ?? {}) };
    if (enabled) extensions[COLLECTION_I18N_EXTENSION_KEY] = true;
    else delete extensions[COLLECTION_I18N_EXTENSION_KEY];
    return { ...collection, extensions };
  });
}

export function isCollectionI18n(collection: TokenCollection): boolean {
  return collection.extensions?.[COLLECTION_I18N_EXTENSION_KEY] === true;
}

export function createCollection(registry: TokenRegistry): { registry: TokenRegistry; collection: TokenCollection } {
  const index = registry.collections.length + 1;
  const collection: TokenCollection = {
    id: createUniqueTokenId('collection', registry.collections.map((candidate) => candidate.id)),
    name: createUniqueName(`Collection ${index}`, registry.collections.map((candidate) => candidate.name)),
    modes: [{ id: 'default', name: 'Default' }],
    activeMode: 'default',
    groups: [],
    tokens: [],
    extensions: {},
  };
  return { registry: { ...registry, collections: [...registry.collections, collection] }, collection };
}

export function duplicateCollection(registry: TokenRegistry, collectionId: string): { registry: TokenRegistry; collection: TokenCollection } {
  const source = registry.collections.find((collection) => collection.id === collectionId);
  if (!source) return { registry, collection: registry.collections[0]! };
  const nextCollectionId = createUniqueTokenId('collection', registry.collections.map((candidate) => candidate.id));
  const collection: TokenCollection = {
    ...source,
    id: nextCollectionId,
    name: createUniqueName(`${source.name} copy`, registry.collections.map((candidate) => candidate.name)),
    modes: source.modes.map((mode) => ({ ...mode })),
    groups: source.groups.map((group) => ({ ...group })),
    tokens: source.tokens.map((token) => ({
      ...token,
      values: Object.fromEntries(
        Object.entries(token.values).map(([modeId, value]) => [
          modeId,
          retargetCollectionReferences(value, source.id, nextCollectionId),
        ]),
      ),
    })),
  };

  return { registry: { ...registry, collections: [...registry.collections, collection] }, collection };
}

export function renameCollection(registry: TokenRegistry, collectionId: string, name: string): { registry: TokenRegistry; error: string | null } {
  const nextName = name.trim();
  const error = validateDisplayName(nextName, 'Collection');
  if (error) return { registry, error };
  if (registry.collections.some((collection) => collection.id !== collectionId && collection.name === nextName)) {
    return { registry, error: 'Collection name must be unique.' };
  }
  return {
    error: null,
    registry: updateCollection(registry, collectionId, (collection) => ({ ...collection, name: nextName })),
  };
}

export function deleteCollection(registry: TokenRegistry, collectionId: string): TokenRegistry {
  const next = {
    ...registry,
    collections: registry.collections.filter((collection) => collection.id !== collectionId),
  };
  return cleanupReferencesTo(next, { collectionId });
}

export function reorderCollections(
  registry: TokenRegistry,
  sourceCollectionId: string,
  targetCollectionId: string,
  position: ReorderPosition,
): TokenRegistry {
  return {
    ...registry,
    collections: reorderById(registry.collections, sourceCollectionId, targetCollectionId, position),
  };
}

export function addMode(registry: TokenRegistry, collectionId: string): { registry: TokenRegistry; mode: TokenMode } {
  const collection = registry.collections.find((candidate) => candidate.id === collectionId);
  const mode: TokenMode = {
    id: createUniqueTokenId('mode', collection?.modes.map((candidate) => candidate.id) ?? []),
    name: createUniqueName(`Mode ${(collection?.modes.length ?? 0) + 1}`, collection?.modes.map((candidate) => candidate.name) ?? []),
  };
  return {
    mode,
    registry: updateCollection(registry, collectionId, (current) => {
      const firstModeId = current.modes[0]?.id ?? 'default';
      return {
        ...current,
        modes: [...current.modes, mode],
        activeMode: current.activeMode ?? firstModeId,
        tokens: current.tokens.map((token) => ({
          ...token,
          values: {
            ...token.values,
            [mode.id]: token.values[firstModeId] ?? token.values.default ?? { kind: 'raw', value: defaultRawValue(token.type) },
          },
        })),
      };
    }),
  };
}

export function setActiveMode(registry: TokenRegistry, collectionId: string, modeId: string): { registry: TokenRegistry; error: string | null } {
  const collection = registry.collections.find((candidate) => candidate.id === collectionId);
  if (!collection?.modes.some((mode) => mode.id === modeId)) {
    return { registry, error: 'Mode does not exist in this collection.' };
  }
  return {
    error: null,
    registry: updateCollection(registry, collectionId, (collection) => ({ ...collection, activeMode: modeId })),
  };
}

export function renameMode(registry: TokenRegistry, collectionId: string, modeId: string, name: string): { registry: TokenRegistry; error: string | null } {
  const nextName = name.trim();
  const error = validateDisplayName(nextName, 'Mode');
  if (error) return { registry, error };
  const collection = registry.collections.find((candidate) => candidate.id === collectionId);
  if (collection?.modes.some((mode) => mode.id !== modeId && mode.name === nextName)) {
    return { registry, error: 'Mode name must be unique within the collection.' };
  }
  return {
    error: null,
    registry: updateCollection(registry, collectionId, (collection) => ({
      ...collection,
      modes: collection.modes.map((mode) => mode.id === modeId ? { ...mode, name: nextName } : mode),
    })),
  };
}

export function removeMode(registry: TokenRegistry, collectionId: string, modeId: string): TokenRegistry {
  return updateCollection(registry, collectionId, (collection) => {
    if (collection.modes.length <= 1) return collection;
    const modes = collection.modes.filter((mode) => mode.id !== modeId);
    return {
      ...collection,
      modes,
      activeMode: collection.activeMode === modeId ? modes[0]?.id : collection.activeMode,
      tokens: collection.tokens.map((token) => {
        const { [modeId]: _removed, ...values } = token.values;
        return { ...token, values };
      }),
    };
  });
}

export function reorderModes(
  registry: TokenRegistry,
  collectionId: string,
  sourceModeId: string,
  targetModeId: string,
  position: ReorderPosition,
): TokenRegistry {
  return updateCollection(registry, collectionId, (collection) => ({
    ...collection,
    modes: reorderById(collection.modes, sourceModeId, targetModeId, position),
  }));
}

export function createGroup(registry: TokenRegistry, collectionId: string): { registry: TokenRegistry; group: TokenGroup } {
  const collection = registry.collections.find((candidate) => candidate.id === collectionId);
  const group: TokenGroup = {
    id: createUniqueTokenId('group', collection?.groups.map((candidate) => candidate.id) ?? []),
    name: createUniqueName('New Group', collection?.groups.map((candidate) => candidate.name) ?? []),
  };
  return {
    group,
    registry: updateCollection(registry, collectionId, (collection) => ({
      ...collection,
      groups: [...collection.groups, group],
    })),
  };
}

export function renameGroup(registry: TokenRegistry, collectionId: string, groupId: string, name: string): { registry: TokenRegistry; error: string | null } {
  const nextName = name.trim();
  const error = validateDisplayName(nextName, 'Group');
  if (error) return { registry, error };
  const collection = registry.collections.find((candidate) => candidate.id === collectionId);
  if (collection?.groups.some((group) => group.id !== groupId && group.name === nextName)) {
    return { registry, error: 'Group name must be unique within the collection.' };
  }
  return {
    error: null,
    registry: updateCollection(registry, collectionId, (collection) => ({
      ...collection,
      groups: collection.groups.map((group) => group.id === groupId ? { ...group, name: nextName } : group),
    })),
  };
}

export function setGroupCollapsed(registry: TokenRegistry, collectionId: string, groupId: string, collapsed: boolean): TokenRegistry {
  return updateCollection(registry, collectionId, (collection) => ({
    ...collection,
    groups: collection.groups.map((group) => group.id === groupId ? { ...group, collapsed } : group),
  }));
}

export function deleteGroup(registry: TokenRegistry, collectionId: string, groupId: string): TokenRegistry {
  const collection = registry.collections.find((candidate) => candidate.id === collectionId);
  if (!collection) return registry;
  const deleted = getGroupAndDescendantIds(collection.groups, groupId);
  const next = updateCollection(registry, collectionId, (current) => ({
    ...current,
    groups: current.groups.filter((group) => !deleted.has(group.id)),
    tokens: current.tokens.map((token) =>
      token.groupId && deleted.has(token.groupId) ? { ...token, groupId: undefined } : token,
    ),
  }));
  return {
    ...next,
    fieldScopes: cleanupTokenFieldScopes(next.fieldScopes, { collectionId, groupIds: deleted }),
  };
}

export function duplicateGroup(registry: TokenRegistry, collectionId: string, groupId: string): TokenRegistry {
  const collection = registry.collections.find((candidate) => candidate.id === collectionId);
  const source = collection?.groups.find((group) => group.id === groupId);
  if (!collection || !source) return registry;

  const copiedGroupIds = getGroupAndDescendantIds(collection.groups, groupId);
  const usedGroupIds = new Set(collection.groups.map((group) => group.id));
  const usedGroupNames = new Set(collection.groups.map((group) => group.name));
  const groupIdMap = new Map<string, string>();
  for (const copiedGroupId of copiedGroupIds) {
    groupIdMap.set(copiedGroupId, createUniqueTokenIdFromSet('group', usedGroupIds));
  }

  const tokensToCopy = collection.tokens.filter((token) => token.groupId && copiedGroupIds.has(token.groupId));
  const usedTokenIds = new Set(collection.tokens.map((token) => token.id));
  const tokenIdMap = new Map(tokensToCopy.map((token) => [token.id, createUniqueTokenIdFromSet('token', usedTokenIds)]));
  const usedTokenNames = new Set(collection.tokens.map((token) => token.name));
  const nextSortOrderStart = Math.max(0, ...collection.tokens.map((token) => token.sortOrder)) + 1;

  const copiedGroups = collection.groups
    .filter((group) => copiedGroupIds.has(group.id))
    .map((group) => ({
      ...group,
      id: groupIdMap.get(group.id) ?? makeTokenId('group'),
      name: createUniqueNameFromSet(group.id === groupId ? `${group.name} copy` : group.name, usedGroupNames),
      parentGroupId: group.parentGroupId && copiedGroupIds.has(group.parentGroupId)
        ? groupIdMap.get(group.parentGroupId)
        : group.parentGroupId,
      collapsed: false,
    }));

  const copiedTokens = tokensToCopy.map((token, index) => ({
    ...token,
    id: tokenIdMap.get(token.id) ?? makeTokenId('token'),
    name: createUniqueTokenNameFromSet(`${token.name}-copy`, usedTokenNames),
    groupId: token.groupId ? groupIdMap.get(token.groupId) : undefined,
    values: Object.fromEntries(
      Object.entries(token.values).map(([modeId, value]) => [
        modeId,
        retargetCopiedTokenValue(value, collectionId, tokenIdMap),
      ]),
    ),
    sortOrder: nextSortOrderStart + index,
  }));

  const next = updateCollection(registry, collectionId, (current) => ({
    ...current,
    groups: [...current.groups, ...copiedGroups],
    tokens: [...current.tokens, ...copiedTokens],
  }));

  return {
    ...next,
    fieldScopes: duplicateTokenFieldScopes(next.fieldScopes, collectionId, groupIdMap),
  };
}

export function reorderGroups(
  registry: TokenRegistry,
  collectionId: string,
  sourceGroupId: string,
  targetGroupId: string,
  position: ReorderPosition,
): TokenRegistry {
  return updateCollection(registry, collectionId, (collection) => ({
    ...collection,
    groups: reorderById(collection.groups, sourceGroupId, targetGroupId, position),
  }));
}

export function createToken(
  registry: TokenRegistry,
  collectionId: string,
  groupId?: string,
  type: TokenType = 'color',
): { registry: TokenRegistry; token: DesignToken } {
  const collection = registry.collections.find((candidate) => candidate.id === collectionId);
  const modeIds = collection?.modes.map((mode) => mode.id) ?? ['default'];
  const token: DesignToken = {
    id: createUniqueTokenId('token', collection?.tokens.map((candidate) => candidate.id) ?? []),
    name: createUniqueTokenName(
      `new-token-${(collection?.tokens.length ?? 0) + 1}`,
      collection?.tokens.map((candidate) => candidate.name) ?? [],
    ),
    type,
    groupId,
    values: Object.fromEntries(modeIds.map((modeId) => [modeId, { kind: 'raw', value: defaultRawValue(type) }])),
    sortOrder: Math.max(0, ...(collection?.tokens.map((candidate) => candidate.sortOrder) ?? [0])) + 1,
    extensions: {},
  };

  return {
    token,
    registry: updateCollection(registry, collectionId, (current) => ({
      ...current,
      tokens: [...current.tokens, token],
    })),
  };
}

export function duplicateToken(registry: TokenRegistry, collectionId: string, tokenId: string): TokenRegistry {
  return duplicateTokens(registry, collectionId, [tokenId]).registry;
}

export function duplicateTokens(
  registry: TokenRegistry,
  collectionId: string,
  tokenIds: string[],
  afterTokenId?: string,
): { registry: TokenRegistry; tokenIds: string[] } {
  const collection = registry.collections.find((candidate) => candidate.id === collectionId);
  if (!collection) return { registry, tokenIds: [] };
  const sourceIds = new Set(tokenIds);
  const sources = [...collection.tokens]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .filter((token) => sourceIds.has(token.id));
  return insertTokenCopies(registry, collectionId, sources, afterTokenId ?? sources[sources.length - 1]?.id);
}

export function changeTokenType(registry: TokenRegistry, collectionId: string, tokenId: string, type: TokenType): TokenRegistry {
  return updateCollection(registry, collectionId, (collection) => ({
    ...collection,
    tokens: collection.tokens.map((token) =>
      token.id === tokenId
        ? { ...token, type, values: resetValuesForType(token, type) }
        : token,
    ),
  }));
}

export function updateTokenDescription(registry: TokenRegistry, collectionId: string, tokenId: string, description: string): TokenRegistry {
  const nextDescription = description.trim();
  return updateCollection(registry, collectionId, (collection) => ({
    ...collection,
    tokens: collection.tokens.map((token) =>
      token.id === tokenId
        ? { ...token, description: nextDescription || undefined }
        : token,
    ),
  }));
}

export function deleteToken(registry: TokenRegistry, collectionId: string, tokenId: string): TokenRegistry {
  return deleteTokens(registry, collectionId, [tokenId]);
}

export function deleteTokens(registry: TokenRegistry, collectionId: string, tokenIds: string[]): TokenRegistry {
  const deletedTokenIds = new Set(tokenIds);
  let next = updateCollection(registry, collectionId, (collection) => ({
    ...collection,
    tokens: collection.tokens.filter((token) => !deletedTokenIds.has(token.id)),
  }));
  for (const tokenId of deletedTokenIds) {
    next = cleanupReferencesTo(next, { collectionId, tokenId });
  }
  return next;
}

export function pasteTokens(
  registry: TokenRegistry,
  collectionId: string,
  tokens: DesignToken[],
  afterTokenId?: string,
  targetGroupId?: string | null,
): { registry: TokenRegistry; tokenIds: string[] } {
  return insertTokenCopies(registry, collectionId, tokens, afterTokenId, targetGroupId);
}

function insertTokenCopies(
  registry: TokenRegistry,
  collectionId: string,
  sourceTokens: DesignToken[],
  afterTokenId?: string,
  targetGroupId?: string | null,
): { registry: TokenRegistry; tokenIds: string[] } {
  const collection = registry.collections.find((candidate) => candidate.id === collectionId);
  if (!collection || sourceTokens.length === 0) return { registry, tokenIds: [] };

  const usedTokenIds = new Set(collection.tokens.map((token) => token.id));
  const usedTokenNames = new Set(collection.tokens.map((token) => token.name));
  const validGroupIds = new Set(collection.groups.map((group) => group.id));
  const tokenIdMap = new Map(sourceTokens.map((token) => [token.id, createUniqueTokenIdFromSet('token', usedTokenIds)]));
  const copiedTokens = sourceTokens.map((token) => ({
    ...token,
    id: tokenIdMap.get(token.id) ?? makeTokenId('token'),
    name: createUniqueTokenNameFromSet(`${token.name}-copy`, usedTokenNames),
    groupId: targetGroupId !== undefined
      ? targetGroupId && validGroupIds.has(targetGroupId) ? targetGroupId : undefined
      : token.groupId && validGroupIds.has(token.groupId) ? token.groupId : undefined,
    values: Object.fromEntries(
      Object.entries(token.values).map(([modeId, value]) => [
        modeId,
        retargetCopiedTokenValue(value, collectionId, tokenIdMap),
      ]),
    ),
  }));
  const copiedIds = copiedTokens.map((token) => token.id);
  const orderedIds = [...collection.tokens].sort((a, b) => a.sortOrder - b.sortOrder).map((token) => token.id);
  const insertIndex = afterTokenId ? orderedIds.indexOf(afterTokenId) + 1 : orderedIds.length;
  const nextOrder = [...orderedIds];
  nextOrder.splice(insertIndex > 0 ? insertIndex : nextOrder.length, 0, ...copiedIds);
  const nextTokens = [...collection.tokens, ...copiedTokens];
  const registryWithCopies = updateCollection(registry, collectionId, (current) => ({
    ...current,
    tokens: nextTokens.map((token) => {
      const order = nextOrder.indexOf(token.id);
      return { ...token, sortOrder: order === -1 ? token.sortOrder : order };
    }),
  }));
  return { registry: registryWithCopies, tokenIds: copiedIds };
}

export function setTokenValue(
  registry: TokenRegistry,
  collectionId: string,
  tokenId: string,
  modeId: string,
  value: TokenValue,
): { registry: TokenRegistry; error: string | null } {
  if (wouldCreateTokenCycle(registry, { collectionId, tokenId }, value)) {
    return { registry, error: 'This value would create a token reference cycle.' };
  }
  return {
    error: null,
    registry: updateCollection(registry, collectionId, (collection) => ({
      ...collection,
      tokens: collection.tokens.map((token) =>
        token.id === tokenId ? { ...token, values: { ...token.values, [modeId]: value } } : token,
      ),
    })),
  };
}

export function renameToken(registry: TokenRegistry, collectionId: string, tokenId: string, name: string): { registry: TokenRegistry; error: string | null } {
  const nextName = name.trim();
  const error = validateTokenName(nextName);
  if (error) return { registry, error };
  const collection = registry.collections.find((candidate) => candidate.id === collectionId);
  if (collection?.tokens.some((token) => token.id !== tokenId && token.name === nextName)) {
    return { registry, error: 'Token name must be unique within the collection.' };
  }
  return {
    error: null,
    registry: updateCollection(registry, collectionId, (collection) => ({
      ...collection,
      tokens: collection.tokens.map((token) => (token.id === tokenId ? { ...token, name: nextName } : token)),
    })),
  };
}

export function reorderTokens(registry: TokenRegistry, collectionId: string, orderedIds: string[]): TokenRegistry {
  return updateCollection(registry, collectionId, (collection) => ({
    ...collection,
    tokens: collection.tokens.map((token) => {
      const order = orderedIds.indexOf(token.id);
      return order === -1 ? token : { ...token, sortOrder: order };
    }),
  }));
}

export function moveTokenToGroup(
  registry: TokenRegistry,
  collectionId: string,
  tokenId: string,
  targetGroupId: string | undefined,
  beforeTokenId?: string,
): TokenRegistry {
  return moveTokensToGroup(registry, collectionId, [tokenId], targetGroupId, beforeTokenId);
}

export function moveTokensToGroup(
  registry: TokenRegistry,
  collectionId: string,
  tokenIds: string[],
  targetGroupId: string | undefined,
  beforeTokenId?: string,
): TokenRegistry {
  return updateCollection(registry, collectionId, (collection) => {
    const requestedTokenIds = new Set(tokenIds);
    const orderedTokens = [...collection.tokens].sort((a, b) => a.sortOrder - b.sortOrder);
    const movingIds = orderedTokens
      .filter((token) => requestedTokenIds.has(token.id))
      .map((token) => token.id);
    if (movingIds.length === 0) return collection;

    const movingIdSet = new Set(movingIds);
    const orderedIds = orderedTokens.map((token) => token.id);
    const withoutMoving = orderedIds.filter((id) => !movingIdSet.has(id));
    const beforeIndex = beforeTokenId && !movingIdSet.has(beforeTokenId)
      ? withoutMoving.indexOf(beforeTokenId)
      : -1;

    if (beforeIndex >= 0) {
      withoutMoving.splice(beforeIndex, 0, ...movingIds);
    } else {
      const targetGroupTokens = orderedTokens
        .filter((token) => !movingIdSet.has(token.id) && token.groupId === targetGroupId);
      const lastTargetGroupTokenId = targetGroupTokens[targetGroupTokens.length - 1]?.id;
      const lastTargetIndex = lastTargetGroupTokenId ? withoutMoving.indexOf(lastTargetGroupTokenId) : -1;
      withoutMoving.splice(lastTargetIndex + 1, 0, ...movingIds);
    }

    return {
      ...collection,
      tokens: collection.tokens.map((token) => {
        const order = withoutMoving.indexOf(token.id);
        return {
          ...token,
          groupId: movingIdSet.has(token.id) ? targetGroupId : token.groupId,
          sortOrder: order === -1 ? token.sortOrder : order,
        };
      }),
    };
  });
}

export function defaultRawValue(type: TokenType): TokenRawLiteral {
  if (type === 'number') return 0;
  if (type === 'dimension') return { value: 1, unit: 'rem' };
  if (type === 'duration') return { value: 120, unit: 'ms' };
  if (type === 'angle') return { value: 0, unit: 'deg' };
  if (type === 'opacity') return { value: 100, unit: '%' };
  if (type === 'boolean') return false;
  if (type === 'gradient') return defaultGradientValue();
  if (type === 'color') return '#000000';
  return '';
}

function resetValuesForType(token: DesignToken, type: TokenType): DesignToken['values'] {
  return Object.fromEntries(Object.keys(token.values).map((modeId) => [modeId, { kind: 'raw', value: defaultRawValue(type) }]));
}

export function normalizeImportedRegistry(registry: unknown): TokenRegistry {
  if (isV1Registry(registry)) {
    return normalizeTailwindThemeSemanticRefs(migrateLegacyImportedCssTokenCollections(normalizeTokenRegistry(registry)));
  }
  return { schemaVersion: '0.1', collections: [], fieldScopes: {}, extensions: {} };
}

const TAILWIND_THEME_COLLECTION_ID = 'tailwind-theme';
const TAILWIND_PRIMITIVES_COLLECTION_ID = 'tailwind-primitives';
const WORKBENCH_SEMANTIC_COLOR_COLLECTION_ID = 'workbench-semantic-color';
const WORKBENCH_SEMANTIC_RADIUS_COLLECTION_ID = 'workbench-semantic-radius';
const TAILWIND_THEME_SEMANTIC_SOURCE = 'tailwind-theme-normalizer';

type TailwindThemeRole = {
  groupId: string;
  id: string;
  name: string;
  type: TokenType;
};

const TAILWIND_THEME_COLOR_ROLES: TailwindThemeRole[] = [
  { id: 'background', name: 'Background', type: 'color', groupId: 'surface' },
  { id: 'foreground', name: 'Foreground', type: 'color', groupId: 'surface' },
  { id: 'card', name: 'Card', type: 'color', groupId: 'surface' },
  { id: 'card-foreground', name: 'Card foreground', type: 'color', groupId: 'surface' },
  { id: 'popover', name: 'Popover', type: 'color', groupId: 'surface' },
  { id: 'popover-foreground', name: 'Popover foreground', type: 'color', groupId: 'surface' },
  { id: 'muted', name: 'Muted', type: 'color', groupId: 'surface' },
  { id: 'muted-foreground', name: 'Muted foreground', type: 'color', groupId: 'surface' },
  { id: 'primary', name: 'Primary', type: 'color', groupId: 'action' },
  { id: 'primary-foreground', name: 'Primary foreground', type: 'color', groupId: 'action' },
  { id: 'secondary', name: 'Secondary', type: 'color', groupId: 'action' },
  { id: 'secondary-foreground', name: 'Secondary foreground', type: 'color', groupId: 'action' },
  { id: 'accent', name: 'Accent', type: 'color', groupId: 'action' },
  { id: 'accent-foreground', name: 'Accent foreground', type: 'color', groupId: 'action' },
  { id: 'destructive', name: 'Destructive', type: 'color', groupId: 'feedback' },
  { id: 'destructive-foreground', name: 'Destructive foreground', type: 'color', groupId: 'feedback' },
  { id: 'border', name: 'Border', type: 'color', groupId: 'border' },
  { id: 'input', name: 'Input', type: 'color', groupId: 'border' },
  { id: 'ring', name: 'Ring', type: 'color', groupId: 'focus' },
  { id: 'chart-1', name: 'Chart 1', type: 'color', groupId: 'chart' },
  { id: 'chart-2', name: 'Chart 2', type: 'color', groupId: 'chart' },
  { id: 'chart-3', name: 'Chart 3', type: 'color', groupId: 'chart' },
  { id: 'chart-4', name: 'Chart 4', type: 'color', groupId: 'chart' },
  { id: 'chart-5', name: 'Chart 5', type: 'color', groupId: 'chart' },
  { id: 'sidebar', name: 'Sidebar', type: 'color', groupId: 'sidebar' },
  { id: 'sidebar-foreground', name: 'Sidebar foreground', type: 'color', groupId: 'sidebar' },
  { id: 'sidebar-primary', name: 'Sidebar primary', type: 'color', groupId: 'sidebar' },
  { id: 'sidebar-primary-foreground', name: 'Sidebar primary foreground', type: 'color', groupId: 'sidebar' },
  { id: 'sidebar-accent', name: 'Sidebar accent', type: 'color', groupId: 'sidebar' },
  { id: 'sidebar-accent-foreground', name: 'Sidebar accent foreground', type: 'color', groupId: 'sidebar' },
  { id: 'sidebar-border', name: 'Sidebar border', type: 'color', groupId: 'sidebar' },
  { id: 'sidebar-ring', name: 'Sidebar ring', type: 'color', groupId: 'sidebar' },
];

const TAILWIND_THEME_RADIUS_ROLES: TailwindThemeRole[] = [
  { id: 'radius', name: 'Radius', type: 'dimension', groupId: 'surface' },
];

const SEMANTIC_COLOR_GROUPS: TokenGroup[] = [
  { id: 'surface', name: 'Surface' },
  { id: 'text', name: 'Text' },
  { id: 'border', name: 'Border' },
  { id: 'action', name: 'Action' },
  { id: 'feedback', name: 'Feedback' },
  { id: 'focus', name: 'Focus' },
  { id: 'chart', name: 'Chart' },
  { id: 'sidebar', name: 'Sidebar' },
];

const SEMANTIC_RADIUS_GROUPS: TokenGroup[] = [
  { id: 'control', name: 'Control' },
  { id: 'surface', name: 'Surface' },
];

function normalizeTailwindThemeSemanticRefs(registry: TokenRegistry): TokenRegistry {
  const themeCollection = registry.collections.find(isTailwindThemeCollection);
  if (!themeCollection) return registry;

  const next = clonePlain(registry);
  const nextThemeCollection = next.collections.find(isTailwindThemeCollection);
  if (!nextThemeCollection) return registry;

  const primitiveCollection = ensureTokenCollection(next, {
    id: TAILWIND_PRIMITIVES_COLLECTION_ID,
    name: 'Tailwind Primitives',
    description: 'Raw theme and Tailwind primitive values used by semantic tokens.',
    modes: [{ id: 'default', name: 'Default' }],
    activeMode: 'default',
    groups: [],
    tokens: [],
    extensions: {
      source: 'tailwind-default-theme-primitives',
    },
  });
  const semanticColorCollection = ensureTokenCollection(next, {
    id: WORKBENCH_SEMANTIC_COLOR_COLLECTION_ID,
    name: 'Workbench Semantic Color',
    description: 'Role-based color tokens referenced by theme and component tokens.',
    modes: [
      { id: 'light', name: 'Light' },
      { id: 'dark', name: 'Dark' },
    ],
    activeMode: 'light',
    groups: [],
    tokens: [],
    extensions: {
      source: 'workbench-template',
      layer: 'semantic',
      role: 'color',
    },
  });
  const semanticRadiusCollection = ensureTokenCollection(next, {
    id: WORKBENCH_SEMANTIC_RADIUS_COLLECTION_ID,
    name: 'Workbench Semantic Radius',
    description: 'Role-based radius tokens referenced by theme and component tokens.',
    modes: [
      { id: 'base', name: 'Base' },
      { id: 'compact', name: 'Compact' },
      { id: 'flat', name: 'Flat' },
    ],
    activeMode: 'base',
    groups: [],
    tokens: [],
    extensions: {
      source: 'workbench-template',
      layer: 'semantic',
      role: 'radius',
    },
  });

  ensureGroups(semanticColorCollection, SEMANTIC_COLOR_GROUPS);
  ensureGroups(semanticRadiusCollection, SEMANTIC_RADIUS_GROUPS);

  const colorRoleById = new Map(TAILWIND_THEME_COLOR_ROLES.map((role) => [role.id, role]));
  const radiusRoleById = new Map(TAILWIND_THEME_RADIUS_ROLES.map((role) => [role.id, role]));

  nextThemeCollection.tokens = nextThemeCollection.tokens.map((token) => {
    const colorRole = token.type === 'color' ? colorRoleById.get(token.id) : undefined;
    if (colorRole) {
      ensureSemanticThemeToken({
        primitiveCollection,
        sourceCollection: nextThemeCollection,
        sourceToken: token,
        targetCollection: semanticColorCollection,
        targetRole: colorRole,
      });
      return referenceThemeTokenToSemantic(token, semanticColorCollection.id, colorRole.id);
    }

    const radiusRole = radiusRoleById.get(token.id);
    if (radiusRole && (token.type === 'dimension' || token.type === 'string')) {
      ensureSemanticThemeToken({
        primitiveCollection,
        sourceCollection: nextThemeCollection,
        sourceToken: token,
        targetCollection: semanticRadiusCollection,
        targetRole: { ...radiusRole, type: token.type },
        targetModeIds: ['base', 'compact', 'flat', 'light', 'dark'],
      });
      return referenceThemeTokenToSemantic(token, semanticRadiusCollection.id, radiusRole.id);
    }

    return token;
  });

  next.fieldScopes = mergeSemanticTailwindThemeFieldScopes(next.fieldScopes);
  return next;
}

function isTailwindThemeCollection(collection: TokenCollection): boolean {
  const tailwind = isRecord(collection.extensions?.tailwind) ? collection.extensions.tailwind : null;
  return collection.id === TAILWIND_THEME_COLLECTION_ID || collection.extensions?.source === 'tailwind' || tailwind?.kind === 'theme-variables';
}

function ensureTokenCollection(registry: TokenRegistry, fallback: TokenCollection): TokenCollection {
  const existing = registry.collections.find((collection) => collection.id === fallback.id);
  if (existing) {
    existing.description ??= fallback.description;
    existing.activeMode ??= fallback.activeMode;
    const existingModeIds = new Set(existing.modes.map((mode) => mode.id));
    for (const mode of fallback.modes) {
      if (existingModeIds.has(mode.id)) continue;
      existing.modes.push(clonePlain(mode));
      existingModeIds.add(mode.id);
    }
    existing.extensions = { ...(fallback.extensions ?? {}), ...(existing.extensions ?? {}) };
    return existing;
  }
  const collection = clonePlain(fallback);
  registry.collections.push(collection);
  return collection;
}

function ensureGroups(collection: TokenCollection, groups: TokenGroup[]): void {
  const groupIds = new Set(collection.groups.map((group) => group.id));
  for (const group of groups) {
    if (groupIds.has(group.id)) continue;
    collection.groups.push(clonePlain(group));
    groupIds.add(group.id);
  }
}

function ensureSemanticThemeToken({
  primitiveCollection,
  sourceCollection,
  sourceToken,
  targetCollection,
  targetModeIds,
  targetRole,
}: {
  primitiveCollection: TokenCollection;
  sourceCollection: TokenCollection;
  sourceToken: DesignToken;
  targetCollection: TokenCollection;
  targetModeIds?: string[];
  targetRole: TailwindThemeRole;
}): void {
  const modeIds = targetModeIds ?? targetCollection.modes.map((mode) => mode.id);
  const values: Record<string, TokenValue> = {};

  for (const modeId of modeIds) {
    if (modeId === 'flat' && targetCollection.id === WORKBENCH_SEMANTIC_RADIUS_COLLECTION_ID) {
      values[modeId] = {
        kind: 'ref',
        collectionId: primitiveCollection.id,
        tokenId: 'radius-none',
      };
      continue;
    }
    const sourceModeId = sourceToken.values[modeId] ? modeId : getEquivalentThemeSourceModeId(modeId, sourceCollection);
    const sourceValue = sourceToken.values[sourceModeId] ?? sourceToken.values.default;
    if (sourceValue?.kind === 'ref') {
      values[modeId] = { kind: 'ref', collectionId: sourceValue.collectionId, tokenId: sourceValue.tokenId };
      continue;
    }
    if (sourceValue?.kind !== 'raw') continue;

    const primitiveTokenId = getTailwindThemePrimitiveTokenId(sourceToken.id, sourceModeId);
    ensureRawPrimitiveToken(primitiveCollection, {
      groupId: getTailwindThemePrimitiveGroupId(sourceModeId, sourceToken.type),
      id: primitiveTokenId,
      name: `${targetRole.name} ${formatModeName(sourceModeId)}`,
      type: sourceToken.type,
      value: sourceValue.value,
    });
    values[modeId] = { kind: 'ref', collectionId: primitiveCollection.id, tokenId: primitiveTokenId };
  }

  if (Object.keys(values).length === 0) return;

  const existing = targetCollection.tokens.find((candidate) => candidate.id === targetRole.id);
  if (existing) {
    existing.name = existing.name || targetRole.name;
    existing.groupId ??= targetRole.groupId;
    existing.values = Object.fromEntries(
      modeIds.map((modeId) => {
        const current = existing.values[modeId];
        if (current?.kind === 'raw') {
          const primitiveTokenId = getTailwindThemePrimitiveTokenId(`${targetRole.id}-semantic`, modeId);
          ensureRawPrimitiveToken(primitiveCollection, {
            groupId: getTailwindThemePrimitiveGroupId(modeId, existing.type),
            id: primitiveTokenId,
            name: `${existing.name || targetRole.name} ${formatModeName(modeId)}`,
            type: existing.type,
            value: current.value,
          });
          return [modeId, { kind: 'ref', collectionId: primitiveCollection.id, tokenId: primitiveTokenId }];
        }
        return [modeId, current ?? values[modeId] ?? Object.values(values)[0]!];
      }),
    );
    return;
  }

  targetCollection.tokens.push({
    id: targetRole.id,
    name: targetRole.name,
    type: targetRole.type,
    groupId: targetRole.groupId,
    values: Object.fromEntries(
      modeIds.map((modeId) => [modeId, values[modeId] ?? Object.values(values)[0]!]),
    ),
    sortOrder: nextSortOrder(targetCollection.tokens),
    extensions: {
      source: TAILWIND_THEME_SEMANTIC_SOURCE,
      layer: 'semantic',
    },
  });
}

function referenceThemeTokenToSemantic(
  token: DesignToken,
  collectionId: string,
  tokenId: string,
): DesignToken {
  return {
    ...token,
    values: Object.fromEntries(
      Object.keys(token.values).map((modeId) => [
        modeId,
        { kind: 'ref', collectionId, tokenId },
      ]),
    ),
    extensions: {
      ...(token.extensions ?? {}),
      tailwindThemeRef: {
        collectionId,
        tokenId,
      },
    },
  };
}

function ensureRawPrimitiveToken(
  collection: TokenCollection,
  token: {
    groupId: string;
    id: string;
    name: string;
    type: TokenType;
    value: TokenRawLiteral;
  },
): void {
  if (!collection.groups.some((group) => group.id === token.groupId)) {
    collection.groups.push({ id: token.groupId, name: formatGroupName(token.groupId) });
  }
  const existing = collection.tokens.find((candidate) => candidate.id === token.id);
  if (existing) return;
  collection.tokens.push({
    id: token.id,
    name: token.name,
    type: token.type,
    groupId: token.groupId,
    values: {
      default: {
        kind: 'raw',
        value: clonePlain(token.value),
      },
    },
    sortOrder: nextSortOrder(collection.tokens),
    extensions: {
      source: TAILWIND_THEME_SEMANTIC_SOURCE,
      layer: 'primitive',
    },
  });
}

function nextSortOrder(tokens: DesignToken[]): number {
  return Math.max(-1, ...tokens.map((token) => token.sortOrder)) + 1;
}

function getEquivalentThemeSourceModeId(modeId: string, collection: TokenCollection): string {
  if (modeId === 'base' || modeId === 'compact') return collection.activeMode ?? collection.modes[0]?.id ?? 'light';
  return modeId;
}

function getTailwindThemePrimitiveTokenId(tokenId: string, modeId: string): string {
  return `theme-${tokenId}-${modeId}`.replace(/[^a-zA-Z0-9_-]+/g, '-').toLowerCase();
}

function getTailwindThemePrimitiveGroupId(modeId: string, type: TokenType): string {
  if (type === 'color') return `theme-${modeId}`;
  if (type === 'dimension') return 'theme-radius';
  return 'theme';
}

function formatModeName(modeId: string): string {
  return modeId
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part[0]!.toUpperCase() + part.slice(1))
    .join(' ');
}

function formatGroupName(groupId: string): string {
  return groupId
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part[0]!.toUpperCase() + part.slice(1))
    .join(' ');
}

function mergeSemanticTailwindThemeFieldScopes(
  fieldScopes: TokenRegistry['fieldScopes'],
): TokenRegistry['fieldScopes'] {
  const next: TokenFieldScopesMap = { ...(fieldScopes ?? {}) };
  next.bgColor = mergeTokenFieldScopes(next.bgColor, [{ collectionId: WORKBENCH_SEMANTIC_COLOR_COLLECTION_ID }]);
  next.textColor = mergeTokenFieldScopes(next.textColor, [{ collectionId: WORKBENCH_SEMANTIC_COLOR_COLLECTION_ID }]);
  next.borderColor = mergeTokenFieldScopes(next.borderColor, [{ collectionId: WORKBENCH_SEMANTIC_COLOR_COLLECTION_ID }]);
  next.borderRadius = mergeTokenFieldScopes(next.borderRadius, [{ collectionId: WORKBENCH_SEMANTIC_RADIUS_COLLECTION_ID }]);
  return next;
}

function mergeTokenFieldScopes(
  current: TokenFieldScope[] | undefined,
  additions: TokenFieldScope[],
): TokenFieldScope[] {
  const next = [...(current ?? [])];
  for (const addition of additions) {
    if (next.some((scope) => scope.collectionId === addition.collectionId && scope.groupId === addition.groupId)) continue;
    next.push(addition);
  }
  return next;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function mergeTokenRegistryImports(
  current: TokenRegistry,
  imports: TokenRegistry[],
  previousImports: Array<TokenRegistry | null> = [],
): TokenRegistry {
  const next = clonePlain(current);
  next.extensions = { ...(next.extensions ?? {}) };

  for (const [importIndex, imported] of imports.entries()) {
    const normalized = normalizeImportedRegistry(imported);
    const previous = previousImports[importIndex] ? normalizeImportedRegistry(previousImports[importIndex]) : null;
    for (const collection of normalized.collections) {
      const collectionIndex = next.collections.findIndex((candidate) => candidate.id === collection.id);
      const previousCollection = previous?.collections.find((candidate) => candidate.id === collection.id) ?? null;
      const importedCollection = clonePlain(collection);
      if (collectionIndex >= 0) {
        next.collections[collectionIndex] = mergeTokenCollectionImport(next.collections[collectionIndex], importedCollection, previousCollection);
      } else {
        next.collections.push(importedCollection);
      }
    }

    if (normalized.fieldScopes) {
      next.fieldScopes = mergeRecordByPrevious(next.fieldScopes, normalized.fieldScopes, previous?.fieldScopes) as TokenRegistry['fieldScopes'];
    }
    next.extensions = mergeRecordByPrevious(next.extensions, normalized.extensions, previous?.extensions);
  }

  return next;
}

function isV1Registry(value: unknown): value is TokenRegistry {
  return (
    typeof value === 'object' &&
    value !== null &&
    'collections' in value &&
    Array.isArray((value as TokenRegistry).collections) &&
    (value as TokenRegistry).collections.every((collection) => 'groups' in collection)
  );
}

function normalizeTokenRegistry(registry: TokenRegistry): TokenRegistry {
  return {
    ...registry,
    collections: registry.collections.map((collection) => ({
      ...collection,
      tokens: collection.tokens.map(normalizeToken),
    })),
  };
}

function normalizeToken(token: DesignToken): DesignToken {
  if (token.type !== 'gradient') return token;
  return {
    ...token,
    values: Object.fromEntries(
      Object.entries(token.values).map(([modeId, value]) => [modeId, normalizeGradientTokenValue(value)]),
    ),
  };
}

function migrateLegacyImportedCssTokenCollections(registry: TokenRegistry): TokenRegistry {
  const imported = registry.collections.find((collection) => collection.id === 'imported');
  if (!imported) return registry;

  const tokensByLibrary = new Map<string, DesignToken[]>();
  const remainingImportedTokens: DesignToken[] = [];
  for (const token of imported.tokens) {
    if (isMalformedLegacyCssImportedToken(token)) continue;
    const libraryId = inferLibraryIdFromTokenSourcePath(token.extensions?.importedFrom);
    if (!libraryId) {
      remainingImportedTokens.push(token);
      continue;
    }
    tokensByLibrary.set(libraryId, [...(tokensByLibrary.get(libraryId) ?? []), token]);
  }
  if (tokensByLibrary.size === 0) return registry;

  const nextCollections = registry.collections.filter((collection) => collection.id !== imported.id).map(clonePlain);
  const movedGroupIdsByLibrary = new Map<string, Set<string>>();
  for (const [libraryId, tokens] of tokensByLibrary.entries()) {
    const groupIds = getTokenGroupIdSet(tokens);
    movedGroupIdsByLibrary.set(libraryId, groupIds);
    const groups = imported.groups.filter((group) => groupIds.has(group.id)).map(clonePlain);
    const targetIndex = nextCollections.findIndex((collection) => collection.id === libraryId);
    const normalizedTokens = tokens.map((token, sortOrder) => ({
      ...clonePlain(token),
      sortOrder,
      extensions: {
        ...(token.extensions ?? {}),
        migratedFromCollection: 'imported',
      },
    }));

    if (targetIndex >= 0) {
      const target = nextCollections[targetIndex];
      const existingTokenIds = new Set(target.tokens.map((token) => token.id));
      const existingGroupIds = new Set(target.groups.map((group) => group.id));
      nextCollections[targetIndex] = {
        ...target,
        groups: [
          ...target.groups,
          ...groups.filter((group) => !existingGroupIds.has(group.id)),
        ],
        tokens: [
          ...target.tokens,
          ...normalizedTokens.filter((token) => !existingTokenIds.has(token.id)),
        ].map((token, sortOrder) => ({ ...token, sortOrder })),
        extensions: {
          ...(target.extensions ?? {}),
          source: target.extensions?.source ?? libraryId,
          importKind: target.extensions?.importKind ?? 'library-css',
        },
      };
    } else {
      nextCollections.push({
        ...clonePlain(imported),
        id: libraryId,
        name: formatLibraryTokenCollectionName(libraryId),
        groups,
        tokens: normalizedTokens,
        extensions: {
          source: libraryId,
          importedFrom: [...new Set(tokens.map((token) => token.extensions?.importedFrom).filter(Boolean))].join(', '),
          importKind: 'library-css',
          migratedFromCollection: 'imported',
        },
      });
    }
  }

  if (remainingImportedTokens.length > 0) {
    const remainingGroupIds = getTokenGroupIdSet(remainingImportedTokens);
    nextCollections.push({
      ...clonePlain(imported),
      groups: imported.groups.filter((group) => remainingGroupIds.has(group.id)).map(clonePlain),
      tokens: remainingImportedTokens.map((token, sortOrder) => ({ ...clonePlain(token), sortOrder })),
    });
  }

  return {
    ...registry,
    collections: nextCollections,
    fieldScopes: migrateLegacyImportedCssFieldScopes(
      registry,
      getTokenGroupIdSet(remainingImportedTokens),
      movedGroupIdsByLibrary,
    ),
  };
}

function getTokenGroupIdSet(tokens: DesignToken[]): Set<string> {
  return new Set(tokens
    .map((token) => token.groupId)
    .filter((groupId): groupId is string => typeof groupId === 'string'));
}

function migrateLegacyImportedCssFieldScopes(
  registry: TokenRegistry,
  remainingImportedGroupIds: Set<string>,
  movedGroupIdsByLibrary: Map<string, Set<string>>,
): TokenRegistry['fieldScopes'] {
  const nextScopes: TokenFieldScopesMap = {};
  for (const [field, scopes] of Object.entries(registry.fieldScopes ?? {}) as Array<[InspectorField, TokenFieldScope[] | undefined]>) {
    const fieldScopes = scopes ?? [];
    const nextFieldScopes: TokenFieldScope[] = [];
    for (const scope of fieldScopes) {
      if (scope.collectionId !== 'imported') {
        nextFieldScopes.push(scope);
        continue;
      }
      if (!scope.groupId || remainingImportedGroupIds.has(scope.groupId)) {
        nextFieldScopes.push(scope);
      }
      for (const [libraryId, groupIds] of movedGroupIdsByLibrary.entries()) {
        if (!scope.groupId || groupIds.has(scope.groupId)) {
          const migratedScope = { ...scope, collectionId: libraryId };
          if (!nextFieldScopes.some((candidate) => (
            candidate.collectionId === migratedScope.collectionId &&
            candidate.groupId === migratedScope.groupId
          ))) {
            nextFieldScopes.push(migratedScope);
          }
        }
      }
    }
    nextScopes[field] = nextFieldScopes;
  }
  return nextScopes;
}

function isMalformedLegacyCssImportedToken(token: DesignToken): boolean {
  const importedFrom = token.extensions?.importedFrom;
  if (typeof importedFrom !== 'string' || !importedFrom.trim().toLowerCase().endsWith('.css')) return false;
  return Object.values(token.values).some((value) => (
    value.kind === 'raw' &&
    typeof value.value === 'string' &&
    /[{};]/.test(value.value)
  ));
}

function inferLibraryIdFromTokenSourcePath(sourcePath: unknown): string | null {
  if (typeof sourcePath !== 'string') return null;
  const normalized = sourcePath.trim().replace(/^[/\\]+/, '').replace(/\\/g, '/').toLowerCase();
  const presetMatch = /(?:^|\/)([a-z][a-z0-9-]*)-preset\//i.exec(normalized);
  if (presetMatch?.[1]) return presetMatch[1].toLowerCase();
  const libraryMatch = /(?:^|\/)src\/libraries\/([a-z][a-z0-9-]*)(?:\/|$)/i.exec(normalized);
  if (libraryMatch?.[1]) return libraryMatch[1].toLowerCase();
  return null;
}

function formatLibraryTokenCollectionName(libraryId: string): string {
  return libraryId
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.toUpperCase())
    .join(' ');
}

function normalizeGradientTokenValue(value: TokenValue): TokenValue {
  if (value.kind !== 'raw') return value;
  if (isGradientValue(value.value)) return { kind: 'raw', value: normalizeGradientValue(value.value) };
  if (!isCssGradientLiteral(value.value)) return value;
  const gradient = cssGradientLiteralToValue(value.value);
  return gradient ? { kind: 'raw', value: gradient } : value;
}

function mergeTokenCollectionImport(
  existing: TokenCollection,
  imported: TokenCollection,
  previous: TokenCollection | null,
): TokenCollection {
  const modes = mergeItemsById(existing.modes, imported.modes, previous?.modes ?? []);
  const groups = mergeItemsById(existing.groups, imported.groups, previous?.groups ?? []);
  const modeIds = new Set(modes.map((mode) => mode.id));
  const importedTokenIds = new Set(imported.tokens.map((token) => token.id));
  const existingByTokenId = new Map(existing.tokens.map((token) => [token.id, token]));
  const previousByTokenId = new Map((previous?.tokens ?? []).map((token) => [token.id, token]));
  const importedTokens = [...imported.tokens]
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((token) => mergeImportedToken(existingByTokenId.get(token.id), token, previousByTokenId.get(token.id), modeIds, imported));
  const localTokens = existing.tokens
    .filter((token) => !importedTokenIds.has(token.id))
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((token) => ensureTokenValuesForModes(clonePlain(token), modeIds));
  const tokens = [...importedTokens, ...localTokens].map((token, sortOrder) => ({
    ...token,
    sortOrder,
  }));
  const activeMode = resolveMergedActiveMode(existing, imported, previous, modes);

  return {
    ...existing,
    ...imported,
    name: mergeRequired(existing.name, imported.name, previous?.name),
    description: mergePrimitive(existing.description, imported.description, previous?.description),
    modes,
    ...(activeMode ? { activeMode } : {}),
    groups,
    tokens,
    extensions: mergeRecordByPrevious(existing.extensions, imported.extensions, previous?.extensions),
  };
}

function mergeItemsById<T extends { id: string }>(existing: T[], imported: T[], previous: T[]): T[] {
  const importedIds = new Set(imported.map((item) => item.id));
  const existingById = new Map(existing.map((item) => [item.id, item]));
  const previousById = new Map(previous.map((item) => [item.id, item]));
  return [
    ...imported.map((item) => {
      const existingItem = existingById.get(item.id);
      if (!existingItem) return clonePlain(item);
      return mergeObjectByPrevious(existingItem, item, previousById.get(item.id));
    }),
    ...existing.filter((item) => !importedIds.has(item.id)).map(clonePlain),
  ];
}

function mergeImportedToken(
  existing: DesignToken | undefined,
  imported: DesignToken,
  previous: DesignToken | undefined,
  modeIds: Set<string>,
  collection: TokenCollection,
): DesignToken {
  if (!existing) {
    return ensureTokenValuesForModes(clonePlain(imported), modeIds, collection);
  }
  const next = clonePlain(imported);
  next.name = mergeRequired(existing.name, imported.name, previous?.name);
  next.type = mergeRequired(existing.type, imported.type, previous?.type);
  next.groupId = mergePrimitive(existing.groupId, imported.groupId, previous?.groupId);
  next.description = mergePrimitive(existing.description, imported.description, previous?.description);
  next.extensions = mergeRecordByPrevious(existing.extensions, imported.extensions, previous?.extensions);
  next.values = {};
  for (const modeId of modeIds) {
    const existingValue = existing.values[modeId];
    const importedValue = imported.values[modeId];
    const previousValue = previous?.values[modeId];
    const mergedValue = mergeTokenValue(existingValue, importedValue, previousValue);
    if (mergedValue) next.values[modeId] = mergedValue;
  }
  return ensureTokenValuesForModes(next, modeIds, collection);
}

function mergeTokenValue(
  existing: TokenValue | undefined,
  imported: TokenValue | undefined,
  previous: TokenValue | undefined,
): TokenValue | null {
  if (!existing && imported) return clonePlain(imported);
  if (!existing) return null;
  if (!imported) return clonePlain(existing);
  if (!previous) return clonePlain(existing);
  return arePlainEqual(existing, previous) ? clonePlain(imported) : clonePlain(existing);
}

function ensureTokenValuesForModes(
  token: DesignToken,
  modeIds: Set<string>,
  collection?: TokenCollection,
): DesignToken {
  const next: DesignToken = {
    ...token,
    values: { ...token.values },
  };
  const fallback = getTokenFallbackValue(next, collection);
  if (!fallback) return next;
  for (const modeId of modeIds) {
    if (!next.values[modeId]) next.values[modeId] = clonePlain(fallback);
  }
  return next;
}

function getTokenFallbackValue(token: DesignToken, collection?: TokenCollection): TokenValue | null {
  if (collection?.activeMode && token.values[collection.activeMode]) return token.values[collection.activeMode];
  for (const mode of collection?.modes ?? []) {
    if (token.values[mode.id]) return token.values[mode.id];
  }
  return Object.values(token.values)[0] ?? null;
}

function resolveMergedActiveMode(
  existing: TokenCollection,
  imported: TokenCollection,
  previous: TokenCollection | null,
  modes: TokenMode[],
): string | undefined {
  const modeIds = new Set(modes.map((mode) => mode.id));
  const merged = mergePrimitive(existing.activeMode, imported.activeMode, previous?.activeMode);
  if (merged && modeIds.has(merged)) return merged;
  if (imported.activeMode && modeIds.has(imported.activeMode)) return imported.activeMode;
  if (existing.activeMode && modeIds.has(existing.activeMode)) return existing.activeMode;
  return modes[0]?.id;
}

function mergeObjectByPrevious<T extends Record<string, unknown>>(existing: T, imported: T, previous: T | undefined): T {
  const keys = new Set([...Object.keys(existing), ...Object.keys(imported)]);
  const merged: Record<string, unknown> = {};
  for (const key of keys) {
    merged[key] = mergePrimitive(existing[key], imported[key], previous?.[key]);
  }
  return merged as T;
}

function mergeRecordByPrevious(
  existing: Record<string, unknown> | undefined,
  imported: Record<string, unknown> | undefined,
  previous: Record<string, unknown> | undefined,
): Record<string, unknown> {
  return mergeObjectByPrevious(existing ?? {}, imported ?? {}, previous ?? {});
}

function mergePrimitive<T>(existing: T | undefined, imported: T | undefined, previous: T | undefined): T | undefined {
  if (existing === undefined) return clonePlain(imported);
  if (imported === undefined) return clonePlain(existing);
  if (previous === undefined) return clonePlain(existing);
  return arePlainEqual(existing, previous) ? clonePlain(imported) : clonePlain(existing);
}

function mergeRequired<T>(existing: T, imported: T, previous: T | undefined): T {
  return mergePrimitive(existing, imported, previous) ?? existing;
}

function arePlainEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function clonePlain<T>(value: T): T {
  if (value === undefined) return value;
  return JSON.parse(JSON.stringify(value)) as T;
}

export function getGroupAndDescendantIds(groups: TokenGroup[], groupId: string): Set<string> {
  const ids = new Set<string>([groupId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const group of groups) {
      if (group.parentGroupId && ids.has(group.parentGroupId) && !ids.has(group.id)) {
        ids.add(group.id);
        changed = true;
      }
    }
  }
  return ids;
}

function cleanupReferencesTo(registry: TokenRegistry, deleted: Partial<TokenReference>): TokenRegistry {
  return {
    ...registry,
    collections: registry.collections.map((collection) => ({
      ...collection,
      tokens: collection.tokens.map((token) => ({
        ...token,
        values: Object.fromEntries(
          Object.entries(token.values).map(([modeId, value]) => [
            modeId,
            valueReferencesDeleted(value, deleted) ? { kind: 'raw', value: defaultRawValue(token.type) } : value,
          ]),
        ),
      })),
    })),
    fieldScopes: cleanupTokenFieldScopes(registry.fieldScopes, {
      collectionId: deleted.tokenId ? undefined : deleted.collectionId,
    }),
  };
}

function valueReferencesDeleted(value: TokenValue, deleted: Partial<TokenReference>): boolean {
  return tokenValueReferencesTarget(value, deleted);
}

function retargetCopiedTokenValue(
  value: TokenValue,
  collectionId: string,
  tokenIdMap: Map<string, string>,
): TokenValue {
  return mapTokenValueReferences(value, (reference) => {
    if (reference.collectionId !== collectionId) return reference;
    const copiedTokenId = tokenIdMap.get(reference.tokenId);
    return copiedTokenId ? { ...reference, tokenId: copiedTokenId } : reference;
  });
}

function retargetCollectionReferences(value: TokenValue, sourceCollectionId: string, nextCollectionId: string): TokenValue {
  return mapTokenValueReferences(value, (reference) =>
    reference.collectionId === sourceCollectionId
      ? { ...reference, collectionId: nextCollectionId }
      : reference,
  );
}

function createUniqueTokenId(prefix: string, existingIds: readonly string[]): string {
  return createUniqueTokenIdFromSet(prefix, new Set(existingIds));
}

function createUniqueTokenIdFromSet(prefix: string, used: Set<string>): string {
  let id = makeTokenId(prefix);
  while (used.has(id)) {
    id = makeTokenId(prefix);
  }
  used.add(id);
  return id;
}

function createUniqueTokenName(baseName: string, existingNames: readonly string[]): string {
  return createUniqueTokenNameFromSet(baseName, new Set(existingNames));
}

function createUniqueTokenNameFromSet(baseName: string, used: Set<string>): string {
  return createUniqueNameFromSet(baseName, used);
}

function createUniqueName(baseName: string, existingNames: readonly string[]): string {
  return createUniqueNameFromSet(baseName, new Set(existingNames));
}

function createUniqueNameFromSet(baseName: string, used: Set<string>): string {
  let name = baseName;
  let suffix = 2;
  while (used.has(name)) {
    name = `${baseName}-${suffix}`;
    suffix += 1;
  }
  used.add(name);
  return name;
}

export type ReorderPosition = 'before' | 'after';

function reorderById<T extends { id: string }>(
  items: T[],
  sourceId: string,
  targetId: string,
  position: ReorderPosition,
): T[] {
  if (sourceId === targetId) return items;
  const source = items.find((item) => item.id === sourceId);
  if (!source) return items;
  const withoutSource = items.filter((item) => item.id !== sourceId);
  const targetIndex = withoutSource.findIndex((item) => item.id === targetId);
  if (targetIndex < 0) return items;
  const insertIndex = position === 'after' ? targetIndex + 1 : targetIndex;
  return [
    ...withoutSource.slice(0, insertIndex),
    source,
    ...withoutSource.slice(insertIndex),
  ];
}

function validateDisplayName(name: string, label: string): string | null {
  return name.length > 0 ? null : `${label} name is required.`;
}
