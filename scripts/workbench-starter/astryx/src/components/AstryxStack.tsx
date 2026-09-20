import { Stack } from '@astryxdesign/core/Stack';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cx } from './classNames';

export type AstryxStackDirection = 'vertical' | 'horizontal';
export type AstryxStackGap =
  | 0
  | 0.5
  | 1
  | 1.5
  | 2
  | 3
  | 4
  | 5
  | 6
  | 8
  | 10
  | 'none'
  | 'xs'
  | 'sm'
  | 'md'
  | 'lg'
  | 'xl'
  | '2xl';
export type AstryxStackAlign = 'start' | 'center' | 'end' | 'stretch';
export type AstryxStackJustify = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
export type AstryxStackWrap = 'nowrap' | 'wrap' | 'wrap-reverse';
export type AstryxStackElement = 'div' | 'main' | 'section' | 'article' | 'aside' | 'header' | 'footer' | 'nav';
export type AstryxStackTheme = 'neutral' | 'butter' | 'chocolate' | 'gothic' | 'matcha' | 'stone' | 'y2k';
export type AstryxStackColorMode = 'auto' | 'light' | 'dark';
export type AstryxStackPadding = AstryxStackGap;

type AstryxStackRootProps = Omit<
  ComponentPropsWithoutRef<typeof Stack>,
  | 'align'
  | 'as'
  | 'children'
  | 'className'
  | 'direction'
  | 'gap'
  | 'hAlign'
  | 'height'
  | 'justify'
  | 'padding'
  | 'paddingBlock'
  | 'paddingInline'
  | 'vAlign'
  | 'width'
  | 'wrap'
>;

export interface AstryxStackProps extends AstryxStackRootProps {
  direction?: AstryxStackDirection;
  gap?: AstryxStackGap;
  align?: AstryxStackAlign;
  justify?: AstryxStackJustify;
  wrap?: AstryxStackWrap;
  as?: AstryxStackElement;
  theme?: AstryxStackTheme;
  colorMode?: AstryxStackColorMode;
  padding?: AstryxStackPadding;
  paddingInline?: AstryxStackPadding;
  paddingBlock?: AstryxStackPadding;
  isScrollable?: boolean;
  width?: string;
  height?: string;
  className?: string;
  children?: ReactNode;
}

export function AstryxStack({
  direction = 'vertical',
  gap = 4,
  align = 'stretch',
  justify = 'start',
  wrap = 'nowrap',
  as = 'div',
  theme,
  colorMode,
  padding = 'none',
  paddingInline,
  paddingBlock,
  isScrollable = false,
  width,
  height,
  className,
  children,
  style,
  ...rootProps
}: AstryxStackProps) {
  return (
    <Stack
      {...rootProps}
      align={align}
      as={as}
      className={cx('astryx-wb-stack', className)}
      data-astryx-media={colorMode === 'auto' ? undefined : colorMode}
      data-astryx-theme={theme}
      data-wb-token-modes={theme ? `astryx-theme=${theme}` : undefined}
      direction={direction}
      gap={resolveAstryxStackGap(gap)}
      height={height}
      isScrollable={isScrollable}
      justify={justify}
      padding={resolveAstryxStackGap(padding)}
      paddingBlock={paddingBlock == null ? undefined : resolveAstryxStackGap(paddingBlock)}
      paddingInline={paddingInline == null ? undefined : resolveAstryxStackGap(paddingInline)}
      style={style}
      width={width}
      wrap={wrap}
    >
      {children}
    </Stack>
  );
}

function resolveAstryxStackGap(gap: AstryxStackGap): 0 | 0.5 | 1 | 1.5 | 2 | 3 | 4 | 5 | 6 | 8 | 10 {
  if (typeof gap === 'number') return gap;
  if (gap === 'none') return 0;
  if (gap === 'xs') return 1;
  if (gap === 'sm') return 2;
  if (gap === 'md') return 4;
  if (gap === 'lg') return 6;
  if (gap === 'xl') return 8;
  return 10;
}
