import type { TokenRegistry } from '@domain/design-system/tokens/types';
import { getTokenMode, resolveTokenValue } from '@domain/design-system/tokens/resolver';
import { isCollectionI18n } from '@domain/design-system/tokens/operations';
import type { PreviewTokenModeSelection } from './DesignInspectorTypes';

export type SourceTreePreviewI18nMap = Readonly<Record<string, string>>;

/* Build the flat key → resolved-string map used by the workbench to render
 * `{t('id')}` placeholders that live in page TSX. Only collections marked as
 * i18n (via collection.extensions.i18n) contribute. */
export function getSourceTreePreviewI18nTokens(
  registry: TokenRegistry,
  previewTokenModes: PreviewTokenModeSelection,
): SourceTreePreviewI18nMap {
  const tokens: Record<string, string> = {};

  for (const collection of registry.collections) {
    if (!isCollectionI18n(collection)) continue;
    const modeId = previewTokenModes[collection.id] ?? getTokenMode(collection);
    const collectionName = collection.name?.trim() || collection.id;
    for (const token of collection.tokens) {
      if (token.type !== 'string') continue;
      const resolved = resolveTokenValue(token, collection, registry, modeId);
      if (typeof resolved !== 'string') continue;
      const tokenName = token.name?.trim() || token.id;
      tokens[`${collectionName}.${tokenName}`] = resolved;
      // Bare-name alias for convenience (last write wins on collision).
      tokens[tokenName] = resolved;
    }
  }

  return tokens;
}
