import type { InspectorField, TokenCollection, TokenFieldScope, TokenFieldScopesMap, TokenRegistry } from './types';

export type TokenScopeTarget = {
  collectionId: string;
  groupId?: string;
};

export type TokenFieldScopeFilter = {
  collectionId: string | 'all';
  groupId: string | 'all';
};

export function getTokenFieldScopes(registry: TokenRegistry): TokenFieldScopesMap {
  return normalizeFieldScopes(registry.fieldScopes ?? {});
}

export function setTokenFieldScope(
  registry: TokenRegistry,
  field: InspectorField,
  target: TokenScopeTarget,
  enabled: boolean,
): TokenRegistry {
  const scopes = getTokenFieldScopes(registry);
  const currentScopes = scopes[field] ?? [];
  const nextScopes = getNextScopes(currentScopes, target, enabled);
  const nextFieldScopes = {
    ...scopes,
    [field]: nextScopes,
  };
  if (nextScopes.length === 0) delete nextFieldScopes[field];

  return {
    ...registry,
    fieldScopes: nextFieldScopes,
  };
}

export function cleanupTokenFieldScopes(
  fieldScopes: TokenFieldScopesMap | undefined,
  target: { collectionId?: string; groupIds?: ReadonlySet<string> },
): TokenFieldScopesMap {
  const entries = Object.entries(fieldScopes ?? {}).flatMap(([field, scopes]) => {
    const nextScopes = (scopes ?? []).filter((scope) => {
      if (target.collectionId && scope.collectionId !== target.collectionId) return true;
      if (target.groupIds) return !scope.groupId || !target.groupIds.has(scope.groupId);
      return !target.collectionId;
    });
    return nextScopes.length > 0 ? [[field, nextScopes]] : [];
  });
  return Object.fromEntries(entries) as TokenFieldScopesMap;
}

export function duplicateTokenFieldScopes(
  fieldScopes: TokenFieldScopesMap | undefined,
  collectionId: string,
  groupIdMap: ReadonlyMap<string, string>,
): TokenFieldScopesMap {
  const entries = Object.entries(fieldScopes ?? {}).map(([field, scopes]) => {
    const copiedScopes = (scopes ?? []).flatMap((scope) => {
      if (scope.collectionId !== collectionId || !scope.groupId) return [];
      const copiedGroupId = groupIdMap.get(scope.groupId);
      return copiedGroupId ? [{ collectionId, groupId: copiedGroupId }] : [];
    });
    return [field, dedupeScopes([...(scopes ?? []), ...copiedScopes])];
  });
  return Object.fromEntries(entries) as TokenFieldScopesMap;
}

export function getScopeFieldsForTarget(registry: TokenRegistry, target: TokenScopeTarget): InspectorField[] {
  return Object.entries(getTokenFieldScopes(registry)).flatMap(([field, scopes]) =>
    (scopes ?? []).some((scope) => isSameScope(scope, target)) ? [field as InspectorField] : [],
  );
}

export function getAvailableGroupScopeFields(registry: TokenRegistry, collectionId: string): InspectorField[] {
  return getScopeFieldsForTarget(registry, { collectionId });
}

export function isTokenExposedToField(registry: TokenRegistry, field: InspectorField, target: TokenScopeTarget): boolean {
  const scopes = getTokenFieldScopes(registry)[field] ?? [];
  const collectionScopes = scopes.filter((scope) => scope.collectionId === target.collectionId);
  if (collectionScopes.length === 0) return false;
  const groupScopes = collectionScopes.filter((scope) => scope.groupId);
  if (target.groupId && groupScopes.length > 0) {
    return groupScopes.some((scope) => scope.groupId === target.groupId);
  }
  return collectionScopes.some((scope) => !scope.groupId);
}

export function hasScopesForField(registry: TokenRegistry, field: InspectorField): boolean {
  return (getTokenFieldScopes(registry)[field] ?? []).length > 0;
}

export function getFieldScopeCollections(registry: TokenRegistry, field: InspectorField | undefined): TokenCollection[] {
  if (!field) return registry.collections;
  const scopes = getTokenFieldScopes(registry)[field] ?? [];
  if (scopes.length === 0) return registry.collections;
  const scopedCollectionIds = new Set(scopes.map((scope) => scope.collectionId));
  return registry.collections.filter((collection) => scopedCollectionIds.has(collection.id));
}

export function getFieldScopeGroups(
  registry: TokenRegistry,
  field: InspectorField | undefined,
  collection: TokenCollection | null,
): TokenCollection['groups'] {
  if (!collection) return [];
  if (!field) return collection.groups;
  const scopes = getTokenFieldScopes(registry)[field] ?? [];
  const collectionScopes = scopes.filter((scope) => scope.collectionId === collection.id);
  const scopedGroupIds = new Set(collectionScopes.flatMap((scope) => scope.groupId ? [scope.groupId] : []));
  if (collectionScopes.length === 0 || scopedGroupIds.size === 0) return collection.groups;
  return collection.groups.filter((group) => scopedGroupIds.has(group.id));
}

export function reconcileTokenFieldScopeFilter(
  registry: TokenRegistry,
  field: InspectorField | undefined,
  filter: Partial<TokenFieldScopeFilter> | null | undefined,
  fallbackCollectionId?: string,
): TokenFieldScopeFilter {
  const collections = getFieldScopeCollections(registry, field);
  const requestedCollectionId = filter?.collectionId ?? fallbackCollectionId ?? 'all';
  const collectionId = requestedCollectionId !== 'all' && collections.some((collection) => collection.id === requestedCollectionId)
    ? requestedCollectionId
    : 'all';
  const selectedCollection = collectionId === 'all'
    ? null
    : registry.collections.find((collection) => collection.id === collectionId) ?? null;
  const groups = getFieldScopeGroups(registry, field, selectedCollection);
  const requestedGroupId = filter?.groupId ?? 'all';
  const groupId = selectedCollection && requestedGroupId !== 'all' && groups.some((group) => group.id === requestedGroupId)
    ? requestedGroupId
    : 'all';

  return { collectionId, groupId };
}

function normalizeFieldScopes(fieldScopes: TokenFieldScopesMap): TokenFieldScopesMap {
  return Object.fromEntries(
    Object.entries(fieldScopes).map(([field, scopes]) => [field, dedupeScopes(scopes ?? [])]),
  ) as TokenFieldScopesMap;
}

function getNextScopes(scopes: TokenFieldScope[], target: TokenScopeTarget, enabled: boolean): TokenFieldScope[] {
  if (enabled) {
    const withParent = target.groupId ? addScope(scopes, { collectionId: target.collectionId }) : scopes;
    return addScope(withParent, target);
  }
  if (!target.groupId) {
    return scopes.filter((scope) => scope.collectionId !== target.collectionId);
  }
  return scopes.filter((scope) => !isSameScope(scope, target));
}

function addScope(scopes: TokenFieldScope[], target: TokenScopeTarget): TokenFieldScope[] {
  return dedupeScopes([...scopes, target]);
}

function dedupeScopes(scopes: TokenFieldScope[]): TokenFieldScope[] {
  const seen = new Set<string>();
  return scopes.filter((scope) => {
    const key = getScopeKey(scope);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function isSameScope(left: TokenFieldScope, right: TokenScopeTarget): boolean {
  return left.collectionId === right.collectionId && left.groupId === right.groupId;
}

function getScopeKey(scope: TokenFieldScope): string {
  return `${scope.collectionId}:${scope.groupId ?? '*'}`;
}
