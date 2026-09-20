import { Icon } from '@astryxdesign/core/Icon';
import { useEffect, useState, type ComponentPropsWithoutRef, type CSSProperties } from 'react';

export const ASTRYX_ICON_NAMES = [
  'close',
  'chevronDown',
  'chevronLeft',
  'chevronRight',
  'check',
  'success',
  'error',
  'warning',
  'info',
  'calendar',
  'clock',
  'externalLink',
  'menu',
  'moreHorizontal',
  'search',
  'arrowUp',
  'arrowDown',
  'arrowsUpDown',
  'funnel',
  'eyeSlash',
  'viewColumns',
  'copy',
  'checkDouble',
  'wrench',
  'stop',
  'microphone',
] as const;

export type AstryxIconName = typeof ASTRYX_ICON_NAMES[number];
export type AstryxIconValue = AstryxIconName | (string & {});
export type AstryxIconColor =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'disabled'
  | 'accent'
  | 'success'
  | 'error'
  | 'warning'
  | 'inherit'
  | 'blue'
  | 'red'
  | 'green'
  | 'gray'
  | 'cyan'
  | 'teal'
  | 'yellow'
  | 'orange'
  | 'pink'
  | 'purple';
export type AstryxIconSize = 'xsm' | 'sm' | 'md' | 'lg';

type AstryxIconRootProps = Omit<ComponentPropsWithoutRef<typeof Icon>, 'className' | 'color' | 'icon' | 'size'>;

export interface AstryxIconProps extends AstryxIconRootProps {
  icon?: AstryxIconValue;
  color?: AstryxIconColor;
  size?: AstryxIconSize;
  className?: string;
}

export function AstryxIcon({
  icon = 'info',
  color = 'inherit',
  size = 'md',
  className,
  ...rootProps
}: AstryxIconProps) {
  const resolvedIcon = resolveAstryxIconName(icon);
  if (resolvedIcon) return <Icon {...rootProps} className={className} color={color} icon={resolvedIcon} size={size} />;

  const workbenchIconSources = resolveWorkbenchIconSources(icon);
  if (workbenchIconSources.length > 0) {
    return (
      <WorkbenchPickerIcon
        className={className}
        color={color}
        iconSources={workbenchIconSources}
        rootProps={rootProps}
        size={size}
      />
    );
  }

  return <Icon {...rootProps} className={className} color={color} icon={normalizeAstryxIconName(icon)} size={size} />;
}

const ASTRYX_ICON_NAME_SET = new Set<string>(ASTRYX_ICON_NAMES);
const ASTRYX_ICON_NAME_BY_KEY = Object.fromEntries(
  ASTRYX_ICON_NAMES.map((name) => [normalizeIconPickerKey(name), name]),
) as Record<string, AstryxIconName>;

const ASTRYX_ICON_PICKER_ALIASES: Record<string, AstryxIconName> = {
  'alert-circle': 'warning',
  'alert-octagon': 'error',
  'alert-triangle': 'warning',
  'arrow-down-up': 'arrowsUpDown',
  'arrow-up-down': 'arrowsUpDown',
  'badge-check': 'success',
  'check-check': 'checkDouble',
  'check-circle': 'success',
  'circle-alert': 'warning',
  'circle-check': 'success',
  'circle-x': 'error',
  columns: 'viewColumns',
  'copy-check': 'checkDouble',
  ellipsis: 'moreHorizontal',
  'ellipsis-horizontal': 'moreHorizontal',
  filter: 'funnel',
  mic: 'microphone',
  'panel-right': 'viewColumns',
  square: 'stop',
  x: 'close',
  'x-circle': 'error',
};

export function normalizeAstryxIconName(value: unknown, fallback: AstryxIconName = 'info'): AstryxIconName {
  return resolveAstryxIconName(value) ?? fallback;
}

function resolveAstryxIconName(value: unknown): AstryxIconName | null {
  if (typeof value !== 'string') return null;
  const trimmedValue = value.trim();
  if (!trimmedValue) return null;
  // The Core `info` glyph is intentionally a solid status icon. Workbench's
  // icon picker exposes the Lucide outline `info.svg`, so let that authored
  // asset win instead of shadowing it with the Core fallback.
  if (trimmedValue === 'info') return null;
  if (ASTRYX_ICON_NAME_SET.has(trimmedValue)) return trimmedValue as AstryxIconName;
  const key = normalizeIconPickerKey(trimmedValue);
  return ASTRYX_ICON_NAME_BY_KEY[key] ?? ASTRYX_ICON_PICKER_ALIASES[key] ?? null;
}

function normalizeIconPickerKey(value: string): string {
  return value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-zA-Z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

type WorkbenchIconRuntimeGlobal = typeof globalThis & {
  __WORKBENCH_DEFAULT_ICON_SOURCES__?: Record<string, string>;
};

const workbenchIconSvgCache = new Map<string, string | null>();
const defaultWorkbenchIconRoot = '/workbench-assets/icons/lucide-preview';
const iconSizeValues: Record<AstryxIconSize, string> = {
  xsm: '0.75rem',
  sm: '1rem',
  md: '1.25rem',
  lg: '1.5rem',
};

function WorkbenchPickerIcon({
  className,
  color,
  iconSources,
  rootProps,
  size,
}: {
  className?: string;
  color: AstryxIconColor;
  iconSources: string[];
  rootProps: AstryxIconRootProps;
  size: AstryxIconSize;
}) {
  const svgMarkup = useWorkbenchIconSvg(iconSources);
  const { style, ...spanProps } = rootProps as ComponentPropsWithoutRef<'span'>;
  const iconStyle: CSSProperties = {
    width: iconSizeValues[size],
    height: iconSizeValues[size],
    fontSize: iconSizeValues[size],
    color: getIconColorValue(color),
    ...style,
  };

  if (svgMarkup === null) {
    return <Icon {...rootProps} className={className} color={color} icon="info" size={size} />;
  }

  if (svgMarkup === undefined) {
    return (
      <span
        {...spanProps}
        aria-hidden={spanProps['aria-label'] ? undefined : true}
        className={['astryx-workbench-icon', className].filter(Boolean).join(' ')}
        style={iconStyle}
      />
    );
  }

  return (
    <span
      {...spanProps}
      aria-hidden={spanProps['aria-label'] ? undefined : true}
      className={['astryx-workbench-icon', className].filter(Boolean).join(' ')}
      dangerouslySetInnerHTML={{ __html: svgMarkup }}
      style={iconStyle}
    />
  );
}

function useWorkbenchIconSvg(iconSources: string[]): string | null | undefined {
  const iconSourcesKey = iconSources.join('\n');
  const [svgMarkup, setSvgMarkup] = useState<string | null | undefined>(() =>
    getCachedWorkbenchIconSvg(iconSources),
  );

  useEffect(() => {
    const currentSources = iconSourcesKey.split('\n').filter(Boolean);
    const cachedMarkup = getCachedWorkbenchIconSvg(currentSources);
    if (cachedMarkup !== undefined) {
      setSvgMarkup(cachedMarkup);
      return;
    }

    setSvgMarkup(undefined);
    let isCancelled = false;
    void (async () => {
      for (const iconSource of currentSources) {
        const cachedSourceMarkup = workbenchIconSvgCache.get(iconSource);
        if (cachedSourceMarkup) {
          if (!isCancelled) setSvgMarkup(cachedSourceMarkup);
          return;
        }
        if (cachedSourceMarkup === null) continue;

        let safeMarkup: string | null = null;
        try {
          const response = await fetch(iconSource);
          safeMarkup = sanitizeWorkbenchIconSvg(response.ok ? await response.text() : null);
        } catch {
          safeMarkup = null;
        }
        workbenchIconSvgCache.set(iconSource, safeMarkup);
        if (safeMarkup) {
          if (!isCancelled) setSvgMarkup(safeMarkup);
          return;
        }
      }
      if (!isCancelled) setSvgMarkup(null);
    })();

    return () => {
      isCancelled = true;
    };
  }, [iconSourcesKey]);

  return svgMarkup;
}

function getCachedWorkbenchIconSvg(iconSources: string[]): string | null | undefined {
  let hasUncachedSource = false;
  for (const iconSource of iconSources) {
    if (!workbenchIconSvgCache.has(iconSource)) {
      hasUncachedSource = true;
      continue;
    }
    const cachedMarkup = workbenchIconSvgCache.get(iconSource);
    if (cachedMarkup) return cachedMarkup;
  }
  return hasUncachedSource ? undefined : null;
}

function resolveWorkbenchIconSources(value: unknown): string[] {
  if (typeof value !== 'string') return [];
  const trimmedValue = value.trim();
  if (!trimmedValue) return [];
  if (isWorkbenchIconSourceValue(trimmedValue)) return [trimmedValue];

  const sourceMap = (globalThis as WorkbenchIconRuntimeGlobal).__WORKBENCH_DEFAULT_ICON_SOURCES__;
  const key = normalizeIconPickerKey(trimmedValue);
  const mappedSource = sourceMap?.[key] ?? sourceMap?.[trimmedValue];
  if (mappedSource) return [mappedSource];
  return createDefaultWorkbenchIconSourceKeys(key)
    .map((sourceKey) => `${defaultWorkbenchIconRoot}/${sourceKey}.svg`);
}

function createDefaultWorkbenchIconSourceKeys(key: string): string[] {
  const insertionPositions = new Set<number>();
  for (let index = 1; index < key.length; index += 1) {
    const previousCharacter = key[index - 1];
    const currentCharacter = key[index];
    if (
      (/[a-z]/.test(previousCharacter) && /[0-9]/.test(currentCharacter)) ||
      (/[0-9]/.test(previousCharacter) && /[0-9]/.test(currentCharacter))
    ) {
      insertionPositions.add(index);
    }
  }
  if (/^[a-z][a-z]/.test(key)) insertionPositions.add(1);
  for (let index = 2; index < key.length; index += 1) {
    if (
      key[index - 2] === '-' &&
      /[xyz]/.test(key[index - 1]) &&
      /[a-z]/.test(key[index])
    ) {
      insertionPositions.add(index);
    }
  }
  if (/-(?:az|za)$/.test(key)) insertionPositions.add(key.length - 1);

  const positions = [...insertionPositions].sort((left, right) => left - right);
  const candidateKeys = new Set<string>([key]);
  for (let mask = 1; mask < 2 ** positions.length; mask += 1) {
    const activePositions = new Set(
      positions.filter((_, positionIndex) => (mask & (1 << positionIndex)) !== 0),
    );
    let candidate = '';
    for (let index = 0; index < key.length; index += 1) {
      if (activePositions.has(index)) candidate += '-';
      candidate += key[index];
    }
    candidateKeys.add(candidate);
  }
  for (const candidate of [...candidateKeys]) {
    candidateKeys.add(candidate.replace(/([0-9])-([xyz])(?=[0-9])/g, '$1$2'));
  }

  return [
    key,
    ...[...candidateKeys]
      .filter((candidate) => candidate !== key)
      .sort((left, right) => left.localeCompare(right)),
  ];
}

function isWorkbenchIconSourceValue(value: string): boolean {
  return value.startsWith('/workbench-assets/icons/') ||
    value.startsWith('workbench-assets/icons/') ||
    value.endsWith('.svg') ||
    value.startsWith('data:image/svg+xml');
}

function sanitizeWorkbenchIconSvg(svgText: string | null): string | null {
  if (!svgText || typeof DOMParser === 'undefined') return null;
  const document = new DOMParser().parseFromString(svgText, 'image/svg+xml');
  if (document.querySelector('parsererror')) return null;
  const svg = document.querySelector('svg');
  if (!svg) return null;

  svg.querySelectorAll('script, foreignObject, iframe, object, embed, link, style').forEach((node) => node.remove());
  for (const element of Array.from(svg.querySelectorAll('*'))) {
    for (const attribute of Array.from(element.attributes)) {
      const attributeName = attribute.name.toLowerCase();
      const attributeValue = attribute.value.trim().toLowerCase();
      if (attributeName.startsWith('on') || ((attributeName === 'href' || attributeName === 'xlink:href') && attributeValue.startsWith('javascript:'))) {
        element.removeAttribute(attribute.name);
      }
    }
  }

  svg.removeAttribute('width');
  svg.removeAttribute('height');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  return svg.outerHTML;
}

function getIconColorValue(color: AstryxIconColor): string {
  if (color === 'inherit') return 'inherit';
  if (color === 'tertiary') return 'var(--color-icon-tertiary, var(--color-icon-secondary, currentColor))';
  return `var(--color-icon-${color}, currentColor)`;
}
