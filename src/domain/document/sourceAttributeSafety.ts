import { SOURCE_TOKEN_MODE_ATTRIBUTE } from '@domain/design-system/tokens/modeOverride';
import {
  PROTOTYPE_CLICK_ATTRIBUTE,
  PROTOTYPE_INITIAL_ATTRIBUTE,
  PROTOTYPE_NAME_ATTRIBUTE,
  PROTOTYPE_PANEL_ATTRIBUTE,
  PROTOTYPE_TAB_ATTRIBUTE,
} from '@domain/document/prototypeInteractions';

export const SOURCE_ASSET_KIND_ATTRIBUTE = 'data-wb-asset-kind';
export const SOURCE_ASSET_SOURCE_ATTRIBUTE = 'data-wb-asset-src';
export const SOURCE_ICON_NAME_ATTRIBUTE = 'data-wb-icon-name';
export const SOURCE_ICON_SET_ATTRIBUTE = 'data-wb-icon-set';

export const EDITABLE_SOURCE_ATTRIBUTE_NAMES = [
  'alt',
  'aria-label',
  'aria-labelledby',
  'aria-hidden',
  'className',
  'clipRule',
  'cx',
  'cy',
  'd',
  'data-icon',
  'dominantBaseline',
  PROTOTYPE_CLICK_ATTRIBUTE,
  PROTOTYPE_INITIAL_ATTRIBUTE,
  PROTOTYPE_NAME_ATTRIBUTE,
  PROTOTYPE_PANEL_ATTRIBUTE,
  PROTOTYPE_TAB_ATTRIBUTE,
  'fill',
  'fillRule',
  'focusable',
  'gradientTransform',
  'gradientUnits',
  SOURCE_ASSET_KIND_ATTRIBUTE,
  SOURCE_ASSET_SOURCE_ATTRIBUTE,
  SOURCE_ICON_NAME_ATTRIBUTE,
  SOURCE_ICON_SET_ATTRIBUTE,
  SOURCE_TOKEN_MODE_ATTRIBUTE,
  'height',
  'hidden',
  'href',
  'id',
  'mask',
  'maskUnits',
  'name',
  'offset',
  'opacity',
  'pathLength',
  'placeholder',
  'points',
  'preserveAspectRatio',
  'r',
  'rx',
  'ry',
  'poster',
  'role',
  'src',
  'spreadMethod',
  'stopColor',
  'stopOpacity',
  'stroke',
  'strokeLinecap',
  'strokeLinejoin',
  'strokeOpacity',
  'strokeWidth',
  'textAnchor',
  'title',
  'transform',
  'type',
  'value',
  'viewBox',
  'width',
  'x',
  'x1',
  'x2',
  'y',
  'y1',
  'y2',
] as const;

export type SourceAttributeName = typeof EDITABLE_SOURCE_ATTRIBUTE_NAMES[number];

export function isSourceIntrinsicElementTagName(value: string): boolean {
  return /^[a-z][\w:-]*$/.test(value.trim());
}

const EDITABLE_SOURCE_ATTRIBUTE_NAME_SET = new Set<string>(EDITABLE_SOURCE_ATTRIBUTE_NAMES);
const URL_SOURCE_ATTRIBUTE_NAMES = new Set<string>(['href', 'poster', 'src']);
const HREF_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);
const MEDIA_PROTOCOLS = new Set(['http:', 'https:', 'blob:']);
const BASE_URL = 'https://workbench.local/';

export function isEditableSourceAttributeName(value: string): value is SourceAttributeName {
  return EDITABLE_SOURCE_ATTRIBUTE_NAME_SET.has(value);
}

export function normalizeEditableSourceAttributeValue(
  attributeName: string,
  value: string,
  options: { allowEmpty?: boolean } = {},
): string | null {
  if (!isEditableSourceAttributeName(attributeName)) return null;

  const trimmed = value.trim();
  if (!trimmed) return options.allowEmpty === true ? '' : null;
  if (attributeName === SOURCE_ASSET_KIND_ATTRIBUTE) {
    return trimmed === 'image' || trimmed === 'icon' || trimmed === 'video' ? trimmed : null;
  }
  if (attributeName === SOURCE_ASSET_SOURCE_ATTRIBUTE) {
    return isSafeUrlSourceAttributeValue('src', trimmed) ? trimmed : null;
  }
  if (attributeName === PROTOTYPE_TAB_ATTRIBUTE || attributeName === PROTOTYPE_PANEL_ATTRIBUTE) {
    return /^[a-zA-Z0-9_-]{1,64}\/[a-zA-Z0-9_-]{1,64}$/.test(trimmed) ? trimmed : null;
  }
  if (attributeName === SOURCE_ICON_SET_ATTRIBUTE) {
    return trimmed === 'default' ? trimmed : null;
  }
  if (attributeName === SOURCE_ICON_NAME_ATTRIBUTE) {
    return /^[a-zA-Z0-9][a-zA-Z0-9 _.-]{0,127}$/.test(trimmed) ? trimmed : null;
  }
  if (attributeName === 'hidden') {
    return trimmed === 'true' || trimmed === 'hidden' ? 'true' : null;
  }
  if (!URL_SOURCE_ATTRIBUTE_NAMES.has(attributeName)) return value;

  return isSafeUrlSourceAttributeValue(attributeName, trimmed) ? trimmed : null;
}

export function isSafeUrlSourceAttributeValue(attributeName: string, value: string): boolean {
  if (!URL_SOURCE_ATTRIBUTE_NAMES.has(attributeName)) return true;

  const compacted = value.trim().replace(/[\u0000-\u001f\u007f\s]+/g, '');
  if (!compacted) return true;
  if (compacted.startsWith('\\')) return false;

  const schemeMatch = compacted.match(/^([a-z][a-z0-9+.-]*):/i);
  if (schemeMatch) {
    const protocol = `${schemeMatch[1].toLowerCase()}:`;
    if (protocol === 'data:') return isSafeDataImageSource(attributeName, compacted);
    return getAllowedProtocols(attributeName).has(protocol);
  }

  try {
    const parsed = new URL(value, BASE_URL);
    if (parsed.origin === new URL(BASE_URL).origin) return true;
    return getAllowedProtocols(attributeName).has(parsed.protocol);
  } catch {
    return false;
  }
}

function getAllowedProtocols(attributeName: string): Set<string> {
  return attributeName === 'href' ? HREF_PROTOCOLS : MEDIA_PROTOCOLS;
}

function isSafeDataImageSource(attributeName: string, value: string): boolean {
  if (attributeName === 'href') return false;
  return /^data:image\/(?:avif|gif|jpe?g|png|webp);base64,[a-z0-9+/]+={0,2}$/i.test(value);
}
