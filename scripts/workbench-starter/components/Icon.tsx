import type { CSSProperties, HTMLAttributes } from 'react';
import './local.css';

export type IconRenderMode = 'auto' | 'mask' | 'image';
export type IconSize = 'inherit' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number | string;

export interface IconProps extends HTMLAttributes<HTMLSpanElement> {
  decorative?: boolean;
  label?: string;
  renderMode?: IconRenderMode;
  size?: IconSize;
  source?: string;
}

const DEFAULT_ICON_SOURCE = '/workbench-assets/icons/lucide/sparkles.svg';

export function Icon({
  className = '',
  decorative = true,
  label,
  renderMode = 'auto',
  size,
  source = DEFAULT_ICON_SOURCE,
  style,
  ...rest
}: IconProps) {
  const iconSource = normalizeAssetSource(source) ?? DEFAULT_ICON_SOURCE;
  const resolvedSize = normalizeIconSize(size);
  const resolvedRenderMode = normalizeIconRenderMode(renderMode, iconSource);
  const iconStyle = {
    '--wb-icon-url': `url("${escapeCssUrl(iconSource)}")`,
    ...(resolvedSize ? { inlineSize: resolvedSize, blockSize: resolvedSize } : {}),
    ...style,
  } as CSSProperties;
  return (
    <span
      {...rest}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : label ?? formatIconLabel(iconSource)}
      className={['wb-icon', `wb-icon--${resolvedRenderMode}`, className].filter(Boolean).join(' ')}
      data-wb-asset-kind="icon"
      data-wb-asset-src={iconSource}
      data-wb-icon-name={formatIconLabel(iconSource)}
      role={decorative ? undefined : 'img'}
      style={iconStyle}
    />
  );
}

function normalizeAssetSource(value: string | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('/')) return trimmed;
  if (trimmed.startsWith('workbench-assets/')) return `/${trimmed}`;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^data:image\//i.test(trimmed)) return trimmed;
  return null;
}

function normalizeIconSize(size: IconSize | undefined): string | null {
  if (typeof size === 'number' && Number.isFinite(size)) return `${size}px`;
  const trimmed = String(size ?? '').trim();
  if (!trimmed || trimmed === 'inherit') return null;
  const preset = ICON_SIZE_PRESETS[trimmed.toLowerCase()];
  if (preset) return preset;
  return trimmed;
}

const ICON_SIZE_PRESETS: Record<string, string> = {
  xs: '12px',
  sm: '16px',
  md: '20px',
  lg: '24px',
  xl: '32px',
};

function normalizeIconRenderMode(value: IconRenderMode | undefined, source: string): Exclude<IconRenderMode, 'auto'> {
  if (value === 'image' || value === 'mask') return value;
  return isImageAssetSource(source) ? 'image' : 'mask';
}

function isImageAssetSource(source: string): boolean {
  const normalized = source.trim().toLowerCase();
  return normalized.startsWith('data:image/') ||
    normalized.includes('/workbench-assets/images/') ||
    normalized.includes('/workbench-assets/icons/clova-color/');
}

function escapeCssUrl(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function formatIconLabel(source: string): string {
  const fileName = source.split(/[?#]/, 1)[0]?.split('/').pop() ?? 'icon';
  return fileName.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ') || 'icon';
}
