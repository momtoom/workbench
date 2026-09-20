import { Section } from '@astryxdesign/core/Section';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cx } from './classNames';
import type { AstryxStackPadding } from './AstryxStack';

export type AstryxSectionVariant = 'section' | 'transparent' | 'muted';
export type AstryxSectionPadding = AstryxStackPadding | 'inherit';

type AstryxSectionRootProps = Omit<
  ComponentPropsWithoutRef<typeof Section>,
  | 'children'
  | 'className'
  | 'dividers'
  | 'height'
  | 'maxWidth'
  | 'minHeight'
  | 'padding'
  | 'paddingBlock'
  | 'variant'
  | 'width'
>;

export interface AstryxSectionProps extends AstryxSectionRootProps {
  variant?: AstryxSectionVariant;
  padding?: AstryxSectionPadding;
  paddingBlock?: AstryxSectionPadding;
  dividerTop?: boolean;
  dividerBottom?: boolean;
  dividerStart?: boolean;
  dividerEnd?: boolean;
  bleed?: boolean;
  width?: string;
  height?: string;
  maxWidth?: string;
  minHeight?: string;
  className?: string;
  children?: ReactNode;
}

export function AstryxSection({
  variant = 'section',
  padding = 'md',
  paddingBlock = 'inherit',
  dividerTop = false,
  dividerBottom = false,
  dividerStart = false,
  dividerEnd = false,
  bleed = false,
  width,
  height,
  maxWidth,
  minHeight,
  className,
  children,
  ...rootProps
}: AstryxSectionProps) {
  const dividers = [
    dividerTop ? 'top' : null,
    dividerBottom ? 'bottom' : null,
    dividerStart ? 'start' : null,
    dividerEnd ? 'end' : null,
  ].filter(Boolean) as Array<'top' | 'bottom' | 'start' | 'end'>;

  return (
    <Section
      {...rootProps}
      className={cx('astryx-wb-section', className)}
      data-astryx-wb-section-bleed={bleed ? 'true' : undefined}
      dividers={dividers.length ? dividers : undefined}
      height={height || undefined}
      maxWidth={maxWidth || undefined}
      minHeight={minHeight || undefined}
      padding={resolveAstryxSectionPadding(padding)}
      paddingBlock={resolveAstryxSectionPadding(paddingBlock)}
      variant={variant}
      width={width || undefined}
    >
      {children}
    </Section>
  );
}

function resolveAstryxSectionPadding(
  padding: AstryxSectionPadding | 'inherit',
): 0 | 0.5 | 1 | 1.5 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | undefined {
  if (padding === 'inherit') return undefined;
  if (typeof padding === 'number') return padding;
  if (padding === 'none') return 0;
  if (padding === 'xs') return 1;
  if (padding === 'sm') return 2;
  if (padding === 'md') return 4;
  if (padding === 'lg') return 6;
  if (padding === 'xl') return 8;
  return 10;
}
