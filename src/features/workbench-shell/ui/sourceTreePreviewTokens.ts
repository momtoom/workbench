import type { CSSProperties } from 'react';
import { gradientPreviewCss } from '@domain/design-system/tokens/gradient';
import {
  getProjectCollectionTokenCssVariableName,
  getProjectTokenCssVariableName,
} from '@domain/design-system/tokens/cssExport';
import { getTokenMode, resolveTokenValue } from '@domain/design-system/tokens/resolver';
import {
  isAngleValue,
  isDimensionValue,
  isDurationValue,
  isGradientValue,
  isOpacityValue,
  serializeTokenRawValue,
  type CssVarNamespace,
  type TokenCollection,
  type TokenRegistry,
  type TokenType,
} from '@domain/design-system/tokens/types';
import type { PreviewTokenModeSelection } from './DesignInspectorTypes';

const SOURCE_TREE_PREVIEW_TOKEN_NAMESPACES: Array<{
  namespace: CssVarNamespace;
  allowedTypes: TokenType[];
}> = [
  { namespace: 'color', allowedTypes: ['color', 'gradient', 'string'] },
  { namespace: 'spacing', allowedTypes: ['dimension'] },
  { namespace: 'borderRadius', allowedTypes: ['dimension'] },
  { namespace: 'fontSize', allowedTypes: ['dimension'] },
  { namespace: 'fontWeight', allowedTypes: ['number', 'string'] },
  { namespace: 'lineHeight', allowedTypes: ['dimension'] },
  { namespace: 'letterSpacing', allowedTypes: ['dimension'] },
  { namespace: 'borderWidth', allowedTypes: ['dimension'] },
  { namespace: 'opacity', allowedTypes: ['opacity'] },
];

export function getSourceTreePreviewTokenVariables(
  registry: TokenRegistry,
  previewTokenModes: PreviewTokenModeSelection,
): CSSProperties | undefined {
  const variables: Record<string, string> = {};

  for (const collection of registry.collections) {
    const modeId = previewTokenModes[collection.id] ?? getTokenMode(collection);
    for (const token of collection.tokens) {
      const resolved = resolveTokenValue(token, collection, registry, modeId, previewTokenModes);
      const css = getSourceTreePreviewTokenCssValue(token.type, resolved, registry, modeId);
      if (!css) continue;

      const directCssVariable = getSourceTreePreviewDirectTokenCssVariableName(token.extensions);
      if (directCssVariable) variables[directCssVariable] = css;
      const tailwindColorVariable = getSourceTreePreviewTailwindColorVariableName(collection, token.id, token.type);
      if (tailwindColorVariable) variables[tailwindColorVariable] = css;
      variables[getProjectCollectionTokenCssVariableName(collection.id, token.id)] = css;
      for (const { allowedTypes, namespace } of SOURCE_TREE_PREVIEW_TOKEN_NAMESPACES) {
        if (allowedTypes.includes(token.type)) variables[getProjectTokenCssVariableName(namespace, token.id)] = css;
      }
    }
  }

  return Object.keys(variables).length > 0 ? variables as CSSProperties : undefined;
}

function getSourceTreePreviewTailwindColorVariableName(
  collection: TokenCollection,
  tokenId: string,
  tokenType: TokenType,
): string | null {
  if (collection.id !== 'tailwind-primitives' || tokenType !== 'color') return null;
  return /^[a-zA-Z0-9][a-zA-Z0-9-]*$/.test(tokenId) ? `--color-${tokenId}` : null;
}

function getSourceTreePreviewDirectTokenCssVariableName(
  extensions: Record<string, unknown> | undefined,
): string | null {
  const tailwind = isRecord(extensions?.tailwind) ? extensions.tailwind : null;
  const value = typeof extensions?.cssVariable === 'string'
    ? extensions.cssVariable
    : typeof tailwind?.cssVariable === 'string'
      ? tailwind.cssVariable
      : null;
  return value && /^--[a-zA-Z0-9_-]+$/.test(value) ? value : null;
}

export function getSourceTreePreviewThemeMode(
  registry: TokenRegistry,
  previewTokenModes: PreviewTokenModeSelection,
): 'dark' | undefined {
  for (const collection of registry.collections) {
    if (!isThemeTokenCollection(collection)) continue;
    const selectedModeId = previewTokenModes[collection.id];
    if (!selectedModeId) continue;
    const mode = collection.modes.find((candidate) => candidate.id === selectedModeId);
    if (!mode || !isDarkModeIdOrName(mode.id, mode.name)) continue;
    return 'dark';
  }

  return undefined;
}

function getSourceTreePreviewTokenCssValue(
  tokenType: TokenType,
  resolved: ReturnType<typeof resolveTokenValue>,
  registry: TokenRegistry,
  modeId: string,
): string | null {
  if (resolved === null || resolved === '') return null;
  if (tokenType === 'color' && typeof resolved === 'string') return resolved;
  if (tokenType === 'gradient' || isGradientValue(resolved)) return gradientPreviewCss(resolved, registry, modeId);
  if (isDimensionValue(resolved) || isDurationValue(resolved) || isAngleValue(resolved) || isOpacityValue(resolved)) return serializeTokenRawValue(resolved);
  if (tokenType === 'number' && typeof resolved === 'number') return String(resolved);
  if (tokenType === 'string' && typeof resolved === 'string') return resolved;
  return null;
}

function isThemeTokenCollection(collection: TokenCollection): boolean {
  return collection.tokens.some((token) => token.type === 'color' || token.type === 'gradient');
}

function isDarkModeIdOrName(id: string, name: string): boolean {
  return normalizeThemeModeLabel(id) === 'dark' || normalizeThemeModeLabel(name) === 'dark';
}

function normalizeThemeModeLabel(value: string): string {
  return value.trim().toLowerCase();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
