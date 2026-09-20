import type { DesignToken, InspectorField, TokenFieldScopesMap, TokenRawLiteral, TokenRegistry, TokenType } from './types';
import { cssGradientLiteralToValue, isCssGradientLiteral } from './gradient';

type ImportedToken = {
  id: string;
  name: string;
  type: TokenType;
  value: TokenRawLiteral;
  groupId: string;
};

type TokenImportTarget = {
  collectionId: string;
  collectionName: string;
  extensions: Record<string, unknown>;
};

export type TokenImportResult = {
  registry: TokenRegistry;
  importedCount: number;
  skippedCount: number;
};

export function importTokensFromSource(
  registry: TokenRegistry,
  contents: string,
  sourcePath: string,
): TokenImportResult {
  const importedTokens = parseJsonTokens(contents, sourcePath) ?? parseCssVariableTokens(contents, sourcePath);
  if (importedTokens.length === 0) {
    return {
      registry,
      importedCount: 0,
      skippedCount: 0,
    };
  }

  const nextRegistry = cloneRegistry(registry);
  const importTarget = getTokenImportTarget(sourcePath);
  if (importTarget.collectionId !== 'imported') {
    pruneLegacyImportedTokensFromSource(nextRegistry, sourcePath);
  }

  let collection = nextRegistry.collections.find((candidate) => candidate.id === importTarget.collectionId);
  if (!collection) {
    collection = {
      id: importTarget.collectionId,
      name: importTarget.collectionName,
      modes: [{ id: 'default', name: 'Default' }],
      activeMode: 'default',
      groups: [],
      tokens: [],
      extensions: importTarget.extensions,
    };
    nextRegistry.collections.push(collection);
  } else {
    collection.extensions = {
      ...(collection.extensions ?? {}),
      ...importTarget.extensions,
    };
  }

  let importedCount = 0;
  let skippedCount = 0;

  for (const imported of importedTokens) {
    if (!collection.groups.some((group) => group.id === imported.groupId)) {
      collection.groups.push({ id: imported.groupId, name: formatGroupName(imported.groupId) });
    }

    const existing = collection.tokens.find((token) => token.id === imported.id);
    if (existing) {
      if (existing.type !== imported.type) {
        skippedCount += 1;
        continue;
      }
      existing.name = imported.name;
      existing.groupId = imported.groupId;
      existing.values.default = { kind: 'raw', value: imported.value };
      importedCount += 1;
      continue;
    }

    collection.tokens.push({
      id: imported.id,
      name: imported.name,
      type: imported.type,
      groupId: imported.groupId,
      values: { default: { kind: 'raw', value: imported.value } },
      sortOrder: nextSortOrder(collection.tokens),
      extensions: { importedFrom: sourcePath },
    });
    importedCount += 1;
  }

  return {
    registry: importedCount > 0 ? applyImportedFieldScopes(nextRegistry, collection.id) : nextRegistry,
    importedCount,
    skippedCount,
  };
}

function getTokenImportTarget(sourcePath: string): TokenImportTarget {
  const libraryId = inferLibraryIdFromTokenSourcePath(sourcePath);
  if (libraryId) {
    return {
      collectionId: libraryId,
      collectionName: formatLibraryTokenCollectionName(libraryId),
      extensions: {
        source: libraryId,
        importedFrom: sourcePath,
        importKind: 'library-css',
      },
    };
  }

  return {
    collectionId: 'imported',
    collectionName: 'Imported',
    extensions: {
      importedFrom: sourcePath,
      importKind: 'loose-source',
    },
  };
}

function inferLibraryIdFromTokenSourcePath(sourcePath: string): string | null {
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

function pruneLegacyImportedTokensFromSource(registry: TokenRegistry, sourcePath: string): void {
  const collection = registry.collections.find((candidate) => candidate.id === 'imported');
  if (!collection) return;

  const source = normalizeTokenSourcePath(sourcePath);
  const nextTokens = collection.tokens.filter((token) => (
    normalizeTokenSourcePath(token.extensions?.importedFrom) !== source
  ));
  if (nextTokens.length === collection.tokens.length) return;

  if (nextTokens.length === 0) {
    registry.collections = registry.collections.filter((candidate) => candidate.id !== collection.id);
    removeFieldScopesForCollection(registry, collection.id);
    return;
  }

  const remainingGroupIds = new Set(nextTokens
    .map((token) => token.groupId)
    .filter((groupId): groupId is string => typeof groupId === 'string'));
  collection.tokens = nextTokens.map((token, sortOrder) => ({ ...token, sortOrder }));
  collection.groups = collection.groups.filter((group) => remainingGroupIds.has(group.id));
  removeEmptyFieldScopesForCollection(registry, collection.id, remainingGroupIds);
}

function normalizeTokenSourcePath(value: unknown): string {
  return typeof value === 'string'
    ? value.trim().replace(/^[/\\]+/, '').replace(/\\/g, '/').toLowerCase()
    : '';
}

function removeFieldScopesForCollection(registry: TokenRegistry, collectionId: string): void {
  const fieldScopes: TokenFieldScopesMap = { ...(registry.fieldScopes ?? {}) };
  for (const [field, scopes] of Object.entries(fieldScopes) as Array<[InspectorField, TokenFieldScopesMap[InspectorField]]>) {
    fieldScopes[field] = (scopes ?? []).filter((scope) => scope.collectionId !== collectionId);
  }
  registry.fieldScopes = fieldScopes;
}

function removeEmptyFieldScopesForCollection(
  registry: TokenRegistry,
  collectionId: string,
  remainingGroupIds: Set<string>,
): void {
  const fieldScopes: TokenFieldScopesMap = { ...(registry.fieldScopes ?? {}) };
  for (const [field, scopes] of Object.entries(fieldScopes) as Array<[InspectorField, TokenFieldScopesMap[InspectorField]]>) {
    fieldScopes[field] = (scopes ?? []).filter((scope) => (
      scope.collectionId !== collectionId ||
      !scope.groupId ||
      remainingGroupIds.has(scope.groupId)
    ));
  }
  registry.fieldScopes = fieldScopes;
}

/**
 * CSS-var prefixes that belong to imported design-system internals and must
 * not be inferred as project tokens (the workbench treats `--wb-*` as the
 * authoritative token surface for everything else). Each imported library gets
 * its own path-derived short prefix plus the common 3-layer convention
 * (`--p-`, `--s-`, `--c-`).
 */
const COMMON_LIBRARY_INTERNAL_VAR_PREFIXES = ['p-', 's-', 'c-'];

function parseCssVariableTokens(contents: string, sourcePath: string): ImportedToken[] {
  const tokens: ImportedToken[] = [];
  const internalVarPrefixes = getLibraryInternalVarPrefixes(sourcePath);
  const variablePattern = /--([a-zA-Z0-9_-]+)\s*:\s*([^;]+);/g;
  let match = variablePattern.exec(contents);

  while (match) {
    const rawName = match[1] ?? '';
    const rawValue = (match[2] ?? '').trim();
    const inferred = isImportableCssTokenValue(rawValue)
      ? inferWorkbenchCssVariableToken(rawName, rawValue) ??
      (internalVarPrefixes.some((prefix) => rawName.startsWith(prefix))
        ? null
        : inferToken(rawName, rawValue))
      : null;
    if (inferred) tokens.push(inferred);
    match = variablePattern.exec(contents);
  }

  return tokens;
}

function isImportableCssTokenValue(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length > 0 && !/[{};]/.test(trimmed);
}

function getLibraryInternalVarPrefixes(sourcePath: string): string[] {
  const normalized = sourcePath.replace(/\\/g, '/');
  const libraryMatch = /(?:^|\/)libraries\/([a-z][a-z0-9-]*)\//i.exec(normalized) ??
    /(?:^|\/)([a-z][a-z0-9-]*)-preset\//i.exec(normalized);
  const libraryPrefix = libraryMatch?.[1] ? [`${libraryMatch[1].toLowerCase()}-`] : [];
  return [...libraryPrefix, ...COMMON_LIBRARY_INTERNAL_VAR_PREFIXES];
}

type CssVarNamespace =
  | 'color'
  | 'spacing'
  | 'borderRadius'
  | 'fontSize'
  | 'fontWeight'
  | 'lineHeight'
  | 'letterSpacing'
  | 'borderWidth'
  | 'opacity';

type WorkbenchCssVariableMatch = {
  fallback: string;
  namespace: CssVarNamespace;
  tokenName: string;
};

const WORKBENCH_CSS_VAR_PREFIXES: Array<{ namespace: CssVarNamespace; prefix: string }> = [
  { namespace: 'color', prefix: 'ds-color-' },
  { namespace: 'color', prefix: 'wb-color-' },
  { namespace: 'spacing', prefix: 'ds-spacing-' },
  { namespace: 'spacing', prefix: 'wb-spacing-' },
  { namespace: 'borderRadius', prefix: 'ds-borderRadius-' },
  { namespace: 'borderRadius', prefix: 'ds-radius-' },
  { namespace: 'borderRadius', prefix: 'wb-borderRadius-' },
  { namespace: 'fontSize', prefix: 'ds-fontSize-' },
  { namespace: 'fontSize', prefix: 'ds-font-size-' },
  { namespace: 'fontSize', prefix: 'wb-fontSize-' },
  { namespace: 'fontWeight', prefix: 'ds-fontWeight-' },
  { namespace: 'fontWeight', prefix: 'ds-font-weight-' },
  { namespace: 'fontWeight', prefix: 'wb-fontWeight-' },
  { namespace: 'lineHeight', prefix: 'ds-lineHeight-' },
  { namespace: 'lineHeight', prefix: 'ds-line-height-' },
  { namespace: 'lineHeight', prefix: 'wb-lineHeight-' },
  { namespace: 'letterSpacing', prefix: 'ds-letterSpacing-' },
  { namespace: 'letterSpacing', prefix: 'ds-letter-spacing-' },
  { namespace: 'letterSpacing', prefix: 'wb-letterSpacing-' },
  { namespace: 'borderWidth', prefix: 'ds-borderWidth-' },
  { namespace: 'borderWidth', prefix: 'ds-border-width-' },
  { namespace: 'borderWidth', prefix: 'wb-borderWidth-' },
  { namespace: 'opacity', prefix: 'ds-opacity-' },
  { namespace: 'opacity', prefix: 'wb-opacity-' },
];

function inferWorkbenchCssVariableToken(rawName: string, rawValue: string): ImportedToken | null {
  const direct = parseWorkbenchCssVariableName(rawName);
  if (direct) return createWorkbenchImportedToken(direct.namespace, direct.tokenName, rawValue);

  const alias = parseWorkbenchCssVariableAlias(rawValue);
  if (!alias) return null;
  return createWorkbenchImportedToken(alias.namespace, alias.tokenName, alias.fallback);
}

function parseWorkbenchCssVariableName(rawName: string): Omit<WorkbenchCssVariableMatch, 'fallback'> | null {
  for (const { namespace, prefix } of WORKBENCH_CSS_VAR_PREFIXES) {
    if (!rawName.startsWith(prefix)) continue;
    const tokenName = rawName.slice(prefix.length).trim();
    return tokenName ? { namespace, tokenName } : null;
  }
  return null;
}

function parseWorkbenchCssVariableAlias(rawValue: string): WorkbenchCssVariableMatch | null {
  const match = rawValue.trim().match(/^var\(\s*--([a-zA-Z0-9_-]+)\s*,\s*([\s\S]+)\)$/);
  if (!match) return null;

  const parsedName = parseWorkbenchCssVariableName(match[1] ?? '');
  const fallback = (match[2] ?? '').trim();
  return parsedName && fallback ? { ...parsedName, fallback } : null;
}

function createWorkbenchImportedToken(
  namespace: CssVarNamespace,
  tokenName: string,
  rawValue: string,
): ImportedToken | null {
  const normalizedValue = rawValue.trim();
  if (!normalizedValue) return null;

  if (namespace === 'color') {
    if (isCssGradientLiteral(normalizedValue)) {
      return createImportedToken(tokenName, tokenName, 'gradient', cssGradientLiteralToValue(normalizedValue) ?? normalizedValue, 'effects');
    }
    return createImportedToken(tokenName, tokenName, 'color', normalizedValue, 'colors');
  }

  if (namespace === 'spacing') {
    const unitValue = parseUnitValue(normalizedValue);
    return createImportedToken(tokenName, tokenName, unitValue ? 'dimension' : 'string', unitValue ?? normalizedValue, 'spacing');
  }

  if (namespace === 'borderRadius') {
    const unitValue = parseUnitValue(normalizedValue);
    return createImportedToken(tokenName, tokenName, unitValue ? 'dimension' : 'string', unitValue ?? normalizedValue, 'radius');
  }

  if (namespace === 'fontSize') {
    const unitValue = parseUnitValue(normalizedValue);
    return createImportedToken(tokenName, tokenName, unitValue ? 'dimension' : 'string', unitValue ?? normalizedValue, 'font-size');
  }

  if (namespace === 'fontWeight') {
    const numericValue = Number(normalizedValue);
    return createImportedToken(tokenName, tokenName, Number.isFinite(numericValue) ? 'number' : 'string', Number.isFinite(numericValue) ? numericValue : normalizedValue, 'font-weight');
  }

  if (namespace === 'lineHeight') {
    const unitValue = parseUnitValue(normalizedValue);
    return createImportedToken(tokenName, tokenName, unitValue ? 'dimension' : 'string', unitValue ?? normalizedValue, 'line-height');
  }

  if (namespace === 'letterSpacing') {
    const unitValue = parseUnitValue(normalizedValue);
    return createImportedToken(tokenName, tokenName, unitValue ? 'dimension' : 'string', unitValue ?? normalizedValue, 'letter-spacing');
  }

  if (namespace === 'borderWidth') {
    const unitValue = parseUnitValue(normalizedValue);
    return createImportedToken(tokenName, tokenName, unitValue ? 'dimension' : 'string', unitValue ?? normalizedValue, 'border-width');
  }

  const opacityValue = parseOpacityValue(normalizedValue);
  return createImportedToken(tokenName, tokenName, opacityValue ? 'opacity' : 'string', opacityValue ?? normalizedValue, 'opacity');
}

function parseJsonTokens(contents: string, sourcePath: string): ImportedToken[] | null {
  if (!sourcePath.endsWith('.json')) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(contents);
  } catch {
    return null;
  }

  const buckets = findTokenBuckets(parsed);
  const tokens: ImportedToken[] = [];

  for (const [groupId, values] of Object.entries(buckets)) {
    flattenObject(values).forEach(([name, value]) => {
      const inferred = inferToken(`${groupId}-${name}`, String(value), groupId);
      if (inferred) tokens.push(inferred);
    });
  }

  return tokens;
}

function findTokenBuckets(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) return {};
  const theme = isRecord(value.theme) ? value.theme : value;
  const extend = isRecord(theme.extend) ? theme.extend : {};
  return {
    colors: mergeRecords(theme.colors, extend.colors),
    spacing: mergeRecords(theme.spacing, extend.spacing),
    radius: mergeRecords(theme.borderRadius, extend.borderRadius),
    typography: mergeRecords(theme.fontSize, extend.fontSize),
    fontWeight: mergeRecords(theme.fontWeight, extend.fontWeight),
    opacity: mergeRecords(theme.opacity, extend.opacity),
  };
}

function inferToken(name: string, rawValue: string, groupOverride?: string): ImportedToken | null {
  const id = slugify(name);
  if (!id || rawValue.length === 0) return null;

  if (isColorValue(rawValue)) {
    return createImportedToken(id, name, 'color', rawValue, groupOverride ?? 'colors');
  }

  if (isCssGradientLiteral(rawValue)) {
    return createImportedToken(id, name, 'gradient', cssGradientLiteralToValue(rawValue) ?? rawValue, groupOverride ?? 'effects');
  }

  const unitValue = parseUnitValue(rawValue);
  if (unitValue) {
    if (unitValue.unit === 'ms' || unitValue.unit === 's') {
      return createImportedToken(id, name, 'duration', unitValue, groupOverride ?? 'duration');
    }
    if (unitValue.unit === 'deg' || unitValue.unit === 'rad' || unitValue.unit === 'turn') {
      return createImportedToken(id, name, 'angle', unitValue, groupOverride ?? 'angle');
    }
    if (unitValue.unit === '%' && id.includes('opacity')) {
      return createImportedToken(id, name, 'opacity', unitValue, groupOverride ?? 'opacity');
    }
    return createImportedToken(id, name, 'dimension', unitValue, groupOverride ?? 'dimension');
  }

  if (/^-?\d+(\.\d+)?$/.test(rawValue)) {
    const numericValue = Number(rawValue);
    if (id.includes('opacity')) {
      return createImportedToken(id, name, 'opacity', { value: numericValue, unit: 'number' }, groupOverride ?? 'opacity');
    }
    return createImportedToken(id, name, 'number', numericValue, groupOverride ?? 'number');
  }

  return createImportedToken(id, name, 'string', rawValue, groupOverride ?? 'string');
}

function createImportedToken(
  id: string,
  name: string,
  type: TokenType,
  value: TokenRawLiteral,
  groupId: string,
): ImportedToken {
  const tokenName = toSafeTokenIdentifier(id || name);
  return {
    id: tokenName,
    name: tokenName,
    type,
    value,
    groupId: slugify(groupId) || 'imported',
  };
}

function parseUnitValue(value: string): null | { value: number; unit: 'px' | 'rem' | 'em' | '%' | 'vh' | 'vw' | 'ms' | 's' | 'deg' | 'rad' | 'turn' } {
  const match = value.match(/^(-?\d+(?:\.\d+)?)(px|rem|em|%|vh|vw|ms|s|deg|rad|turn)$/);
  if (!match) return null;
  return {
    value: Number(match[1]),
    unit: match[2] as 'px' | 'rem' | 'em' | '%' | 'vh' | 'vw' | 'ms' | 's' | 'deg' | 'rad' | 'turn',
  };
}

function parseOpacityValue(value: string): null | { value: number; unit: '%' | 'number' } {
  const percentMatch = value.match(/^(-?\d+(?:\.\d+)?)%$/);
  if (percentMatch) return { value: Number(percentMatch[1]), unit: '%' };
  if (/^-?\d+(\.\d+)?$/.test(value)) return { value: Number(value), unit: 'number' };
  return null;
}

const IMPORTED_GROUP_FIELD_SCOPES: Record<string, InspectorField[]> = {
  colors: ['bgColor', 'textColor', 'borderColor'],
  spacing: ['padding', 'margin', 'gap', 'width', 'height', 'minWidth', 'maxWidth', 'minHeight', 'maxHeight'],
  radius: ['borderRadius'],
  'font-size': ['fontSize'],
  typography: ['fontSize'],
  'font-weight': ['fontWeight'],
  fontWeight: ['fontWeight'],
  'line-height': ['lineHeight'],
  'letter-spacing': ['letterSpacing'],
  'border-width': ['borderWidth'],
  opacity: ['opacity'],
  effects: ['bgColor'],
};

function applyImportedFieldScopes(registry: TokenRegistry, collectionId: string): TokenRegistry {
  const collection = registry.collections.find((candidate) => candidate.id === collectionId);
  if (!collection) return registry;

  const fieldScopes: TokenFieldScopesMap = { ...(registry.fieldScopes ?? {}) };
  for (const group of collection.groups) {
    const fields = IMPORTED_GROUP_FIELD_SCOPES[group.id] ?? [];
    for (const field of fields) {
      const current = fieldScopes[field] ?? [];
      const exists = current.some((scope) => scope.collectionId === collectionId && scope.groupId === group.id);
      if (!exists) fieldScopes[field] = [...current, { collectionId, groupId: group.id }];
    }
  }

  return {
    ...registry,
    fieldScopes,
  };
}

function isColorValue(value: string): boolean {
  return /^#([0-9a-f]{3,8})$/i.test(value) || /^(rgb|rgba|hsl|hsla)\(/i.test(value);
}

function flattenObject(value: unknown, prefix = ''): Array<[string, string | number]> {
  if (!isRecord(value)) return [];
  return Object.entries(value).flatMap(([key, nested]) => {
    const nextKey = prefix ? `${prefix}-${key}` : key;
    if (typeof nested === 'string' || typeof nested === 'number') return [[nextKey, nested]];
    return flattenObject(nested, nextKey);
  });
}

function mergeRecords(left: unknown, right: unknown): Record<string, unknown> {
  return {
    ...(isRecord(left) ? left : {}),
    ...(isRecord(right) ? right : {}),
  };
}

function nextSortOrder(tokens: DesignToken[]): number {
  return Math.max(-1, ...tokens.map((token) => token.sortOrder)) + 1;
}

function formatGroupName(value: string): string {
  return value
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part[0]!.toUpperCase() + part.slice(1))
    .join(' ');
}

function toSafeTokenIdentifier(value: string): string {
  const slug = slugify(value);
  if (!slug) return 'token';
  return /^[a-zA-Z0-9_]/.test(slug) ? slug : `token-${slug}`;
}

function slugify(value: string): string {
  return value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function cloneRegistry(registry: TokenRegistry): TokenRegistry {
  return JSON.parse(JSON.stringify(registry)) as TokenRegistry;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
