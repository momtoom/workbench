import { getProjectCollectionTokenCssVariableName } from './cssExport';
import type { InspectorField, TokenCollection, TokenFieldScope, TokenReference, TokenRegistry } from './types';
import { collectTokenValueReferences, getTokenReferenceIdentity } from './referenceGraph';
import { cleanupTokenFieldScopes, getTokenFieldScopes } from './fieldScopes';

export type TokenValueReferenceUsage = {
  kind: 'token-value';
  source: TokenReference & { modeId: string };
  target: TokenReference;
};

export type TokenFieldScopeUsage = {
  kind: 'field-scope';
  field: InspectorField;
  collectionId: string;
  groupId?: string;
};

export type TokenSourceUsage = {
  kind: 'source';
  count: number;
  sourceFile: string;
  sourceId: string;
  sourceLabel: string;
  variableName: string;
};

export type TokenUsageSourceInput = {
  contents: string;
  sourceFile: string;
  sourceId: string;
  sourceLabel: string;
};

export type TokenUsageIndex = {
  sourceUsagesByTarget: Map<string, TokenSourceUsage[]>;
  tokenReferencesByTarget: Map<string, TokenValueReferenceUsage[]>;
  fieldScopesByCollection: Map<string, TokenFieldScopeUsage[]>;
  fieldScopesByGroup: Map<string, TokenFieldScopeUsage[]>;
};

export type TokenFieldScopeUsageTarget = {
  collectionId?: string;
  groupIds?: ReadonlySet<string>;
};

export type TokenScopeUsageTarget = {
  collectionId: string;
  groupId?: string;
};

export function buildTokenUsageIndex(registry: TokenRegistry, sources: TokenUsageSourceInput[] = []): TokenUsageIndex {
  const index: TokenUsageIndex = {
    sourceUsagesByTarget: new Map(),
    tokenReferencesByTarget: new Map(),
    fieldScopesByCollection: new Map(),
    fieldScopesByGroup: new Map(),
  };

  for (const collection of registry.collections) {
    for (const token of collection.tokens) {
      for (const [modeId, value] of Object.entries(token.values)) {
        for (const target of collectTokenValueReferences(value)) {
          const usage: TokenValueReferenceUsage = {
            kind: 'token-value',
            source: { collectionId: collection.id, tokenId: token.id, modeId },
            target,
          };
          appendUsage(index.tokenReferencesByTarget, getTokenReferenceIdentity(target), usage);
        }
      }
    }
  }

  for (const [field, scopes] of Object.entries(getTokenFieldScopes(registry)) as Array<[InspectorField, TokenFieldScope[] | undefined]>) {
    for (const scope of scopes ?? []) {
      const usage: TokenFieldScopeUsage = {
        kind: 'field-scope',
        field,
        collectionId: scope.collectionId,
        groupId: scope.groupId,
      };
      appendUsage(index.fieldScopesByCollection, scope.collectionId, usage);
      if (scope.groupId) appendUsage(index.fieldScopesByGroup, getFieldScopeGroupKey(scope.collectionId, scope.groupId), usage);
    }
  }

  const tokenVariableLookup = createTokenVariableLookup(registry);
  for (const source of sources) {
    const variableCounts = collectCssVariableReferenceCounts(source.contents);
    for (const [variableName, count] of variableCounts) {
      for (const target of tokenVariableLookup.get(variableName) ?? []) {
        appendUsage(index.sourceUsagesByTarget, getTokenReferenceIdentity(target), {
          kind: 'source',
          count,
          sourceFile: source.sourceFile,
          sourceId: source.sourceId,
          sourceLabel: source.sourceLabel,
          variableName,
        });
      }
    }
  }

  return index;
}

export function getTokenSourceUsages(index: TokenUsageIndex, target: TokenReference): TokenSourceUsage[] {
  return index.sourceUsagesByTarget.get(getTokenReferenceIdentity(target)) ?? [];
}

export function getTokenReferenceUsages(index: TokenUsageIndex, target: TokenReference): TokenValueReferenceUsage[] {
  return index.tokenReferencesByTarget.get(getTokenReferenceIdentity(target)) ?? [];
}

export function getTokenFieldScopeUsages(index: TokenUsageIndex, target: TokenFieldScopeUsageTarget): TokenFieldScopeUsage[] {
  if (target.collectionId && target.groupIds) {
    return [...target.groupIds].flatMap((groupId) => index.fieldScopesByGroup.get(getFieldScopeGroupKey(target.collectionId!, groupId)) ?? []);
  }
  if (target.collectionId) return index.fieldScopesByCollection.get(target.collectionId) ?? [];
  return [];
}

export function getTokenScopeFieldScopeUsages(index: TokenUsageIndex, target: TokenScopeUsageTarget): TokenFieldScopeUsage[] {
  const usages = index.fieldScopesByCollection.get(target.collectionId) ?? [];
  return usages.filter((usage) => !usage.groupId || usage.groupId === target.groupId);
}

export { cleanupTokenFieldScopes };

function appendUsage<T>(map: Map<string, T[]>, key: string, usage: T) {
  const usages = map.get(key);
  if (usages) {
    usages.push(usage);
    return;
  }
  map.set(key, [usage]);
}

function getFieldScopeGroupKey(collectionId: string, groupId: string): string {
  return `${collectionId}:${groupId}`;
}

function createTokenVariableLookup(registry: TokenRegistry): Map<string, TokenReference[]> {
  const lookup = new Map<string, TokenReference[]>();

  for (const collection of registry.collections) {
    for (const token of collection.tokens) {
      const reference = { collectionId: collection.id, tokenId: token.id };
      for (const variableName of getTokenVariableNames(collection, token.id)) {
        appendUniqueReference(lookup, variableName, reference);
      }
    }
  }

  return lookup;
}

function getTokenVariableNames(collection: TokenCollection, tokenId: string): string[] {
  const variables = [
    getProjectCollectionTokenCssVariableName(collection.id, tokenId),
  ];
  const collectionId = collection.id.toLowerCase();

  if (collectionId.includes('primitive')) variables.push(`--p-${tokenId}`);
  if (collectionId.includes('semantic')) variables.push(`--s-${tokenId}`);
  if (collectionId.includes('component')) variables.push(`--c-${tokenId}`);

  return variables;
}

function collectCssVariableReferenceCounts(contents: string): Map<string, number> {
  const counts = new Map<string, number>();
  const variablePattern = /var\(\s*(--[a-zA-Z0-9_-]+)/g;
  let match = variablePattern.exec(contents);

  while (match) {
    const variableName = match[1];
    if (variableName) counts.set(variableName, (counts.get(variableName) ?? 0) + 1);
    match = variablePattern.exec(contents);
  }

  return counts;
}

function appendUniqueReference(map: Map<string, TokenReference[]>, key: string, reference: TokenReference) {
  const references = map.get(key);
  if (references) {
    if (!references.some((candidate) => candidate.collectionId === reference.collectionId && candidate.tokenId === reference.tokenId)) {
      references.push(reference);
    }
    return;
  }
  map.set(key, [reference]);
}
