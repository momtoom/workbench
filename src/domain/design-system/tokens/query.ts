import type {
  DesignToken,
  InspectorField,
  ResolvedTokenValue,
  TokenCollection,
  TokenReference,
  TokenRegistry,
  TokenType,
} from './types';
import { isGradientValue, serializeTokenRawValue } from './types';
import { getCssVarNamespace, validateTokenForField } from './compatibility';
import {
  getAuthoredTokenCssVariableName,
  getLegacyProjectTokenCssVariableName,
  getProjectCollectionTokenCssVariableName,
  getProjectTokenCssVariableName,
} from './cssExport';
import { hasScopesForField, isTokenExposedToField } from './fieldScopes';
import { gradientPreviewCss, isCssGradientLiteral } from './gradient';
import { foldLightDarkColorValue, type WorkbenchColorSchemeSide } from './lightDark';
import { findToken, getTokenMode, isNumericResolvedValue, resolveTokenValue } from './resolver';
import { collectTokenValueReferences, tokenReferencePathReachesTarget } from './referenceGraph';

export type TokenPickerQuery = {
  search?: string;
  collectionId?: string | 'all';
  groupId?: string | 'all';
  type?: TokenType | 'all';
  field?: InspectorField;
  allowedTypes?: TokenType[];
  exclude?: TokenReference[];
  cycleTarget?: TokenReference;
  modeId?: string;
  modeByCollection?: Partial<Record<string, string>>;
};

export type TokenPickerResult = {
  collection: TokenCollection;
  token: DesignToken;
  modeId: string;
  resolved: ResolvedTokenValue;
  compatible: boolean;
  disabledReason: string | null;
  cssVariable: string | null;
  cssVariableAliases: string[];
  searchText: string;
  previewText: string;
};

export function queryTokens(registry: TokenRegistry, query: TokenPickerQuery): TokenPickerResult[] {
  const search = query.search?.trim().toLowerCase() ?? '';
  const results: TokenPickerResult[] = [];

  for (const collection of registry.collections) {
    if (query.collectionId && query.collectionId !== 'all' && collection.id !== query.collectionId) continue;
    const modeId = query.modeByCollection?.[collection.id] ?? query.modeId ?? getTokenMode(collection);

    for (const token of [...collection.tokens].sort((a, b) => a.sortOrder - b.sortOrder)) {
      if (query.groupId && query.groupId !== 'all' && token.groupId !== query.groupId) continue;
      if (query.type && query.type !== 'all' && token.type !== query.type) continue;
      if (query.allowedTypes && !query.allowedTypes.includes(token.type)) continue;

      const resolved = resolveTokenValue(token, collection, registry, modeId, query.modeByCollection);
      const group = collection.groups.find((candidate) => candidate.id === token.groupId);
      const searchText = [token.name, token.id, token.type, collection.name, group?.name, stringifyResolved(resolved)]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (search && !searchText.includes(search)) continue;

      const excluded = query.exclude?.some((ref) => ref.collectionId === collection.id && ref.tokenId === token.id) ?? false;
      const fieldWarning = validateTokenForField(token, query.field);
      const scopeWarning = query.field && hasScopesForField(registry, query.field) && !isTokenExposedToField(registry, query.field, { collectionId: collection.id, groupId: token.groupId })
        ? 'This token is hidden by field scope.'
        : null;
      const cycleWarning = query.cycleTarget && createsCycle(registry, query.cycleTarget, { collectionId: collection.id, tokenId: token.id })
        ? 'Selecting this token would create a reference cycle.'
        : null;
      const formulaWarning = query.allowedTypes?.length === 1 && query.allowedTypes.includes('number') && !isNumericResolvedValue(resolved)
        ? 'Formula inputs need a token that resolves to a number.'
        : null;
      const disabledReason = excluded
        ? 'This token is excluded in the current context.'
        : fieldWarning ?? scopeWarning ?? cycleWarning ?? formulaWarning;
      const namespace = getCssVarNamespace(query.field);
      const authoredVariable = getAuthoredTokenCssVariableName(registry, collection, token, query.field);
      const cssVariable = authoredVariable ? `var(${authoredVariable})` : null;
      const cssVariableAliases = namespace
        ? Array.from(new Set([
            ...(cssVariable ? [cssVariable] : []),
            `var(${getProjectTokenCssVariableName(namespace, token.id)})`,
            `var(${getLegacyProjectTokenCssVariableName(namespace, token.id)})`,
            `var(${getProjectCollectionTokenCssVariableName(collection.id, token.id)})`,
          ]))
        : cssVariable ? [cssVariable] : [];

      results.push({
        collection,
        token,
        modeId,
        resolved,
        compatible: disabledReason === null,
        disabledReason,
        cssVariable,
        cssVariableAliases,
        searchText,
        previewText: stringifyResolved(resolved),
      });
    }
  }

  const collectionOrder = new Map(registry.collections.map((collection, index) => [collection.id, index]));

  return results.sort((a, b) => {
    if (a.compatible !== b.compatible) return a.compatible ? -1 : 1;
    if (query.collectionId && query.collectionId !== 'all') {
      if (a.collection.id === query.collectionId && b.collection.id !== query.collectionId) return -1;
      if (a.collection.id !== query.collectionId && b.collection.id === query.collectionId) return 1;
    }
    if (search) {
      const aExact = a.token.name.toLowerCase() === search || a.token.id.toLowerCase() === search;
      const bExact = b.token.name.toLowerCase() === search || b.token.id.toLowerCase() === search;
      if (aExact !== bExact) return aExact ? -1 : 1;
    }
    return (
      (collectionOrder.get(a.collection.id) ?? 0) - (collectionOrder.get(b.collection.id) ?? 0) ||
      a.token.sortOrder - b.token.sortOrder
    );
  });
}

export function findSelectedToken(
  registry: TokenRegistry,
  reference: TokenReference | null | undefined,
  modeByCollection?: Partial<Record<string, string>>,
): TokenPickerResult | null {
  if (!reference) return null;
  const found = findToken(registry, reference.collectionId, reference.tokenId);
  if (!found) return null;
  const modeId = modeByCollection?.[found.collection.id] ?? getTokenMode(found.collection);
  const resolved = resolveTokenValue(found.token, found.collection, registry, modeId, modeByCollection);
  return {
    collection: found.collection,
    token: found.token,
    modeId,
    resolved,
    compatible: resolved !== null,
    disabledReason: resolved === null ? 'Selected token is unresolved.' : null,
    cssVariable: null,
    cssVariableAliases: [],
    searchText: '',
    previewText: stringifyResolved(resolved),
  };
}

export function stringifyResolved(value: ResolvedTokenValue): string {
  if (value === null) return 'Unresolved';
  if (isGradientValue(value)) return 'Gradient';
  if (isCssGradientLiteral(value)) return 'Gradient';
  return serializeTokenRawValue(value);
}

export function getTokenPreviewCss(
  result: TokenPickerResult,
  registry: TokenRegistry,
  colorSchemeSide: WorkbenchColorSchemeSide = 'light',
): string | null {
  if (result.token.type === 'color' && typeof result.resolved === 'string') {
    return resolveColorPreviewValue(result.resolved, registry, result.modeId, colorSchemeSide);
  }
  if (result.token.type === 'gradient') return gradientPreviewCss(result.resolved, registry, result.modeId);
  return null;
}

function resolveColorPreviewValue(
  value: string,
  registry: TokenRegistry,
  modeId: string,
  colorSchemeSide: WorkbenchColorSchemeSide,
): string {
  const found = findToken(registry, 'tailwind-primitives', value);
  if (!found || found.token.type !== 'color') return foldLightDarkColorValue(value, colorSchemeSide);
  const resolved = resolveTokenValue(found.token, found.collection, registry, modeId);
  return typeof resolved === 'string' ? foldLightDarkColorValue(resolved, colorSchemeSide) : value;
}

function createsCycle(registry: TokenRegistry, target: TokenReference, from: TokenReference): boolean {
  return tokenReferencePathReachesTarget(from, target, (reference) => {
    const found = findToken(registry, reference.collectionId, reference.tokenId);
    if (!found) return [];
    return Object.values(found.token.values).flatMap(collectTokenValueReferences);
  });
}
