import { isVideoDesignAssetSource } from '@domain/design-system/assets/assetRegistry';

export const SOURCE_BACKGROUND_VIDEO_SOURCE_PROPERTY = '--wb-background-video-source';
export const SOURCE_BACKGROUND_VIDEO_SIZE_PROPERTY = '--wb-background-video-size';
export const SOURCE_BACKGROUND_VIDEO_POSITION_PROPERTY = '--wb-background-video-position';
export const SOURCE_BACKGROUND_VIDEO_BLEND_PROPERTY = '--wb-background-video-blend';

export const SOURCE_BACKGROUND_VIDEO_STYLE_PROPERTIES = [
  SOURCE_BACKGROUND_VIDEO_SOURCE_PROPERTY,
  SOURCE_BACKGROUND_VIDEO_SIZE_PROPERTY,
  SOURCE_BACKGROUND_VIDEO_POSITION_PROPERTY,
  SOURCE_BACKGROUND_VIDEO_BLEND_PROPERTY,
] as const;

export type SourceBackgroundVideoStyleProperty = typeof SOURCE_BACKGROUND_VIDEO_STYLE_PROPERTIES[number];

export type SourceBackgroundVideoLayer = {
  blend: string;
  position: string;
  size: string;
  source: string;
};

export function parseSourceBackgroundVideoLayers(
  declarations: Record<string, string> | undefined,
): SourceBackgroundVideoLayer[] {
  const sources = splitCssCommaList(declarations?.[SOURCE_BACKGROUND_VIDEO_SOURCE_PROPERTY] ?? '')
    .map(normalizeCssUrlValue)
    .filter(isVideoDesignAssetSource);
  const sizes = splitCssCommaList(declarations?.[SOURCE_BACKGROUND_VIDEO_SIZE_PROPERTY] ?? '');
  const positions = splitCssCommaList(declarations?.[SOURCE_BACKGROUND_VIDEO_POSITION_PROPERTY] ?? '');
  const blends = splitCssCommaList(declarations?.[SOURCE_BACKGROUND_VIDEO_BLEND_PROPERTY] ?? '');

  return sources.map((source, index) => ({
    blend: blends[index] || 'normal',
    position: positions[index] || 'center',
    size: sizes[index] || 'cover',
    source,
  }));
}

export function serializeSourceBackgroundVideoLayerProperty(
  layers: SourceBackgroundVideoLayer[],
  property: keyof SourceBackgroundVideoLayer,
): string | null {
  if (layers.length === 0) return null;
  return layers.map((layer) => layer[property].trim()).filter(Boolean).join(', ') || null;
}

export function splitCssCommaList(value: string): string[] {
  const parts: string[] = [];
  let current = '';
  let depth = 0;
  let quote: '"' | "'" | null = null;

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index]!;
    const previous = value[index - 1];
    if (quote) {
      current += char;
      if (char === quote && previous !== '\\') quote = null;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      current += char;
      continue;
    }
    if (char === '(') {
      depth += 1;
      current += char;
      continue;
    }
    if (char === ')') {
      depth = Math.max(0, depth - 1);
      current += char;
      continue;
    }
    if (char === ',' && depth === 0) {
      parts.push(current.trim());
      current = '';
      continue;
    }
    current += char;
  }

  if (current.trim()) parts.push(current.trim());
  return parts;
}

export function normalizeCssUrlValue(value: string): string {
  const trimmed = value.trim();
  const match = /^url\(([\s\S]*)\)$/i.exec(trimmed);
  if (!match) return stripCssStringQuotes(trimmed);
  return stripCssStringQuotes(match[1]?.trim() ?? '');
}

function stripCssStringQuotes(value: string): string {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).replace(/\\(["'\\])/g, '$1');
  }
  return trimmed;
}
