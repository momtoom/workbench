import { Heading } from '@astryxdesign/core/Heading';
import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from 'react';

type ResolvedHeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export type AstryxHeadingLevel =
  | ResolvedHeadingLevel
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | 'Level 1'
  | 'Level 2'
  | 'Level 3'
  | 'Level 4'
  | 'Level 5'
  | 'Level 6';
export type AstryxHeadingType = 'default' | 'display-1' | 'display-2' | 'display-3';
export type AstryxHeadingColor =
  | 'primary'
  | 'secondary'
  | 'disabled'
  | 'placeholder'
  | 'accent'
  | 'inherit'
  | 'inverted'
  | 'static-light'
  | 'static-dark';
export type AstryxHeadingDisplay = 'inline' | 'block';
export type AstryxHeadingWrap = 'wrap' | 'nowrap' | 'balance' | 'pretty';
export type AstryxHeadingJustify = 'start' | 'center' | 'end';

type AstryxHeadingRootProps = Omit<
  ComponentPropsWithoutRef<typeof Heading>,
  | 'accessibilityLevel'
  | 'children'
  | 'className'
  | 'color'
  | 'display'
  | 'hasStrikethrough'
  | 'justify'
  | 'level'
  | 'maxLines'
  | 'textWrap'
  | 'type'
>;

export interface AstryxHeadingProps extends AstryxHeadingRootProps {
  children?: ReactNode;
  level?: AstryxHeadingLevel;
  type?: AstryxHeadingType;
  accessibilityLevel?: AstryxHeadingLevel;
  color?: AstryxHeadingColor;
  display?: AstryxHeadingDisplay;
  maxLines?: number;
  wrap?: AstryxHeadingWrap;
  justify?: AstryxHeadingJustify;
  className?: string;
}

export function AstryxHeading({
  children = 'Astryx heading',
  level = 2,
  type = 'default',
  accessibilityLevel,
  color = 'primary',
  display = 'block',
  maxLines = 0,
  wrap = 'wrap',
  justify = 'start',
  className,
  style,
  ...rootProps
}: AstryxHeadingProps) {
  const resolvedLevel = getAstryxHeadingLevel(level, 2);
  const resolvedAccessibilityLevel = accessibilityLevel
    ? getAstryxHeadingLevel(accessibilityLevel, resolvedLevel)
    : undefined;
  const resolvedMaxLines = Math.max(0, Math.floor(maxLines || 0));
  const resolvedColor = getAstryxHeadingCoreColor(color);
  const staticColor = getAstryxHeadingStaticColorValue(color);
  const resolvedStyle = staticColor ? ({ ...style, color: staticColor } satisfies CSSProperties) : style;
  const { hasStrikethrough: _ignoredHasStrikethrough, truncate: _ignoredTruncate, ...passthroughProps } =
    rootProps as AstryxHeadingRootProps & {
      hasStrikethrough?: boolean;
      truncate?: boolean;
    };

  return (
    <Heading
      {...passthroughProps}
      accessibilityLevel={resolvedAccessibilityLevel}
      className={className}
      color={resolvedColor}
      display={display}
      justify={justify}
      level={resolvedLevel}
      maxLines={resolvedMaxLines}
      style={resolvedStyle}
      textWrap={wrap}
      type={type === 'default' ? undefined : type}
    >
      {children}
    </Heading>
  );
}

function getAstryxHeadingLevel(value: AstryxHeadingLevel, fallback: ResolvedHeadingLevel): ResolvedHeadingLevel {
  if (typeof value === 'number' && isHeadingLevel(value)) return value;
  if (typeof value === 'string') {
    const direct = Number(value.trim());
    if (isHeadingLevel(direct)) return direct;

    const labeled = value.match(/[1-6]/)?.[0];
    const parsedLabeled = labeled ? Number(labeled) : NaN;
    if (isHeadingLevel(parsedLabeled)) return parsedLabeled;
  }
  return fallback;
}

function isHeadingLevel(value: number): value is ResolvedHeadingLevel {
  return Number.isInteger(value) && value >= 1 && value <= 6;
}

function getAstryxHeadingCoreColor(
  color: AstryxHeadingColor,
): Exclude<AstryxHeadingColor, 'inverted' | 'static-light' | 'static-dark'> {
  return color === 'inverted' || color === 'static-light' || color === 'static-dark' ? 'inherit' : color;
}

function getAstryxHeadingStaticColorValue(color: AstryxHeadingColor): string | undefined {
  if (color === 'inverted') return 'light-dark(var(--color-on-light), var(--color-on-dark))';
  if (color === 'static-light') return 'var(--color-on-light)';
  if (color === 'static-dark') return 'var(--color-on-dark)';
  return undefined;
}
