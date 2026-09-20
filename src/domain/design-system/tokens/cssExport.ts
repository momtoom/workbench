import type { DesignToken, InspectorField, TailwindTokenBuckets, TokenCollection, TokenFieldScope, TokenRegistry, TokenType } from './types';
import { isAngleValue, isDimensionValue, isDurationValue, isOpacityValue, serializeTokenRawValue } from './types';
import { gradientPreviewCss } from './gradient';
import { getTokenMode, resolveTokenValue } from './resolver';
import { getCssVarNamespace, validateTokenForField } from './compatibility';
import { getTokenFieldScopes } from './fieldScopes';

export function buildTailwindTokenBuckets(registry: TokenRegistry, modeId?: string): TailwindTokenBuckets {
  const buckets: TailwindTokenBuckets = {
    colors: {},
    spacing: {},
    borderRadius: {},
    typography: {},
    fontSize: {},
    fontWeight: {},
    lineHeight: {},
    letterSpacing: {},
    borderWidth: {},
    opacity: {},
  };

  for (const [field, scopes] of Object.entries(getTokenFieldScopes(registry)) as Array<[InspectorField, TokenFieldScope[] | undefined]>) {
    const namespace = getCssVarNamespace(field);
    if (!namespace) continue;

    const fieldScopes = scopes ?? [];
    for (const scope of fieldScopes) {
      const collection = registry.collections.find((candidate) => candidate.id === scope.collectionId);
      if (!collection) continue;

      const collectionMode = modeId ?? getTokenMode(collection);
      for (const token of collection.tokens) {
        const hasGroupScopes = fieldScopes.some((candidate) => candidate.collectionId === scope.collectionId && candidate.groupId);
        if (!scope.groupId && hasGroupScopes && token.groupId) continue;
        if (scope.groupId && token.groupId !== scope.groupId) continue;
        if (validateTokenForField(token, field) !== null) continue;

        const cssValue = getTokenCssExportValue(registry, collection, token, collectionMode);
        if (cssValue === null) continue;

        if (namespace === 'color') {
          setTokenBucketValue(buckets.colors, token, cssValue);
        } else if (namespace === 'spacing') {
          setTokenBucketValue(buckets.spacing, token, cssValue);
        } else if (namespace === 'borderRadius') {
          setTokenBucketValue(buckets.borderRadius, token, cssValue);
        } else if (namespace === 'fontSize') {
          setTokenBucketValue(buckets.fontSize, token, cssValue);
          setTokenBucketValue(buckets.typography, token, cssValue);
        } else if (namespace === 'borderWidth') {
          setTokenBucketValue(buckets.borderWidth, token, cssValue);
        } else if (namespace === 'fontWeight') {
          setTokenBucketValue(buckets.fontWeight, token, cssValue);
        } else if (namespace === 'lineHeight') {
          setTokenBucketValue(buckets.lineHeight, token, cssValue);
        } else if (namespace === 'letterSpacing') {
          setTokenBucketValue(buckets.letterSpacing, token, cssValue);
        } else if (namespace === 'opacity') {
          setTokenBucketValue(buckets.opacity, token, cssValue);
        }
      }
    }
  }

  return buckets;
}

export const PROJECT_TOKEN_CSS_VARIABLE_PREFIX = '--ds';
const LEGACY_PROJECT_TOKEN_CSS_VARIABLE_PREFIX = '--wb';

export function getProjectTokenCssVariableName(namespace: string, tokenName: string): string {
  return `${PROJECT_TOKEN_CSS_VARIABLE_PREFIX}-${namespace}-${sanitizeCssVariableSegment(tokenName)}`;
}

export function getLegacyProjectTokenCssVariableName(namespace: string, tokenName: string): string {
  return `${LEGACY_PROJECT_TOKEN_CSS_VARIABLE_PREFIX}-${namespace}-${sanitizeCssVariableSegment(tokenName)}`;
}

export function getProjectCollectionTokenCssVariableName(collectionId: string, tokenName: string): string {
  return getProjectTokenCssVariableName('token', `${sanitizeCssVariableSegment(collectionId)}-${sanitizeCssVariableSegment(tokenName)}`);
}

export function getAuthoredTokenCssVariableName(
  _registry: TokenRegistry,
  _collection: TokenCollection,
  token: DesignToken,
  field?: InspectorField,
): string | null {
  const directVariable = getTokenDirectCssVariableName(token);
  if (directVariable) return directVariable;

  const namespace = getCssVarNamespace(field);
  return namespace ? getProjectTokenCssVariableName(namespace, token.id) : null;
}

export function buildWorkbenchTokenCss(registry: TokenRegistry, modeId?: string): string {
  if (shouldBuildTailwindThemeOverrideCss(registry)) {
    return buildTailwindThemeOverrideCss(registry, modeId);
  }

  const declarations = new Map<string, string>();
  const buckets = buildTailwindTokenBuckets(registry, modeId);

  for (const [bucket, namespace] of CSS_BUCKET_NAMESPACES) {
    const values = buckets[bucket];
    for (const [tokenName, cssValue] of Object.entries(values)) {
      declarations.set(getProjectTokenCssVariableName(namespace, tokenName), cssValue);
    }
  }

  for (const collection of registry.collections) {
    const collectionMode = modeId ?? getTokenMode(collection);
    for (const token of collection.tokens) {
      const cssValue = getTokenCssExportValue(registry, collection, token, collectionMode);
      if (cssValue === null) continue;
      declarations.set(
        getProjectCollectionTokenCssVariableName(collection.id, token.id),
        cssValue,
      );
    }
  }

  const lines = [
    '/* Generated by Workbench from .workbench/tokens.json. Do not edit by hand. */',
    '',
    // Same scoping rule as the tailwind-theme-overrides branch: alias var()
    // chains freeze at their declaring element, so token-mode scope roots must
    // re-declare them to resolve against their own mode.
    ':root,',
    '[data-wb-token-modes] {',
  ];
  for (const [name, value] of [...declarations.entries()].sort(([left], [right]) => left.localeCompare(right))) {
    lines.push(`  ${name}: ${value};`);
  }
  lines.push('}', '');
  lines.push(...buildWorkbenchModeTokenCssBlocks(registry));
  return lines.join('\n');
}

function shouldBuildTailwindThemeOverrideCss(registry: TokenRegistry): boolean {
  const tailwind = isRecord(registry.extensions.tailwind) ? registry.extensions.tailwind : null;
  return tailwind?.cssExport === 'tailwind-theme-overrides';
}

function buildTailwindThemeOverrideCss(registry: TokenRegistry, modeId?: string): string {
  const rootModeId = modeId ?? getTailwindModeId(registry, 'light');
  const darkModeId = getTailwindModeId(registry, 'dark');
  const rootDeclarations = mergeDeclarationMaps(
    collectTailwindThemeDependencyDeclarations(registry, rootModeId),
    collectTailwindThemeDeclarations(registry, rootModeId),
  );
  const darkDeclarations = mergeDeclarationMaps(
    collectTailwindThemeDependencyDeclarations(registry, darkModeId),
    collectTailwindThemeDeclarations(registry, darkModeId),
  );
  const lines = [
    '/* Generated by Workbench from .workbench/tokens.json for Tailwind theme variables. Do not edit by hand. */',
    '',
    // Re-declare the bridge/alias variables at every token-mode scope root,
    // not just :root. var() chains inside custom properties are substituted at
    // the element that declares them, so a chain declared only on :root
    // freezes with the document-level mode; a nested Theme scope
    // (data-wb-token-modes) forcing the opposite mode would otherwise inherit
    // those frozen values and render mixed light/dark.
    ...renderCssDeclarationBlock(':root,\n[data-wb-token-modes]', rootDeclarations),
  ];

  if (darkDeclarations.size > 0) {
    lines.push(...renderCssDeclarationBlock('.dark', darkDeclarations));
  }
  lines.push(...buildTailwindThemeOverrideModeCssBlocks(registry));

  return lines.join('\n');
}

function buildTailwindThemeOverrideModeCssBlocks(registry: TokenRegistry): string[] {
  const blocks: string[] = [];
  for (const collection of registry.collections) {
    if (collection.modes.length <= 1) continue;
    for (const mode of collection.modes) {
      const declarations = isTailwindThemeCollection(collection)
        ? collectTailwindThemeDeclarations(registry, mode.id)
        : collectSingleCollectionTokenDeclarations(registry, collection, mode.id);
      if (declarations.size > 0) blocks.push(...renderCssDeclarationBlock(getCollectionModeSelector(collection, mode.id), declarations));
    }
  }
  return blocks;
}

function collectSingleCollectionTokenDeclarations(
  registry: TokenRegistry,
  collection: TokenCollection,
  modeId: string,
): Map<string, string> {
  const declarations = new Map<string, string>();
  for (const token of collection.tokens) {
    const cssValue = getTokenCssExportValue(registry, collection, token, modeId, { [collection.id]: modeId });
    if (cssValue === null) continue;
    declarations.set(getProjectCollectionTokenCssVariableName(collection.id, token.id), cssValue);
  }
  return declarations;
}

function collectTailwindThemeDependencyDeclarations(registry: TokenRegistry, requestedModeId: string): Map<string, string> {
  const declarations = new Map<string, string>();
  for (const collection of registry.collections) {
    if (isTailwindThemeCollection(collection)) continue;
    const collectionMode = getEffectiveCollectionModeId(collection, requestedModeId);
    addScopedCollectionTokenDeclarations(declarations, registry, collection, collectionMode);
  }
  return declarations;
}

function mergeDeclarationMaps(...maps: Array<Map<string, string>>): Map<string, string> {
  const merged = new Map<string, string>();
  for (const map of maps) {
    for (const [name, value] of map) merged.set(name, value);
  }
  return merged;
}

function collectTailwindThemeDeclarations(registry: TokenRegistry, requestedModeId: string): Map<string, string> {
  const collections = registry.collections.filter(isTailwindThemeCollection);
  const modeByCollection: Partial<Record<string, string>> = {};
  for (const collection of registry.collections) {
    modeByCollection[collection.id] = getEffectiveCollectionModeId(collection, requestedModeId);
  }

  const declarations = new Map<string, string>();
  for (const collection of collections) {
    const collectionMode = modeByCollection[collection.id] ?? getTokenMode(collection);
    for (const token of collection.tokens) {
      const cssVariable = getTokenDirectCssVariableName(token);
      if (!cssVariable) continue;

      const cssValue = getTokenCssExportValue(registry, collection, token, collectionMode, modeByCollection);
      if (cssValue === null) continue;
      declarations.set(cssVariable, cssValue);
    }
  }

  return declarations;
}

function isTailwindThemeCollection(collection: TokenCollection): boolean {
  const source = collection.extensions?.source;
  const tailwind = isRecord(collection.extensions?.tailwind) ? collection.extensions.tailwind : null;
  return source === 'tailwind' || tailwind?.kind === 'theme-variables';
}

function getTokenDirectCssVariableName(token: DesignToken): string | null {
  const direct = token.extensions?.cssVariable;
  const tailwind = isRecord(token.extensions?.tailwind) ? token.extensions.tailwind : null;
  const value = typeof direct === 'string'
    ? direct
    : typeof tailwind?.cssVariable === 'string'
      ? tailwind.cssVariable
      : null;
  if (!value || !/^--[a-zA-Z0-9_-]+$/.test(value)) return null;
  return value;
}

function getTailwindModeId(registry: TokenRegistry, fallback: string): string {
  const tailwind = isRecord(registry.extensions.tailwind) ? registry.extensions.tailwind : null;
  const configured = fallback === 'dark' ? tailwind?.darkModeId : tailwind?.lightModeId;
  return typeof configured === 'string' && configured.trim() ? configured : fallback;
}

function getEffectiveCollectionModeId(collection: TokenCollection, requestedModeId: string): string {
  const exact = collection.modes.find((mode) => mode.id === requestedModeId);
  if (exact) return exact.id;

  const normalized = normalizeCssModeName(requestedModeId);
  const named = collection.modes.find((mode) => normalizeCssModeName(mode.name) === normalized);
  return named?.id ?? getTokenMode(collection);
}

function buildWorkbenchModeTokenCssBlocks(registry: TokenRegistry): string[] {
  const blocks: string[] = [];
  const themeModeIds = getThemeModeIds(registry);

  for (const modeId of themeModeIds) {
    const declarations = new Map<string, string>();
    for (const collection of registry.collections) {
      if (!shouldEmitGlobalThemeModeSelector(collection)) continue;
      const mode = collection.modes.find((candidate) => getThemeModeKeys(candidate).includes(modeId));
      if (!mode) continue;
      addScopedCollectionTokenDeclarations(declarations, registry, collection, mode.id);
    }
    if (declarations.size > 0) blocks.push(...renderCssDeclarationBlock(getThemeModeSelector(modeId), declarations));
  }

  for (const collection of registry.collections) {
    for (const mode of collection.modes) {
      const declarations = new Map<string, string>();
      addScopedCollectionTokenDeclarations(declarations, registry, collection, mode.id);
      if (declarations.size > 0) blocks.push(...renderCssDeclarationBlock(getCollectionModeSelector(collection, mode.id), declarations));
    }
  }

  return blocks;
}

function addScopedCollectionTokenDeclarations(
  declarations: Map<string, string>,
  registry: TokenRegistry,
  collection: TokenCollection,
  modeId: string,
): void {
  const modeByCollection = { [collection.id]: modeId };
  for (const token of collection.tokens) {
    const cssValue = getTokenCssExportValue(registry, collection, token, modeId, modeByCollection);
    if (cssValue === null) continue;

    declarations.set(
      getProjectCollectionTokenCssVariableName(collection.id, token.id),
      cssValue,
    );
    for (const namespace of getScopedCssVariableNamespaces(registry, collection, token)) {
      declarations.set(getProjectTokenCssVariableName(namespace, token.id), cssValue);
      for (const alias of getTokenCssExportAliases(token)) {
        const aliasName = getProjectTokenCssVariableName(namespace, alias);
        if (!declarations.has(aliasName)) declarations.set(aliasName, cssValue);
      }
    }
  }
}

function setTokenBucketValue(bucket: Record<string, string>, token: DesignToken, cssValue: string): void {
  bucket[token.id] = cssValue;
  for (const alias of getTokenCssExportAliases(token)) {
    bucket[alias] ??= cssValue;
  }
}

function getTokenCssExportAliases(token: DesignToken): string[] {
  const name = token.name.trim();
  if (!name || name === token.id) return [];
  return [name];
}

function getTokenCssExportValue(
  registry: TokenRegistry,
  collection: TokenCollection,
  token: DesignToken,
  modeId: string,
  modeByCollection?: Partial<Record<string, string>>,
): string | null {
  const value = token.values[modeId] ?? token.values.default;
  if (value?.kind === 'ref' && shouldExportReferenceAsCssVar(collection, token, value.collectionId, modeId)) {
    return `var(${getProjectCollectionTokenCssVariableName(value.collectionId, value.tokenId)})`;
  }

  const resolved = resolveTokenValue(token, collection, registry, modeId, modeByCollection);
  if (resolved === null || resolved === '') return null;
  return getTokenCssValue(registry, modeId, token.type, resolved);
}

function shouldExportReferenceAsCssVar(
  collection: TokenCollection,
  token: DesignToken,
  refCollectionId: string,
  modeId: string,
): boolean {
  if (isTailwindThemeCollection(collection) && getTokenDirectCssVariableName(token) && refCollectionId !== collection.id) return true;

  const defaultModeId = collection.modes[0]?.id ?? 'default';
  return collection.modes.length <= 1 || modeId === defaultModeId;
}

function renderCssDeclarationBlock(selector: string, declarations: Map<string, string>): string[] {
  const lines = [selector, '{'];
  for (const [name, value] of [...declarations.entries()].sort(([left], [right]) => left.localeCompare(right))) {
    lines.push(`  ${name}: ${value};`);
  }
  lines.push('}', '');
  return lines;
}

function getScopedCssVariableNamespaces(
  registry: TokenRegistry,
  collection: TokenCollection,
  token: DesignToken,
): string[] {
  const namespaces = new Set<string>();
  for (const [field, scopes] of Object.entries(getTokenFieldScopes(registry)) as Array<[InspectorField, TokenFieldScope[] | undefined]>) {
    const namespace = getCssVarNamespace(field);
    if (!namespace) continue;

    const fieldScopes = scopes ?? [];
    const collectionScopes = fieldScopes.filter((scope) => scope.collectionId === collection.id);
    if (collectionScopes.length === 0) continue;

    const hasGroupScopes = fieldScopes.some((scope) => scope.collectionId === collection.id && scope.groupId);
    for (const scope of collectionScopes) {
      if (!scope.groupId && hasGroupScopes && token.groupId) continue;
      if (scope.groupId && token.groupId !== scope.groupId) continue;
      if (validateTokenForField(token, field) !== null) continue;
      namespaces.add(namespace);
    }
  }
  return [...namespaces];
}

function getThemeModeIds(registry: TokenRegistry): string[] {
  const ids = new Set<string>();
  for (const collection of registry.collections) {
    if (!shouldEmitGlobalThemeModeSelector(collection)) continue;
    for (const mode of collection.modes) {
      for (const key of getThemeModeKeys(mode)) ids.add(key);
    }
  }
  return [...ids].sort();
}

function getThemeModeKeys(mode: { id: string; name: string }): string[] {
  return Array.from(new Set([
    normalizeCssModeName(mode.id),
    normalizeCssModeName(mode.name),
  ].filter(Boolean)));
}

function normalizeCssModeName(value: string): string {
  return value.trim().toLowerCase();
}

function getThemeModeSelector(modeId: string): string {
  return `[data-theme="${escapeCssAttributeValue(modeId)}"]`;
}

function getCollectionModeSelector(collection: TokenCollection, modeId: string): string {
  const selectors = [
    ...getCollectionCustomModeSelectors(collection, modeId),
    getTokenModeSelector(collection.id, modeId),
  ];
  return selectors.join(',\n');
}

function getCollectionCustomModeSelectors(collection: TokenCollection, modeId: string): string[] {
  const cssExport = isRecord(collection.extensions?.cssExport) ? collection.extensions.cssExport : null;
  const attribute = typeof cssExport?.modeSelectorAttribute === 'string' ? cssExport.modeSelectorAttribute : null;

  if (attribute && /^data-[a-zA-Z0-9_-]+$/.test(attribute)) {
    return [`[${attribute}="${escapeCssAttributeValue(modeId)}"]`];
  }

  if (isAstryxThemeCollection(collection)) {
    return [`[data-astryx-theme="${escapeCssAttributeValue(modeId)}"]`];
  }

  return [];
}

function shouldEmitGlobalThemeModeSelector(collection: TokenCollection): boolean {
  const cssExport = isRecord(collection.extensions?.cssExport) ? collection.extensions.cssExport : null;
  if (cssExport?.globalThemeSelector === false) return false;
  return !isAstryxThemeCollection(collection);
}

function isAstryxThemeCollection(collection: TokenCollection): boolean {
  const astryx = isRecord(collection.extensions?.astryx) ? collection.extensions.astryx : null;
  return collection.extensions?.source === 'astryx' && astryx?.kind === 'theme-overrides';
}

function getTokenModeSelector(collectionId: string, modeId: string): string {
  const pair = `${collectionId}=${modeId}`;
  const escapedPair = escapeCssAttributeValue(pair);
  return [
    `[data-wb-token-modes="${escapedPair}"]`,
    `[data-wb-token-modes^="${escapedPair};"]`,
    `[data-wb-token-modes$=";${escapedPair}"]`,
    `[data-wb-token-modes*=";${escapedPair};"]`,
  ].join(',\n');
}

function escapeCssAttributeValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function getTokenCssValue(
  registry: TokenRegistry,
  modeId: string,
  tokenType: TokenType,
  resolved: NonNullable<ReturnType<typeof resolveTokenValue>>,
): string | null {
  if (tokenType === 'color' && typeof resolved === 'string') return resolved;
  if (tokenType === 'gradient') return gradientPreviewCss(resolved, registry, modeId);
  if (tokenType === 'dimension' && isDimensionValue(resolved)) return serializeTokenRawValue(resolved);
  if (tokenType === 'duration' && isDurationValue(resolved)) return serializeTokenRawValue(resolved);
  if (tokenType === 'angle' && isAngleValue(resolved)) return serializeTokenRawValue(resolved);
  if (tokenType === 'opacity' && isOpacityValue(resolved)) return serializeTokenRawValue(resolved);
  if (tokenType === 'number' && typeof resolved === 'number') return String(resolved);
  if (tokenType === 'string' && typeof resolved === 'string') return resolved;
  return null;
}

const CSS_BUCKET_NAMESPACES: Array<[keyof TailwindTokenBuckets, string]> = [
  ['colors', 'color'],
  ['spacing', 'spacing'],
  ['borderRadius', 'borderRadius'],
  ['fontSize', 'fontSize'],
  ['fontWeight', 'fontWeight'],
  ['lineHeight', 'lineHeight'],
  ['letterSpacing', 'letterSpacing'],
  ['borderWidth', 'borderWidth'],
  ['opacity', 'opacity'],
];

function sanitizeCssVariableSegment(value: string): string {
  const sanitized = value.trim().replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
  return sanitized || 'token';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
