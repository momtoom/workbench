import type { CSSProperties, ReactNode } from 'react';
import { gradientPreviewCss } from '@domain/design-system/tokens/gradient';
import { resolveTokenValue } from '@domain/design-system/tokens/resolver';
import {
  isDimensionValue,
  serializeTokenRawValue,
  type DesignToken,
  type ResolvedTokenValue,
  type TokenCollection,
  type TokenGroup,
  type TokenRegistry,
} from '@domain/design-system/tokens/types';
import type { PreviewTokenModeSelection } from '../features/workbench-shell/ui/DesignInspectorTypes';

export type WorkbenchFoundationPreviewId = 'colors' | 'typography' | 'sizing' | 'rounding' | 'elevation' | 'surface';

export type WorkbenchFoundationPreviewContext = {
  previewTokenModes: PreviewTokenModeSelection;
  settings?: WorkbenchFoundationPreviewSettings;
  tokenRegistry: TokenRegistry;
};

export type ColorFoundationSettings = {
  collectionId?: string;
};

export type TypographyFoundationSettings = {
  sizeSourceId?: string;
  weightSourceId?: string;
};

export type WorkbenchFoundationPreviewSettings = {
  colors?: ColorFoundationSettings;
  typography?: TypographyFoundationSettings;
};

export type WorkbenchFoundationCollectionOption = {
  id: string;
  label: string;
  tokenCount: number;
};

export type WorkbenchFoundationTokenSourceOption = {
  collectionId: string;
  collectionName: string;
  groupId?: string;
  groupName: string;
  id: string;
  label: string;
  tokenCount: number;
};

export type WorkbenchFoundationPreview = {
  description: string;
  id: WorkbenchFoundationPreviewId;
  name: string;
  render: (context: WorkbenchFoundationPreviewContext) => ReactNode;
};

const previews: WorkbenchFoundationPreview[] = [
  {
    id: 'colors',
    name: 'Colors',
    description: 'Map a selected token collection into group rows with token names and swatches.',
    render: (context) => <ColorFoundationPreview {...context} />,
  },
  {
    id: 'typography',
    name: 'Typography',
    description: 'Map selected token groups into a live type specimen.',
    render: (context) => <TypographyFoundationPreview {...context} />,
  },
  {
    id: 'sizing',
    name: 'Sizing',
    description: 'Dimension tokens for layout scale and component spacing.',
    render: (context) => <SizingFoundationPreview {...context} />,
  },
  {
    id: 'rounding',
    name: 'Rounding',
    description: 'Radius tokens for controls, cards, and panels.',
    render: (context) => <RoundingFoundationPreview {...context} />,
  },
  {
    id: 'elevation',
    name: 'Elevation',
    description: 'Shadow and depth tokens for layered UI surfaces.',
    render: (context) => <ElevationFoundationPreview {...context} />,
  },
  {
    id: 'surface',
    name: 'Surface',
    description: 'Surface tokens for backgrounds, panels, and feature treatments.',
    render: (context) => <SurfaceFoundationPreview {...context} />,
  },
];

type FoundationTokenPreview = {
  blur?: string;
  cssValue: string;
  previewText: string;
  shadow?: string;
  token: DesignToken;
};

type FoundationTokenGroup = {
  id: string;
  title: string;
  tokens: FoundationTokenPreview[];
};

export function getWorkbenchFoundationPreviews(): WorkbenchFoundationPreview[] {
  return previews;
}

export function getWorkbenchFoundationPreview(id: string): WorkbenchFoundationPreview | null {
  return previews.find((preview) => preview.id === id) ?? null;
}

export function getFoundationCollectionOptions(registry: TokenRegistry): WorkbenchFoundationCollectionOption[] {
  return registry.collections.map((collection) => ({
    id: collection.id,
    label: collection.name,
    tokenCount: collection.tokens.length,
  }));
}

export function getResolvedColorFoundationSettings(
  registry: TokenRegistry,
  settings?: ColorFoundationSettings,
): Required<ColorFoundationSettings> {
  const collectionId = getValidCollectionId(registry, settings?.collectionId)
    ?? registry.collections.find((collection) => matchesAny([collection.id, collection.name].join(' ').toLowerCase(), ['color', 'colors']))?.id
    ?? registry.collections[0]?.id
    ?? '';
  return { collectionId };
}

const TOKEN_SOURCE_SEPARATOR = '::group::';

export function createFoundationTokenSourceId(collectionId: string, groupId?: string): string {
  return `${collectionId}${TOKEN_SOURCE_SEPARATOR}${groupId ?? ''}`;
}

export function getFoundationTokenSourceOptions(registry: TokenRegistry): WorkbenchFoundationTokenSourceOption[] {
  return registry.collections.flatMap((collection) => {
    const groupedOptions = collection.groups.map((group) => ({
      collectionId: collection.id,
      collectionName: collection.name,
      groupId: group.id,
      groupName: group.name,
      id: createFoundationTokenSourceId(collection.id, group.id),
      label: `${collection.name} / ${group.name}`,
      tokenCount: collection.tokens.filter((token) => token.groupId === group.id).length,
    }));
    const ungroupedCount = collection.tokens.filter((token) => !token.groupId).length;
    const ungroupedOptions = ungroupedCount > 0 || collection.groups.length === 0
      ? [{
        collectionId: collection.id,
        collectionName: collection.name,
        groupName: 'Ungrouped',
        id: createFoundationTokenSourceId(collection.id),
        label: `${collection.name} / Ungrouped`,
        tokenCount: ungroupedCount,
      }]
      : [];
    return [...groupedOptions, ...ungroupedOptions];
  });
}

export function getResolvedTypographyFoundationSettings(
  registry: TokenRegistry,
  settings?: TypographyFoundationSettings,
): Required<TypographyFoundationSettings> {
  const options = getFoundationTokenSourceOptions(registry);
  const sizeSourceId = getValidSourceId(options, settings?.sizeSourceId)
    ?? findFallbackTokenSource(options, ['font-size', 'font size', 'text-size', 'type-size'])?.id
    ?? options[0]?.id
    ?? '';
  const weightSourceId = getValidSourceId(options, settings?.weightSourceId)
    ?? findFallbackTokenSource(options, ['font-weight', 'font weight', 'type-weight', 'weight'])?.id
    ?? options[0]?.id
    ?? '';
  return { sizeSourceId, weightSourceId };
}

function ColorFoundationPreview({
  previewTokenModes,
  settings,
  tokenRegistry,
}: WorkbenchFoundationPreviewContext) {
  const colorSettings = getResolvedColorFoundationSettings(tokenRegistry, settings?.colors);
  const rows = getColorCollectionRows(tokenRegistry, previewTokenModes, colorSettings.collectionId);

  return (
    <section className="wb-foundation-preview wb-foundation-preview--colors" aria-label="Color foundation">
      {rows.length === 0 ? (
        <p className="wb-foundation-empty">No tokens in the selected collection.</p>
      ) : (
        <div className="wb-foundation-color-matrix" role="table" aria-label="Color collection preview">
          {rows.map((row) => (
            <div key={row.id} className="wb-foundation-color-group-row" role="row">
              <div className="wb-foundation-color-group-name" role="cell">
                <strong>{row.title}</strong>
                <span>{row.tokens.length}</span>
              </div>
              <div className="wb-foundation-color-token-list" role="cell">
                {row.tokens.map((item) => (
                  <span
                    key={item.token.id}
                    aria-label={`${item.token.name}: ${item.previewText}`}
                    className="wb-foundation-color-token"
                    data-wb-token={item.token.name}
                    role="group"
                    title={`${item.token.name}: ${item.previewText}`}
                  >
                    <span
                      aria-hidden="true"
                      className="wb-foundation-color-chip"
                      style={{ '--wb-foundation-color': item.cssValue } as CSSProperties}
                    />
                    <span className="wb-foundation-color-token-name">{item.token.name}</span>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function TypographyFoundationPreview({
  previewTokenModes,
  settings,
  tokenRegistry,
}: WorkbenchFoundationPreviewContext) {
  const typographySettings = getResolvedTypographyFoundationSettings(tokenRegistry, settings?.typography);
  const rows = getTokenSourceItems(tokenRegistry, previewTokenModes, typographySettings.sizeSourceId, getResolvedCssLiteral);
  const weights = getTokenSourceItems(tokenRegistry, previewTokenModes, typographySettings.weightSourceId, getResolvedCssLiteral);
  const matrixStyle = getTypographyMatrixStyle(weights.length);

  return (
    <section className="wb-foundation-preview wb-foundation-preview--typography" aria-label="Typography foundation">
      {rows.length === 0 ? (
        <p className="wb-foundation-empty">No tokens in the selected size group.</p>
      ) : weights.length === 0 ? (
        <p className="wb-foundation-empty">No tokens in the selected weight group.</p>
      ) : (
        <div className="wb-foundation-type-matrix" role="table" aria-label="Typography size and weight preview">
          <div className="wb-foundation-type-header" role="row" style={matrixStyle}>
            <span>Token</span>
            {weights.map((weight) => (
              <span key={weight.token.id}>{weight.token.name}</span>
            ))}
          </div>
          {rows.map((item) => (
            <div
              key={item.token.id}
              className="wb-foundation-type-row"
              data-wb-token={item.token.name}
              role="row"
              style={{
                ...matrixStyle,
                '--wb-foundation-type-size': item.cssValue,
              } as CSSProperties}
            >
              <div className="wb-foundation-type-meta" role="cell">
                <strong>{item.token.name}</strong>
                <span>{item.previewText}</span>
              </div>
              {weights.map((weight) => (
                <p
                  key={weight.token.id}
                  role="cell"
                  style={{ '--wb-foundation-type-weight': weight.cssValue } as CSSProperties}
                >
                  Aa
                </p>
              ))}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function SizingFoundationPreview({
  previewTokenModes,
  tokenRegistry,
}: WorkbenchFoundationPreviewContext) {
  const groups = getFoundationTokenGroups(tokenRegistry, previewTokenModes, ({ collection, group, token }) => (
    token.type === 'dimension' &&
    !isTypographyToken(collection, group, token) &&
    !isRadiusToken(collection, group, token)
  ), getResolvedSizeCss);

  return (
    <section className="wb-foundation-preview wb-foundation-preview--sizing" aria-label="Sizing foundation">
      {groups.length === 0 ? (
        <p className="wb-foundation-empty">No semantic size tokens.</p>
      ) : groups.map((group) => (
        <section key={group.id} className="wb-foundation-group" aria-label={`${group.title} sizes`}>
          <h2>{group.title}</h2>
          <div className="wb-foundation-table wb-foundation-table--sizing" role="table" aria-label={`${group.title} size tokens`}>
            <div className="wb-foundation-table-header wb-foundation-size-table-row" role="row">
              <span>Token</span>
              <span>Preview</span>
            </div>
            {group.tokens.map((item) => (
              <div
                key={item.token.id}
                className="wb-foundation-table-row wb-foundation-size-table-row"
                data-wb-token={item.token.name}
                role="row"
                style={{ '--wb-foundation-size': item.cssValue } as CSSProperties}
              >
                <div className="wb-foundation-table-cell wb-foundation-token-cell" role="cell">
                  <strong>{item.token.name}</strong>
                  <span>{item.previewText}</span>
                </div>
                <div className="wb-foundation-table-cell wb-foundation-preview-cell" role="cell">
                  <div className="wb-foundation-size-bar" aria-hidden="true" />
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </section>
  );
}

function RoundingFoundationPreview({
  previewTokenModes,
  tokenRegistry,
}: WorkbenchFoundationPreviewContext) {
  const tokens = getRoundingTokens(tokenRegistry, previewTokenModes);

  return (
    <section className="wb-foundation-preview wb-foundation-preview--rounding" aria-label="Rounding foundation">
      {tokens.length === 0 ? (
        <p className="wb-foundation-empty">No rounding tokens.</p>
      ) : (
        <div className="wb-foundation-table wb-foundation-table--rounding" role="table" aria-label="Rounding tokens">
          <div className="wb-foundation-table-header wb-foundation-radius-row" role="row">
            <span>Token</span>
            <span>Preview</span>
          </div>
          {tokens.map((item) => (
            <div
              key={item.token.id}
              className="wb-foundation-table-row wb-foundation-radius-row"
              data-wb-token={item.token.name}
              role="row"
              style={{ '--wb-foundation-radius': item.cssValue } as CSSProperties}
            >
              <div className="wb-foundation-table-cell wb-foundation-token-cell" role="cell">
                <strong>{item.token.name}</strong>
                <span>{item.previewText}</span>
              </div>
              <div className="wb-foundation-table-cell wb-foundation-preview-cell" role="cell">
                <div className="wb-foundation-radius-sample" aria-hidden="true" />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function ElevationFoundationPreview({
  previewTokenModes,
  tokenRegistry,
}: WorkbenchFoundationPreviewContext) {
  const tokens = getElevationTokens(tokenRegistry, previewTokenModes);

  return (
    <section className="wb-foundation-preview wb-foundation-preview--elevation" aria-label="Elevation foundation">
      {tokens.length === 0 ? (
        <p className="wb-foundation-empty">No elevation tokens.</p>
      ) : (
        <div className="wb-foundation-table wb-foundation-table--elevation" role="table" aria-label="Elevation tokens">
          <div className="wb-foundation-table-header wb-foundation-elevation-row" role="row">
            <span>Token</span>
            <span>Preview</span>
          </div>
          {tokens.map((item) => (
            <div
              key={item.token.id}
              className="wb-foundation-table-row wb-foundation-elevation-row"
              data-wb-token={item.token.name}
              role="row"
              style={{ '--wb-foundation-shadow': item.cssValue } as CSSProperties}
            >
              <div className="wb-foundation-table-cell wb-foundation-token-cell" role="cell">
                <strong>{item.token.name}</strong>
                <span>{item.previewText}</span>
              </div>
              <div className="wb-foundation-table-cell wb-foundation-preview-cell" role="cell">
                <div className="wb-foundation-elevation-sample" aria-hidden="true" />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function SurfaceFoundationPreview({
  previewTokenModes,
  tokenRegistry,
}: WorkbenchFoundationPreviewContext) {
  const tokens = getSurfaceTokens(tokenRegistry, previewTokenModes);

  return (
    <section className="wb-foundation-preview wb-foundation-preview--surface" aria-label="Surface foundation">
      {tokens.length === 0 ? (
        <p className="wb-foundation-empty">No surface tokens.</p>
      ) : (
        <div className="wb-foundation-table wb-foundation-table--surface" role="table" aria-label="Surface tokens">
          <div className="wb-foundation-table-header wb-foundation-surface-row" role="row">
            <span>Token</span>
            <span>Preview</span>
          </div>
          {tokens.map((item) => (
            <div
              key={item.token.id}
              className="wb-foundation-table-row wb-foundation-surface-row"
              data-wb-token={item.token.name}
              role="row"
              style={{
                '--wb-foundation-surface-bg': item.cssValue,
                '--wb-foundation-surface-blur': item.blur,
                '--wb-foundation-surface-shadow': item.shadow,
              } as CSSProperties}
            >
              <div className="wb-foundation-table-cell wb-foundation-token-cell" role="cell">
                <strong>{item.token.name}</strong>
                <span>{item.previewText}</span>
              </div>
              <div className="wb-foundation-table-cell wb-foundation-preview-cell" role="cell">
                <div className="wb-foundation-surface-sample" aria-hidden="true" />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function getRoundingTokens(
  registry: TokenRegistry,
  previewTokenModes: PreviewTokenModeSelection,
): FoundationTokenPreview[] {
  return getFoundationTokenItems(registry, previewTokenModes, ({ collection, group, token }) => (
    token.type === 'dimension' && isRadiusToken(collection, group, token)
  ), getResolvedSizeCss);
}

function getElevationTokens(
  registry: TokenRegistry,
  previewTokenModes: PreviewTokenModeSelection,
): FoundationTokenPreview[] {
  return getFoundationTokenItems(registry, previewTokenModes, ({ collection, group, token }) => (
    ['string', 'gradient'].includes(token.type) && isElevationToken(collection, group, token)
  ), getResolvedShadowCss);
}

function getSurfaceTokens(
  registry: TokenRegistry,
  previewTokenModes: PreviewTokenModeSelection,
): FoundationTokenPreview[] {
  return getFoundationTokenItems(registry, previewTokenModes, ({ collection, group, token }) => (
    ['color', 'string', 'gradient'].includes(token.type) && isSurfaceToken(collection, group, token)
  ), getResolvedSurfaceCss).map((item) => ({
    ...item,
    blur: tokenSearchText(null, null, item.token).includes('glass') ? '16px' : '0px',
    shadow: '0 12px 32px rgba(46,37,25,0.12)',
  }));
}

function getFoundationTokenGroups(
  registry: TokenRegistry,
  previewTokenModes: PreviewTokenModeSelection,
  predicate: (input: { collection: TokenCollection; group: TokenGroup | null; token: DesignToken }) => boolean,
  resolveCssValue: (value: ResolvedTokenValue, registry: TokenRegistry, modeId: string) => string,
): FoundationTokenGroup[] {
  const groups = new Map<string, FoundationTokenGroup>();
  registry.collections.forEach((collection) => {
    const modeId = getPreviewModeId(collection, previewTokenModes);
    getCollectionTokens(collection, predicate).forEach(({ group, token }) => {
      const groupId = `${collection.id}:${group?.id ?? 'ungrouped'}`;
      const title = group ? `${collection.name} / ${group.name}` : collection.name;
      const resolved = resolveTokenValue(token, collection, registry, modeId, previewTokenModes);
      const current = groups.get(groupId) ?? { id: groupId, title, tokens: [] };
      groups.set(groupId, {
        ...current,
        tokens: [
          ...current.tokens,
          {
            token,
            cssValue: resolveCssValue(resolved, registry, modeId),
            previewText: stringifyFoundationValue(resolved),
          },
        ],
      });
    });
  });
  return [...groups.values()].filter((group) => group.tokens.length > 0);
}

function getColorCollectionRows(
  registry: TokenRegistry,
  previewTokenModes: PreviewTokenModeSelection,
  collectionId: string,
): FoundationTokenGroup[] {
  const collection = registry.collections.find((candidate) => candidate.id === collectionId);
  if (!collection) return [];
  const modeId = getPreviewModeId(collection, previewTokenModes);
  const groupedRows = collection.groups.map((group) => ({
    id: `${collection.id}:${group.id}`,
    title: group.name,
    tokens: collection.tokens
      .filter((token) => token.groupId === group.id)
      .sort(compareTokens)
      .map((token) => {
        const resolved = resolveTokenValue(token, collection, registry, modeId, previewTokenModes);
        return {
          token,
          cssValue: getResolvedBackgroundCss(resolved, registry, modeId),
          previewText: stringifyFoundationValue(resolved),
        };
      }),
  })).filter((row) => row.tokens.length > 0);

  return groupedRows;
}

function getTokenSourceItems(
  registry: TokenRegistry,
  previewTokenModes: PreviewTokenModeSelection,
  sourceId: string,
  resolveCssValue: (value: ResolvedTokenValue, registry: TokenRegistry, modeId: string) => string,
): FoundationTokenPreview[] {
  const source = getFoundationTokenSourceOptions(registry).find((option) => option.id === sourceId);
  const collection = source ? registry.collections.find((candidate) => candidate.id === source.collectionId) : undefined;
  if (!source || !collection) return [];
  const modeId = getPreviewModeId(collection, previewTokenModes);
  return collection.tokens
    .filter((token) => source.groupId ? token.groupId === source.groupId : !token.groupId)
    .sort(compareTokens)
    .map((token) => {
      const resolved = resolveTokenValue(token, collection, registry, modeId, previewTokenModes);
      return {
        token,
        cssValue: resolveCssValue(resolved, registry, modeId),
        previewText: stringifyFoundationValue(resolved),
      };
    });
}

function compareTokens(left: DesignToken, right: DesignToken): number {
  return left.sortOrder - right.sortOrder || left.name.localeCompare(right.name);
}

function getFoundationTokenItems(
  registry: TokenRegistry,
  previewTokenModes: PreviewTokenModeSelection,
  predicate: (input: { collection: TokenCollection; group: TokenGroup | null; token: DesignToken }) => boolean,
  resolveCssValue: (value: ResolvedTokenValue, registry: TokenRegistry, modeId: string) => string,
): FoundationTokenPreview[] {
  return registry.collections.flatMap((collection) => {
    const modeId = getPreviewModeId(collection, previewTokenModes);
    return getCollectionTokens(collection, predicate).map(({ token }) => {
      const resolved = resolveTokenValue(token, collection, registry, modeId, previewTokenModes);
      return {
        token,
        cssValue: resolveCssValue(resolved, registry, modeId),
        previewText: stringifyFoundationValue(resolved),
      };
    });
  });
}

function getCollectionTokens(
  collection: TokenCollection,
  predicate: (input: { collection: TokenCollection; group: TokenGroup | null; token: DesignToken }) => boolean,
): Array<{ group: TokenGroup | null; token: DesignToken }> {
  return collection.tokens
    .map((token) => ({
      group: token.groupId ? collection.groups.find((candidate) => candidate.id === token.groupId) ?? null : null,
      token,
    }))
    .filter(({ group, token }) => predicate({ collection, group, token }))
    .sort((left, right) => {
      const leftGroupIndex = left.group ? collection.groups.findIndex((group) => group.id === left.group?.id) : Number.MAX_SAFE_INTEGER;
      const rightGroupIndex = right.group ? collection.groups.findIndex((group) => group.id === right.group?.id) : Number.MAX_SAFE_INTEGER;
      return leftGroupIndex - rightGroupIndex || left.token.sortOrder - right.token.sortOrder || left.token.name.localeCompare(right.token.name);
    });
}

function isTypographySizeToken(collection: TokenCollection, group: TokenGroup | null, token: DesignToken): boolean {
  const text = tokenSearchText(collection, group, token);
  return matchesAny(text, ['typography', 'font-size', 'font size', 'text-size', 'type-size']);
}

function isTypographyWeightToken(collection: TokenCollection, group: TokenGroup | null, token: DesignToken): boolean {
  const text = tokenSearchText(collection, group, token);
  return matchesAny(text, ['typography', 'font-weight', 'font weight', 'type-weight', 'weight']);
}

function isTypographyToken(collection: TokenCollection, group: TokenGroup | null, token: DesignToken): boolean {
  return isTypographySizeToken(collection, group, token) || isTypographyWeightToken(collection, group, token);
}

function isRadiusToken(collection: TokenCollection, group: TokenGroup | null, token: DesignToken): boolean {
  return matchesAny(tokenSearchText(collection, group, token), ['radius', 'round', 'corner']);
}

function isElevationToken(collection: TokenCollection, group: TokenGroup | null, token: DesignToken): boolean {
  return matchesAny(tokenSearchText(collection, group, token), ['elevation', 'shadow', 'glow']);
}

function isSurfaceToken(collection: TokenCollection, group: TokenGroup | null, token: DesignToken): boolean {
  return matchesAny(tokenSearchText(collection, group, token), ['surface', 'background', 'bg', 'fill', 'glass']);
}

function findFallbackTokenSource(
  options: WorkbenchFoundationTokenSourceOption[],
  needles: string[],
): WorkbenchFoundationTokenSourceOption | undefined {
  return options.find((option) => matchesAny([
    option.collectionId,
    option.collectionName,
    option.groupId,
    option.groupName,
    option.label,
  ].filter(Boolean).join(' ').toLowerCase(), needles));
}

function getValidSourceId(options: WorkbenchFoundationTokenSourceOption[], sourceId: string | undefined): string | null {
  return sourceId && options.some((option) => option.id === sourceId) ? sourceId : null;
}

function getValidCollectionId(registry: TokenRegistry, collectionId: string | undefined): string | null {
  return collectionId && registry.collections.some((collection) => collection.id === collectionId) ? collectionId : null;
}

function getTypographyMatrixStyle(weightCount: number): CSSProperties {
  return {
    gridTemplateColumns: `minmax(136px, 176px) repeat(${Math.max(1, weightCount)}, minmax(96px, 1fr))`,
  };
}

function tokenSearchText(collection: TokenCollection | null, group: TokenGroup | null, token: DesignToken): string {
  return [
    collection?.id,
    collection?.name,
    group?.id,
    group?.name,
    token.groupId,
    token.name,
    token.description,
  ].filter(Boolean).join(' ').toLowerCase();
}

function matchesAny(text: string, needles: string[]): boolean {
  return needles.some((needle) => text.includes(needle));
}

function getPreviewModeId(collection: TokenCollection, previewTokenModes: PreviewTokenModeSelection): string {
  return previewTokenModes[collection.id] ?? collection.activeMode ?? collection.modes[0]?.id ?? 'default';
}

function getResolvedSizeCss(value: ResolvedTokenValue): string {
  return isDimensionValue(value) ? serializeTokenRawValue(value) : '1rem';
}

function getResolvedShadowCss(value: ResolvedTokenValue): string {
  return typeof value === 'string' ? value : 'none';
}

function getResolvedSurfaceCss(value: ResolvedTokenValue, registry: TokenRegistry, modeId?: string): string {
  const gradientCss = gradientPreviewCss(value, registry, modeId);
  if (gradientCss) return gradientCss;
  return typeof value === 'string' ? value : 'transparent';
}

function getResolvedBackgroundCss(value: ResolvedTokenValue, registry: TokenRegistry, modeId?: string): string {
  if (value === null) return 'transparent';
  const gradientCss = gradientPreviewCss(value, registry, modeId);
  if (gradientCss) return gradientCss;
  return serializeTokenRawValue(value);
}

function getResolvedCssLiteral(value: ResolvedTokenValue): string {
  return value === null ? 'unset' : serializeTokenRawValue(value);
}

function stringifyFoundationValue(value: ResolvedTokenValue): string {
  if (value === null) return 'Unresolved';
  return serializeTokenRawValue(value);
}
