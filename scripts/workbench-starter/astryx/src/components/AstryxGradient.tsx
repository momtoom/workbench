import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from 'react';
import { cx } from './classNames';

export type AstryxGradientKind =
  | 'linear'
  | 'radial'
  | 'conic'
  | 'repeating-linear'
  | 'repeating-radial';

export type AstryxGradientEasing =
  | 'linear'
  | 'ease-in'
  | 'ease-out'
  | 'ease-in-out'
  | 'smoothstep'
  | 'sine';

export type AstryxGradientBlendMode =
  | 'normal'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn'
  | 'hard-light'
  | 'soft-light'
  | 'difference'
  | 'exclusion'
  | 'hue'
  | 'saturation'
  | 'color'
  | 'luminosity'
  | 'plus-darker'
  | 'plus-lighter';

type AstryxGradientRootStyle = CSSProperties & {
  '--astryx-wb-gradient-blend-mode'?: string;
  '--astryx-wb-gradient-backdrop-blur'?: string;
  '--astryx-wb-gradient-backdrop-mask'?: string;
  '--astryx-wb-gradient-background'?: string;
  '--astryx-wb-gradient-opacity'?: string;
  '--astryx-wb-gradient-repeat-size'?: string;
  '--astryx-wb-gradient-size'?: string;
};

type AstryxGradientRootProps = Omit<
  ComponentPropsWithoutRef<'div'>,
  | 'children'
  | 'className'
  | 'style'
>;

export interface AstryxGradientProps extends AstryxGradientRootProps {
  startColor?: string;
  startColorToken?: string;
  startColorTokenCollection?: string;
  endColor?: string;
  endColorToken?: string;
  endColorTokenCollection?: string;
  startX?: number;
  startY?: number;
  endX?: number;
  endY?: number;
  fadeStart?: number;
  fadeEnd?: number;
  kind?: AstryxGradientKind;
  rotation?: number;
  easing?: AstryxGradientEasing;
  opacity?: number;
  blendMode?: AstryxGradientBlendMode;
  repeatSize?: number;
  gradientSize?: string;
  backdropBlur?: number;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

export function AstryxGradient({
  startColor = 'rgba(34, 91, 255, 0.95)',
  startColorToken,
  startColorTokenCollection,
  endColor = 'rgba(253, 238, 140, 0.2)',
  endColorToken,
  endColorTokenCollection,
  startX = 0,
  startY = 0,
  endX = 100,
  endY = 100,
  fadeStart = 65,
  fadeEnd = 100,
  kind = 'linear',
  rotation = 0,
  easing = 'ease-in-out',
  opacity = 1,
  blendMode = 'normal',
  repeatSize = 18,
  gradientSize = '100% 100%',
  backdropBlur = 0,
  className,
  style,
  children,
  ...rootProps
}: AstryxGradientProps) {
  const resolvedStartColor = resolveAstryxGradientTokenColor({
    color: startColor,
    tokenCollection: startColorTokenCollection,
    tokenId: startColorToken,
  });
  const resolvedEndColor = resolveAstryxGradientTokenColor({
    color: endColor,
    tokenCollection: endColorTokenCollection,
    tokenId: endColorToken,
  });
  const stops = createAstryxGradientStops({
    easing,
    endColor: resolvedEndColor,
    fadeEnd,
    fadeStart,
    startColor: resolvedStartColor,
  });
  const gradientBackground = createAstryxGradientBackground({
    endX,
    endY,
    kind,
    repeatSize,
    rotation,
    startX,
    startY,
    stops,
  });
  const backdropMask = createAstryxGradientFadeMask({
    easing,
    endX,
    endY,
    fadeEnd,
    fadeStart,
    rotation,
    startX,
    startY,
  });
  const blur = Math.max(0, Number.isFinite(backdropBlur) ? backdropBlur : 0);
  const resolvedOpacity = clampAstryxGradientUnit(opacity);
  const repeat = Math.max(1, Number.isFinite(repeatSize) ? repeatSize : 18);
  const resolvedGradientSize = resolveAstryxGradientCssSize(gradientSize);
  const rootStyle: AstryxGradientRootStyle = {
    '--astryx-wb-gradient-blend-mode': blendMode,
    '--astryx-wb-gradient-backdrop-blur': `${formatAstryxGradientNumber(blur)}px`,
    '--astryx-wb-gradient-backdrop-mask': backdropMask,
    '--astryx-wb-gradient-background': gradientBackground,
    '--astryx-wb-gradient-opacity': formatAstryxGradientNumber(resolvedOpacity),
    '--astryx-wb-gradient-repeat-size': `${formatAstryxGradientNumber(repeat)}px`,
    ...(resolvedGradientSize ? { '--astryx-wb-gradient-size': resolvedGradientSize } : {}),
    ...style,
  };

  return (
    <div
      {...rootProps}
      className={cx('astryx-wb-gradient', className)}
      data-astryx-wb-gradient-blend-mode={blendMode}
      data-astryx-wb-gradient-easing={easing}
      data-astryx-wb-gradient-kind={kind}
      data-astryx-wb-gradient-rotation={formatAstryxGradientNumber(normalizeAstryxGradientAngle(rotation))}
      style={rootStyle}
    >
      <div aria-hidden="true" className="astryx-wb-gradient-backdrop" />
      <div aria-hidden="true" className="astryx-wb-gradient-fill" />
      {children}
    </div>
  );
}

type AstryxGradientStop = {
  color: string;
  offset: number;
  opacity: number;
};

function createAstryxGradientStops({
  easing,
  endColor,
  fadeEnd,
  fadeStart,
  startColor,
}: {
  easing: AstryxGradientEasing;
  endColor: string;
  fadeEnd: number;
  fadeStart: number;
  startColor: string;
}): AstryxGradientStop[] {
  const rawStart = clampAstryxGradientPercent(fadeStart);
  const rawEnd = clampAstryxGradientPercent(fadeEnd);
  const start = rawStart;
  const end = rawEnd;
  const steps = 12;
  const offsets = new Set<number>([0, start, end, 100]);

  for (let index = 1; index < steps; index += 1) {
    offsets.add((index / steps) * 100);
  }

  return Array.from(offsets)
    .sort((left, right) => left - right)
    .map((offset) => {
      const fadeProgress = resolveAstryxGradientFadeProgress(offset, start, end);
      const opacity = 1 - applyAstryxGradientEasing(fadeProgress, easing);
      const colorProgress = applyAstryxGradientEasing(offset / 100, easing) * 100;
      return {
        offset,
        color: createAstryxGradientMixedColor(startColor, endColor, colorProgress),
        opacity,
      };
    });
}

function applyAstryxGradientEasing(progress: number, easing: AstryxGradientEasing): number {
  const t = Math.max(0, Math.min(1, progress));
  if (easing === 'ease-in') return t * t;
  if (easing === 'ease-out') return 1 - ((1 - t) * (1 - t));
  if (easing === 'ease-in-out') return t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2;
  if (easing === 'smoothstep') return t * t * (3 - 2 * t);
  if (easing === 'sine') return 0.5 - Math.cos(t * Math.PI) / 2;
  return t;
}

function clampAstryxGradientPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function clampAstryxGradientUnit(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function resolveAstryxGradientFadeProgress(offset: number, fadeStart: number, fadeEnd: number): number {
  if (fadeEnd === fadeStart) return 0;
  if (fadeEnd > fadeStart) {
    if (offset <= fadeStart) return 0;
    if (offset >= fadeEnd) return 1;
    return (offset - fadeStart) / (fadeEnd - fadeStart);
  }
  if (offset >= fadeStart) return 0;
  if (offset <= fadeEnd) return 1;
  return (fadeStart - offset) / (fadeStart - fadeEnd);
}

function createAstryxGradientMixedColor(startColor: string, endColor: string, progress: number): string {
  const clampedProgress = Math.max(0, Math.min(100, progress));
  if (clampedProgress <= 0) return startColor;
  if (clampedProgress >= 100) return endColor;
  return `color-mix(in srgb, ${endColor} ${formatAstryxGradientNumber(clampedProgress)}%, ${startColor})`;
}

function createAstryxGradientBackground({
  endX,
  endY,
  kind,
  repeatSize,
  rotation,
  startX,
  startY,
  stops,
}: {
  endX: number;
  endY: number;
  kind: AstryxGradientKind;
  repeatSize: number;
  rotation: number;
  startX: number;
  startY: number;
  stops: AstryxGradientStop[];
}): string {
  const angle = normalizeAstryxGradientAngle(getAstryxGradientCssAngle({ endX, endY, startX, startY }) + rotation);
  const cssStops = stops.map((stop) => (
    `${createAstryxGradientStopColor(stop.color, stop.opacity)} ${formatAstryxGradientNumber(stop.offset)}%`
  ));

  if (kind === 'radial' || kind === 'repeating-radial') {
    const radialStops = kind === 'repeating-radial'
      ? createAstryxGradientRepeatingStops(stops, repeatSize)
      : cssStops;
    const prefix = kind === 'repeating-radial' ? 'repeating-radial-gradient' : 'radial-gradient';
    return `${prefix}(circle at ${formatAstryxGradientNumber(clampAstryxGradientPercent(startX))}% ${formatAstryxGradientNumber(clampAstryxGradientPercent(startY))}%, ${radialStops.join(', ')})`;
  }

  if (kind === 'conic') {
    return `conic-gradient(from ${formatAstryxGradientNumber(angle)}deg at ${formatAstryxGradientNumber(clampAstryxGradientPercent(startX))}% ${formatAstryxGradientNumber(clampAstryxGradientPercent(startY))}%, ${cssStops.join(', ')})`;
  }

  if (kind === 'repeating-linear') {
    return `repeating-linear-gradient(${formatAstryxGradientNumber(angle)}deg, ${createAstryxGradientRepeatingStops(stops, repeatSize).join(', ')})`;
  }

  return `linear-gradient(${formatAstryxGradientNumber(angle)}deg, ${cssStops.join(', ')})`;
}

function createAstryxGradientStopColor(color: string, opacity: number): string {
  const clampedOpacity = clampAstryxGradientUnit(opacity);
  if (clampedOpacity >= 1) return color;
  if (clampedOpacity <= 0) return 'transparent';
  return `color-mix(in srgb, ${color} ${formatAstryxGradientNumber(clampedOpacity * 100)}%, transparent)`;
}

function createAstryxGradientRepeatingStops(
  stops: AstryxGradientStop[],
  repeatSize: number,
): string[] {
  const size = Math.max(1, Number.isFinite(repeatSize) ? repeatSize : 18);
  return stops.map((stop) => {
    const offset = (clampAstryxGradientPercent(stop.offset) / 100) * size;
    return `${createAstryxGradientStopColor(stop.color, stop.opacity)} ${formatAstryxGradientNumber(offset)}px`;
  });
}

function resolveAstryxGradientTokenColor({
  color,
  tokenCollection,
  tokenId,
}: {
  color: string;
  tokenCollection?: string;
  tokenId?: string;
}): string {
  const variableName = createAstryxGradientTokenVariableName(tokenCollection, tokenId);
  return variableName ? `var(${variableName})` : color;
}

function createAstryxGradientTokenVariableName(collectionId?: string, tokenId?: string): string | null {
  if (!collectionId?.trim() || !tokenId?.trim()) return null;
  return `--ds-token-${sanitizeAstryxGradientTokenSegment(collectionId)}-${sanitizeAstryxGradientTokenSegment(tokenId)}`;
}

function sanitizeAstryxGradientTokenSegment(value: string): string {
  const sanitized = value.trim().replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
  return sanitized || 'token';
}

function resolveAstryxGradientCssSize(value: string | undefined): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (trimmed === '') return undefined;
  if (/^[a-zA-Z][\w-]*$/.test(trimmed) && !ASTRYX_GRADIENT_CSS_SIZE_KEYWORDS.has(trimmed)) {
    return undefined;
  }
  return trimmed;
}

const ASTRYX_GRADIENT_CSS_SIZE_KEYWORDS = new Set([
  'auto',
  'fit-content',
  'inherit',
  'initial',
  'max-content',
  'min-content',
  'revert',
  'revert-layer',
  'stretch',
  'unset',
]);

function createAstryxGradientFadeMask({
  easing,
  endX,
  endY,
  fadeEnd,
  fadeStart,
  rotation,
  startX,
  startY,
}: {
  easing: AstryxGradientEasing;
  endX: number;
  endY: number;
  fadeEnd: number;
  fadeStart: number;
  rotation: number;
  startX: number;
  startY: number;
}): string {
  const start = clampAstryxGradientPercent(fadeStart);
  const end = clampAstryxGradientPercent(fadeEnd);
  const angle = normalizeAstryxGradientAngle(getAstryxGradientCssAngle({ endX, endY, startX, startY }) + rotation);
  const offsets = new Set<number>([0, start, end, 100]);
  const steps = 12;

  for (let index = 1; index < steps; index += 1) {
    offsets.add((index / steps) * 100);
  }

  const stops = Array.from(offsets)
    .sort((left, right) => left - right)
    .map((offset) => {
      const fadeProgress = resolveAstryxGradientFadeProgress(offset, start, end);
      const opacity = 1 - applyAstryxGradientEasing(fadeProgress, easing);
      return `rgba(0, 0, 0, ${formatAstryxGradientNumber(opacity)}) ${formatAstryxGradientNumber(offset)}%`;
    });

  return `linear-gradient(${formatAstryxGradientNumber(angle)}deg, ${stops.join(', ')})`;
}

function getAstryxGradientCssAngle({
  endX,
  endY,
  startX,
  startY,
}: {
  endX: number;
  endY: number;
  startX: number;
  startY: number;
}): number {
  const dx = clampAstryxGradientPercent(endX) - clampAstryxGradientPercent(startX);
  const dy = clampAstryxGradientPercent(endY) - clampAstryxGradientPercent(startY);
  if (dx === 0 && dy === 0) return 180;
  return (Math.atan2(dy, dx) * 180) / Math.PI + 90;
}

function normalizeAstryxGradientAngle(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return ((value % 360) + 360) % 360;
}

function formatAstryxGradientNumber(value: number): string {
  return Number(value.toFixed(3)).toString();
}
