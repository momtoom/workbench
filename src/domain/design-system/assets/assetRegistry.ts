import type {
  WorkbenchAssetRegistry,
  WorkbenchDesignAsset,
  WorkbenchDesignAssetKind,
} from '@domain/project/workbenchProject';
import { resolveWorkbenchHostAssetUrl } from '@domain/project/workbenchHostTransport';

export const DESIGN_ASSET_ACCEPT = [
  'image/*',
  'video/*',
  '.svg',
  '.webm',
  '.mp4',
  '.m4v',
  '.mov',
  '.ogv',
  '.woff',
  '.woff2',
  '.ttf',
  '.otf',
].join(',');

const FONT_EXTENSION_PATTERN = /\.(?:woff2?|ttf|otf)$/i;
const VIDEO_EXTENSION_PATTERN = /\.(?:webm|mp4|m4v|mov|ogv|ogg)$/i;
type WorkbenchFontFaceCssSnippetOptions = {
  runtime?: boolean;
};

export type WorkbenchFontDefaultSlot =
  | 'bodyAssetId'
  | 'headingAssetId'
  | 'sansAssetId'
  | 'serifAssetId'
  | 'monoAssetId';

export type WorkbenchAssetDefaults = {
  fonts: Record<WorkbenchFontDefaultSlot, string | null>;
  iconAssetId: string | null;
};

export const WORKBENCH_FONT_DEFAULT_SLOTS: Array<{
  cssVariable: string;
  label: string;
  slot: WorkbenchFontDefaultSlot;
}> = [
  { cssVariable: '--wb-font-body', label: 'Body', slot: 'bodyAssetId' },
  { cssVariable: '--wb-font-heading', label: 'Heading', slot: 'headingAssetId' },
  { cssVariable: '--wb-font-sans', label: 'Sans-serif', slot: 'sansAssetId' },
  { cssVariable: '--wb-font-serif', label: 'Serif', slot: 'serifAssetId' },
  { cssVariable: '--wb-font-mono', label: 'Mono', slot: 'monoAssetId' },
];

export type WorkbenchIconPreviewOption = {
  assetId: string;
  importName?: string;
  key: string;
  name: string;
  sourceAssetName: string;
  sourceFile?: string;
  style?: string;
  styleKey?: string;
  value: string;
};

const DEFAULT_ASSET_DEFAULTS: WorkbenchAssetDefaults = {
  fonts: {
    bodyAssetId: null,
    headingAssetId: null,
    sansAssetId: null,
    serifAssetId: null,
    monoAssetId: null,
  },
  iconAssetId: null,
};
const defaultIconPreviewOptionsCache = new WeakMap<WorkbenchAssetRegistry, WorkbenchIconPreviewOption[]>();
const defaultIconSourceMapCache = new WeakMap<WorkbenchAssetRegistry, Record<string, string>>();

export function createDesignAssetFromFile({
  file,
  kind,
  publicPath,
  filePath,
  now = new Date().toISOString(),
}: {
  file: File;
  kind?: WorkbenchDesignAssetKind;
  publicPath: string;
  filePath: string;
  now?: string;
}): WorkbenchDesignAsset {
  return {
    id: createDesignAssetId(file.name, now),
    name: stripAssetExtension(file.name),
    kind: kind ?? inferDesignAssetKind(file),
    source: {
      type: 'project-file',
      value: publicPath,
      filePath,
    },
    fileName: file.name,
    mimeType: file.type || undefined,
    size: file.size,
    tags: [],
    createdAt: now,
    updatedAt: now,
    extensions: {},
  };
}

export function createDesignAssetFromUrl({
  kind,
  name,
  url,
  now = new Date().toISOString(),
}: {
  kind: WorkbenchDesignAssetKind;
  name: string;
  url: string;
  now?: string;
}): WorkbenchDesignAsset {
  return {
    id: createDesignAssetId(name, now),
    name: name.trim(),
    kind,
    source: {
      type: 'url',
      value: url.trim(),
    },
    tags: [],
    createdAt: now,
    updatedAt: now,
    extensions: {},
  };
}

export function inferDesignAssetKindFromSource(
  value: string | undefined,
  fallback: WorkbenchDesignAssetKind = 'image',
): WorkbenchDesignAssetKind {
  const source = value?.trim().split(/[?#]/, 1)[0].toLowerCase() ?? '';
  if (!source) return fallback;
  if (source.endsWith('.svg')) return fallback;
  if (VIDEO_EXTENSION_PATTERN.test(source) || source.startsWith('data:video/')) return 'video';
  if (FONT_EXTENSION_PATTERN.test(source)) return 'font';
  return fallback;
}

export function getEffectiveDesignAssetKind(asset: WorkbenchDesignAsset): WorkbenchDesignAssetKind {
  return inferDesignAssetKindFromSource(asset.source.value || asset.fileName, asset.kind);
}

export function upsertDesignAssets(
  registry: WorkbenchAssetRegistry,
  assets: WorkbenchDesignAsset[],
): WorkbenchAssetRegistry {
  const byId = new Map(registry.assets.map((asset) => [asset.id, asset]));
  for (const asset of assets) byId.set(asset.id, asset);
  return {
    ...registry,
    assets: [...byId.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
  };
}

export function removeDesignAsset(
  registry: WorkbenchAssetRegistry,
  assetId: string,
): WorkbenchAssetRegistry {
  const defaults = getWorkbenchAssetDefaults(registry);
  const nextFontDefaults = { ...defaults.fonts };
  for (const slot of WORKBENCH_FONT_DEFAULT_SLOTS) {
    if (nextFontDefaults[slot.slot] === assetId) nextFontDefaults[slot.slot] = null;
  }
  return {
    ...registry,
    extensions: {
      ...registry.extensions,
      assetDefaults: {
        fonts: nextFontDefaults,
        iconAssetId: defaults.iconAssetId === assetId ? null : defaults.iconAssetId,
      },
    },
    assets: registry.assets.filter((asset) => asset.id !== assetId),
  };
}

export function getWorkbenchAssetDefaults(registry: WorkbenchAssetRegistry): WorkbenchAssetDefaults {
  const rawDefaults = registry.extensions.assetDefaults;
  if (!isRecord(rawDefaults)) return DEFAULT_ASSET_DEFAULTS;
  const rawFonts = isRecord(rawDefaults.fonts) ? rawDefaults.fonts : {};
  return {
    fonts: {
      bodyAssetId: getStringOrNull(rawFonts.bodyAssetId),
      headingAssetId: getStringOrNull(rawFonts.headingAssetId),
      sansAssetId: getStringOrNull(rawFonts.sansAssetId),
      serifAssetId: getStringOrNull(rawFonts.serifAssetId),
      monoAssetId: getStringOrNull(rawFonts.monoAssetId),
    },
    iconAssetId: getStringOrNull(rawDefaults.iconAssetId),
  };
}

export function setWorkbenchFontDefault(
  registry: WorkbenchAssetRegistry,
  slot: WorkbenchFontDefaultSlot,
  assetId: string | null,
): WorkbenchAssetRegistry {
  const defaults = getWorkbenchAssetDefaults(registry);
  return {
    ...registry,
    extensions: {
      ...registry.extensions,
      assetDefaults: {
        ...defaults,
        fonts: {
          ...defaults.fonts,
          [slot]: assetId,
        },
      },
    },
  };
}

export function setWorkbenchIconDefault(
  registry: WorkbenchAssetRegistry,
  assetId: string | null,
): WorkbenchAssetRegistry {
  const defaults = getWorkbenchAssetDefaults(registry);
  return {
    ...registry,
    extensions: {
      ...registry.extensions,
      assetDefaults: {
        ...defaults,
        iconAssetId: assetId,
      },
    },
  };
}

export function getWorkbenchDefaultIconAsset(
  registry: WorkbenchAssetRegistry | undefined,
): WorkbenchDesignAsset | null {
  if (!registry) return null;
  const defaults = getWorkbenchAssetDefaults(registry);
  return registry.assets.find((asset) => asset.kind === 'icon' && asset.id === defaults.iconAssetId) ?? null;
}

export function getWorkbenchIconPreviewOptions(asset: WorkbenchDesignAsset): WorkbenchIconPreviewOption[] {
  const rawPreviewIcons = asset.extensions?.previewIcons;
  if (!Array.isArray(rawPreviewIcons)) return [];
  const options = rawPreviewIcons.flatMap((preview) => {
    if (!isRecord(preview) || typeof preview.name !== 'string' || typeof preview.value !== 'string') return [];
    const importName = typeof preview.importName === 'string' ? preview.importName : undefined;
    const key = normalizeWorkbenchIconKey(importName ?? preview.name);
    if (!key) return [];
    const sourceFile = typeof preview.sourceFile === 'string' ? preview.sourceFile : undefined;
    const style = getWorkbenchIconStyleLabel(preview.style, sourceFile);
    return [{
      assetId: asset.id,
      importName,
      key,
      name: preview.name,
      sourceAssetName: asset.name,
      sourceFile,
      style,
      styleKey: normalizeWorkbenchIconKey(style),
      value: preview.value,
    }];
  });
  return sortWorkbenchIconPreviewOptions(options);
}

export function getWorkbenchImagePreviewOptions(asset: WorkbenchDesignAsset): WorkbenchIconPreviewOption[] {
  const rawPreviewImages = asset.extensions?.previewImages;
  if (!Array.isArray(rawPreviewImages)) return [];
  const options = rawPreviewImages.flatMap((preview) => {
    if (!isRecord(preview) || typeof preview.name !== 'string' || typeof preview.value !== 'string') return [];
    const key = normalizeWorkbenchIconKey(preview.name);
    if (!key) return [];
    const sourceFile = typeof preview.sourceFile === 'string' ? preview.sourceFile : undefined;
    return [{
      assetId: asset.id,
      key,
      name: preview.name,
      sourceAssetName: asset.name,
      sourceFile,
      value: preview.value,
    }];
  });
  return options.sort((left, right) => left.name.localeCompare(right.name, undefined, { numeric: true }));
}

export function getWorkbenchDefaultIconPreviewOptions(
  registry: WorkbenchAssetRegistry | undefined,
): WorkbenchIconPreviewOption[] {
  if (!registry) return [];
  const cached = defaultIconPreviewOptionsCache.get(registry);
  if (cached) return cached;
  const defaultIconAsset = getWorkbenchDefaultIconAsset(registry);
  const options = defaultIconAsset ? getWorkbenchIconPreviewOptions(defaultIconAsset) : [];
  defaultIconPreviewOptionsCache.set(registry, options);
  return options;
}

export function resolveWorkbenchDefaultIconSource(
  registry: WorkbenchAssetRegistry | undefined,
  iconName: string | undefined,
): string | null {
  const key = normalizeWorkbenchIconKey(iconName);
  if (!key) return null;
  return getWorkbenchDefaultIconSourceMap(registry)[key] ?? null;
}

export function getWorkbenchDefaultIconSourceMap(
  registry: WorkbenchAssetRegistry | undefined,
): Record<string, string> {
  if (!registry) return {};
  const cached = defaultIconSourceMapCache.get(registry);
  if (cached) return cached;
  const sourceMap: Record<string, string> = {};
  for (const option of getWorkbenchDefaultIconPreviewOptions(registry)) {
    const value = resolveWorkbenchHostAssetUrl(option.value);
    sourceMap[option.key] ??= value;
    const nameKey = normalizeWorkbenchIconKey(option.name);
    if (nameKey) sourceMap[nameKey] ??= value;
    const importNameKey = normalizeWorkbenchIconKey(option.importName);
    if (importNameKey) sourceMap[importNameKey] ??= value;
    const sourceFileKey = normalizeWorkbenchIconKey(option.sourceFile?.replace(/\.[^.]+$/, ''));
    if (sourceFileKey) sourceMap[sourceFileKey] ??= value;
    if (option.sourceFile) sourceMap[option.sourceFile] ??= value;
    sourceMap[option.value] ??= value;
  }
  defaultIconSourceMapCache.set(registry, sourceMap);
  return sourceMap;
}

export function normalizeWorkbenchIconKey(value: string | undefined): string {
  if (!value) return '';
  return value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-zA-Z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function sortWorkbenchIconPreviewOptions(options: WorkbenchIconPreviewOption[]): WorkbenchIconPreviewOption[] {
  return [...options].sort((left, right) => (
    getWorkbenchIconStyleSortOrder(left.styleKey) - getWorkbenchIconStyleSortOrder(right.styleKey) ||
    (left.style ?? '').localeCompare(right.style ?? '') ||
    left.name.localeCompare(right.name) ||
    (left.sourceFile ?? '').localeCompare(right.sourceFile ?? '')
  ));
}

function getWorkbenchIconStyleSortOrder(styleKey: string | undefined): number {
  switch (styleKey) {
    case 'outline':
    case 'line':
    case 'regular':
      return 0;
    case 'mini':
    case 'micro':
      return 1;
    case 'solid':
    case 'filled':
    case 'fill':
      return 2;
    case 'duotone':
    case 'two-tone':
    case 'twotone':
      return 3;
    default:
      return styleKey ? 4 : 5;
  }
}

function getWorkbenchIconStyleLabel(value: unknown, sourceFile: string | undefined): string | undefined {
  const sourceFileStyle = inferWorkbenchIconStyleFromSourceFile(sourceFile);
  if (sourceFile) return sourceFileStyle;
  if (typeof value === 'string' && value.trim()) return formatIconStyleLabel(value);
  return undefined;
}

function inferWorkbenchIconStyleFromSourceFile(sourceFile: string | undefined): string | undefined {
  if (!sourceFile) return undefined;
  const segments = getWorkbenchIconSourceFolderSegments(sourceFile);
  const styleKey = segments.find((segment) => ICON_STYLE_SEGMENTS.has(segment));
  return styleKey ? formatIconStyleLabel(styleKey) : undefined;
}

function getWorkbenchIconSourceFolderSegments(sourceFile: string): string[] {
  return sourceFile
    .split(/[\\/]/)
    .slice(0, -1)
    .map((segment) => normalizeWorkbenchIconKey(segment.replace(/\.[^.]+$/, '')))
    .filter(Boolean);
}

const ICON_STYLE_SEGMENTS = new Set([
  'bold',
  'duotone',
  'fill',
  'filled',
  'line',
  'micro',
  'mini',
  'outline',
  'regular',
  'sharp',
  'solid',
  'thin',
  'twotone',
  'two-tone',
]);

function formatIconStyleLabel(value: string): string {
  const key = normalizeWorkbenchIconKey(value);
  if (key === 'twotone') return 'Two-tone';
  return key
    .split('-')
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');
}

export function getWorkbenchFontDefaultLabel(slot: WorkbenchFontDefaultSlot): string {
  return WORKBENCH_FONT_DEFAULT_SLOTS.find((option) => option.slot === slot)?.label ?? 'Font';
}

export function getWorkbenchFontAssetFamily(asset: WorkbenchDesignAsset): string {
  const fontFamily = asset.extensions?.fontFamily;
  return typeof fontFamily === 'string' && fontFamily.trim() ? fontFamily.trim() : asset.name;
}

export function getWorkbenchDefaultFontCssText(
  registry: WorkbenchAssetRegistry | undefined,
  scopeSelector: string,
): string {
  if (!registry) return '';
  const defaults = getWorkbenchAssetDefaults(registry);
  const fontAssets = registry.assets.filter((asset) => asset.kind === 'font');
  const defaultBySlot = new Map<WorkbenchFontDefaultSlot, WorkbenchDesignAsset>();

  for (const option of WORKBENCH_FONT_DEFAULT_SLOTS) {
    const assetId = defaults.fonts[option.slot];
    const asset = assetId ? fontAssets.find((candidate) => candidate.id === assetId) : null;
    if (asset) defaultBySlot.set(option.slot, asset);
  }

  if (defaultBySlot.size === 0) return '';

  const cssAssets = new Map<string, WorkbenchDesignAsset>();
  for (const asset of defaultBySlot.values()) {
    const family = getWorkbenchFontAssetFamily(asset);
    for (const relatedAsset of fontAssets) {
      if (getWorkbenchFontAssetFamily(relatedAsset) === family) cssAssets.set(relatedAsset.id, relatedAsset);
    }
  }

  const variableLines = WORKBENCH_FONT_DEFAULT_SLOTS.flatMap((option) => {
    const asset = defaultBySlot.get(option.slot);
    return asset ? [`  ${option.cssVariable}: "${escapeCssString(getWorkbenchFontAssetFamily(asset))}";`] : [];
  });
  const fontFaces = [...cssAssets.values()].map((asset) => getWorkbenchFontFaceCssSnippet(asset, { runtime: true }));
  const selectors = scopeSelector.split(',').map((selector) => selector.trim()).filter(Boolean);
  const selectorText = selectors.join(', ');
  const headingSelectorText = selectors.map((selector) => `${selector} :where(h1, h2, h3, h4, h5, h6)`).join(', ');
  const monoSelectorText = selectors.map((selector) => `${selector} :where(code, pre, kbd, samp)`).join(', ');

  // Each font-family rule is emitted only when a default in its fallback chain
  // is actually configured. These rules are unlayered with scope-class
  // specificity, so an unconditional rule would defeat project theme CSS that
  // keeps its typography intentionally low-priority (e.g. `@layer` +
  // `:where()` rules), collapsing e.g. headings to `inherit`.
  const hasHeadingDefault = ['headingAssetId', 'serifAssetId', 'bodyAssetId']
    .some((slot) => defaultBySlot.has(slot as WorkbenchFontDefaultSlot));
  const hasBodyDefault = ['bodyAssetId', 'sansAssetId']
    .some((slot) => defaultBySlot.has(slot as WorkbenchFontDefaultSlot));
  const hasMonoDefault = defaultBySlot.has('monoAssetId');

  return [
    ...fontFaces,
    `${selectorText} {`,
    ...variableLines,
    ...(hasHeadingDefault
      ? ['  --font-heading: var(--wb-font-heading, var(--wb-font-serif, var(--wb-font-body, var(--font-sans, inherit))));']
      : []),
    ...(hasBodyDefault
      ? [
        '  --font-sans: var(--wb-font-sans, var(--wb-font-body, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif));',
        '  font-family: var(--wb-font-body, var(--wb-font-sans, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif));',
      ]
      : []),
    ...(hasMonoDefault
      ? ['  --font-mono: var(--wb-font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);']
      : []),
    '}',
    ...(hasHeadingDefault
      ? [
        `${headingSelectorText} {`,
        '  font-family: var(--wb-font-heading, var(--wb-font-serif, var(--wb-font-body, inherit)));',
        '}',
      ]
      : []),
    ...(hasMonoDefault
      ? [
        `${monoSelectorText} {`,
        '  font-family: var(--wb-font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);',
        '}',
      ]
      : []),
  ].join('\n');
}

export function getDesignAssetUsageValue(asset: WorkbenchDesignAsset): string {
  return asset.source.value;
}

export function getDesignAssetRuntimeValue(asset: WorkbenchDesignAsset): string {
  return resolveWorkbenchHostAssetUrl(asset.source.value);
}

export function getWorkbenchAssetRuntimeValue(value: string): string {
  return resolveWorkbenchHostAssetUrl(value);
}

export function getDesignAssetCssSnippet(asset: WorkbenchDesignAsset): string {
  const value = getDesignAssetUsageValue(asset);
  if (asset.kind === 'font') {
    return getWorkbenchFontFaceCssSnippet(asset);
  }

  return `url("${escapeCssString(value)}")`;
}

export function getDesignAssetRuntimeCssSnippet(asset: WorkbenchDesignAsset): string {
  const value = getDesignAssetRuntimeValue(asset);
  if (asset.kind === 'font') {
    return getWorkbenchFontFaceCssSnippet(asset, { runtime: true });
  }

  return `url("${escapeCssString(value)}")`;
}

export function inferDesignAssetKind(file: File): WorkbenchDesignAssetKind {
  if (file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')) return 'icon';
  if (file.type.startsWith('video/') || VIDEO_EXTENSION_PATTERN.test(file.name)) return 'video';
  if (file.type.startsWith('font/') || FONT_EXTENSION_PATTERN.test(file.name)) return 'font';
  return 'image';
}

export function isVideoDesignAssetSource(value: string | undefined): boolean {
  const source = value?.trim().split(/[?#]/, 1)[0].toLowerCase() ?? '';
  return source.startsWith('data:video/') || VIDEO_EXTENSION_PATTERN.test(source);
}

function createDesignAssetId(name: string, now: string): string {
  const slug = stripAssetExtension(name)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'asset';
  return `asset-${slug}-${Date.parse(now).toString(36)}`;
}

function stripAssetExtension(name: string): string {
  return name.replace(/\.[^.]+$/, '');
}

function escapeCssString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function getWorkbenchFontFaceCssSnippet(
  asset: WorkbenchDesignAsset,
  options: WorkbenchFontFaceCssSnippetOptions = {},
): string {
  return getWorkbenchFontAssetFaces(asset)
    .map((face) => getWorkbenchFontFaceCssSnippetForSource(asset, face, options))
    .join('\n');
}

function getWorkbenchFontFaceCssSnippetForSource(
  asset: WorkbenchDesignAsset,
  face: {
    source: string;
    unicodeRange: string | null;
    weight: string | null;
    style: string | null;
  },
  options: WorkbenchFontFaceCssSnippetOptions,
): string {
  const source = options.runtime ? resolveWorkbenchHostAssetUrl(face.source) : face.source;
  const lines = [
    '@font-face {',
    `  font-family: "${escapeCssString(getWorkbenchFontAssetFamily(asset))}";`,
    `  src: url("${escapeCssString(source)}");`,
  ];
  lines.push(`  font-weight: ${face.weight ?? getWorkbenchFontAssetDefaultWeight(asset, face.source)};`);
  lines.push(`  font-style: ${face.style ?? 'normal'};`);
  if (face.unicodeRange) lines.push(`  unicode-range: ${face.unicodeRange};`);
  lines.push('  font-display: swap;', '}');
  return lines.join('\n');
}

function getWorkbenchFontAssetFaces(asset: WorkbenchDesignAsset): Array<{
  source: string;
  unicodeRange: string | null;
  weight: string | null;
  style: string | null;
}> {
  const rawFaces = asset.extensions?.fontFaces;
  if (Array.isArray(rawFaces)) {
    const faces = rawFaces.flatMap((face) => {
      if (!isRecord(face)) return [];
      const source = getStringValue(face.source) ?? getStringValue(face.value);
      if (!source) return [];
      return [{
        source,
        unicodeRange: getStringValue(face.unicodeRange),
        weight: getStringValue(face.fontWeight),
        style: getStringValue(face.fontStyle),
      }];
    });
    if (faces.length > 0) return faces;
  }

  return [{
    source: getDesignAssetUsageValue(asset),
    unicodeRange: getFontExtensionValue(asset, 'unicodeRange'),
    weight: getFontExtensionValue(asset, 'fontWeight'),
    style: getFontExtensionValue(asset, 'fontStyle'),
  }];
}

function getFontExtensionValue(asset: WorkbenchDesignAsset, key: string): string | null {
  const value = asset.extensions?.[key];
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function getWorkbenchFontAssetDefaultWeight(asset: WorkbenchDesignAsset, source: string): string {
  const searchableText = [
    asset.fileName,
    asset.name,
    source,
    getFontExtensionValue(asset, 'sourceFile'),
  ].filter(Boolean).join(' ').toLowerCase();
  if (searchableText.includes('variable')) return '100 900';
  if (/\b(?:thin|hairline)\b/.test(searchableText)) return '100';
  if (/\b(?:extra|ultra)[-_ ]?light\b/.test(searchableText)) return '200';
  if (/\blight\b/.test(searchableText)) return '300';
  if (/\b(?:regular|normal|book|roman)\b/.test(searchableText)) return '400';
  if (/\bmedium\b/.test(searchableText)) return '500';
  if (/\b(?:semi|demi)[-_ ]?bold\b/.test(searchableText)) return '600';
  if (/\b(?:extra|ultra)[-_ ]?bold\b/.test(searchableText)) return '800';
  if (/\b(?:black|heavy)\b/.test(searchableText)) return '900';
  if (/\bbold\b/.test(searchableText)) return '700';
  return '400';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getStringOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function getStringValue(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}
