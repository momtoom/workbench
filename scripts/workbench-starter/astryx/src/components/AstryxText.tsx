import { Text } from '@astryxdesign/core/Text';
import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from 'react';
import { cx } from './classNames';

export type AstryxTextType =
  | 'body'
  | 'large'
  | 'label'
  | 'supporting'
  | 'code'
  | 'display-1'
  | 'display-2'
  | 'display-3'
  | 'inherit';
export type AstryxTextSize =
  | '4xs'
  | '3xs'
  | '2xs'
  | 'xsm'
  | 'xs'
  | 'sm'
  | 'base'
  | 'lg'
  | 'xl'
  | '2xl'
  | '3xl'
  | '4xl'
  | '5xl'
  | '6xl'
  | '7xl'
  | '8xl'
  | '9xl';
export type AstryxTextColor =
  | 'primary'
  | 'secondary'
  | 'disabled'
  | 'placeholder'
  | 'accent'
  | 'inherit'
  | 'inverted'
  | 'static-light'
  | 'static-dark';
export type AstryxTextWeight = 'normal' | 'medium' | 'semibold' | 'bold';
export type AstryxTextDisplay = 'inline' | 'block';
export type AstryxTextElement = 'span' | 'p' | 'div' | 'label' | 'h1' | 'h2' | 'h3';
export type AstryxTextWrap = 'wrap' | 'nowrap' | 'balance' | 'pretty';
export type AstryxTextJustify = 'start' | 'center' | 'end';
export type AstryxTextLineHeight = 'inherit' | 'tight' | 'snug' | 'normal' | 'relaxed' | 'loose';
export type AstryxTextWordBreak = 'normal' | 'break-all' | 'keep-all' | 'break-word';

type AstryxTextExtendedSize = Extract<AstryxTextSize, '5xl' | '6xl' | '7xl' | '8xl' | '9xl'>;
export type AstryxTextCoreSize = Exclude<AstryxTextSize, AstryxTextExtendedSize>;

const ASTRYX_TEXT_EXTENDED_FONT_SIZES = {
  '5xl': 'var(--font-size-5xl, 2.625rem)',
  '6xl': 'var(--font-size-6xl, 3.75rem)',
  '7xl': 'var(--font-size-7xl, 4.5rem)',
  '8xl': 'var(--font-size-8xl, 6rem)',
  '9xl': 'var(--font-size-9xl, 8rem)',
} as const satisfies Record<AstryxTextExtendedSize, string>;

type AstryxTextRootProps = Omit<
  ComponentPropsWithoutRef<typeof Text>,
  | 'as'
  | 'children'
  | 'className'
  | 'color'
  | 'display'
  | 'hasCapsize'
  | 'hasStrikethrough'
  | 'hasTabularNumbers'
  | 'justify'
  | 'maxLines'
  | 'size'
  | 'textWrap'
  | 'type'
  | 'wordBreak'
  | 'weight'
>;

export interface AstryxTextProps extends AstryxTextRootProps {
  children?: ReactNode;
  type?: AstryxTextType;
  size?: AstryxTextSize;
  color?: AstryxTextColor;
  weight?: AstryxTextWeight;
  display?: AstryxTextDisplay;
  as?: AstryxTextElement;
  maxLines?: number;
  wrap?: AstryxTextWrap;
  textWrap?: AstryxTextWrap;
  justify?: AstryxTextJustify;
  lineHeight?: AstryxTextLineHeight;
  wordBreak?: AstryxTextWordBreak;
  hasCapsize?: boolean;
  hasTabularNumbers?: boolean;
  className?: string;
}

export function AstryxText({
  children = 'Astryx text',
  type = 'body',
  size,
  color = 'inherit',
  weight,
  display,
  as = 'span',
  maxLines = 0,
  wrap,
  textWrap,
  justify = 'start',
  lineHeight = 'inherit',
  wordBreak,
  hasCapsize,
  hasTabularNumbers = false,
  className,
  style,
  ...rootProps
}: AstryxTextProps) {
  const fontSize = size ? getAstryxTextSizeFontSize(size) : undefined;
  const textSize = size ? getAstryxTextSize(size) : undefined;
  const resolvedLineHeight = getAstryxTextLineHeightValue(lineHeight);
  const staticColorClassName = getAstryxTextStaticColorClassName(color);
  const resolvedStyle = fontSize || resolvedLineHeight || wordBreak || style
    ? ({ fontSize, lineHeight: resolvedLineHeight, wordBreak, ...style } satisfies CSSProperties)
    : style;
  const resolvedMaxLines = Math.max(0, Math.floor(maxLines || 0));
  const resolvedWrap = wrap ?? textWrap;
  const resolvedColor = getAstryxTextCoreColor(color);
  const hasTruncation = resolvedMaxLines > 0 || hasTruncateUtility(className);
  const resolvedHasCapsize = hasTruncation ? false : (hasCapsize ?? type === 'label');
  const { hasStrikethrough: _ignoredHasStrikethrough, truncate: _ignoredTruncate, ...passthroughProps } =
    rootProps as AstryxTextRootProps & {
      hasStrikethrough?: boolean;
      truncate?: boolean;
    };

  return (
    <Text
      {...passthroughProps}
      as={as}
      className={cx(staticColorClassName, className)}
      color={resolvedColor}
      display={display}
      hasCapsize={resolvedHasCapsize}
      hasTabularNumbers={hasTabularNumbers}
      justify={justify}
      maxLines={resolvedMaxLines}
      size={textSize}
      style={resolvedStyle}
      textWrap={resolvedWrap}
      type={type}
      weight={weight}
    >
      {children}
    </Text>
  );
}

function hasTruncateUtility(className: string | undefined): boolean {
  return className?.split(/\s+/).some((token) => token.replace(/^!/, '').split(':').pop() === 'truncate') ?? false;
}

function getAstryxTextSizeFontSize(size: AstryxTextSize): string {
  if (isAstryxTextExtendedSize(size)) return ASTRYX_TEXT_EXTENDED_FONT_SIZES[size];
  const tokenSize = size === 'xsm' || size === 'xs' ? 'xs' : size;
  return `var(--font-size-${tokenSize})`;
}

function getAstryxTextSize(
  size: AstryxTextSize,
): Exclude<AstryxTextSize, 'xs' | AstryxTextExtendedSize> | undefined {
  if (isAstryxTextExtendedSize(size)) return undefined;
  return size === 'xs' ? 'xsm' : size;
}

function isAstryxTextExtendedSize(size: AstryxTextSize): size is AstryxTextExtendedSize {
  return size in ASTRYX_TEXT_EXTENDED_FONT_SIZES;
}

function getAstryxTextLineHeightValue(lineHeight: AstryxTextLineHeight): string | undefined {
  if (lineHeight === 'inherit') return undefined;
  if (lineHeight === 'tight') return '1';
  if (lineHeight === 'snug') return '1.2';
  if (lineHeight === 'normal') return '1.5';
  if (lineHeight === 'relaxed') return '1.65';
  return '1.8';
}

function getAstryxTextCoreColor(
  color: AstryxTextColor,
): Exclude<AstryxTextColor, 'inverted' | 'static-light' | 'static-dark'> {
  return color === 'inverted' || color === 'static-light' || color === 'static-dark' ? 'inherit' : color;
}

function getAstryxTextStaticColorClassName(color: AstryxTextColor): string | undefined {
  if (color === 'inverted') return 'astryx-wb-text--inverted';
  if (color === 'static-light') return 'astryx-wb-text--static-light';
  if (color === 'static-dark') return 'astryx-wb-text--static-dark';
  return undefined;
}
