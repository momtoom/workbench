import { ClickableCard } from '@astryxdesign/core/ClickableCard';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import type { AstryxCardPadding, AstryxCardVariant } from './AstryxCard';

type AstryxClickableCardRootProps = Omit<
  ComponentPropsWithoutRef<typeof ClickableCard>,
  | 'children'
  | 'className'
  | 'height'
  | 'href'
  | 'isDisabled'
  | 'label'
  | 'maxWidth'
  | 'onClick'
  | 'padding'
  | 'target'
  | 'variant'
  | 'width'
>;

export interface AstryxClickableCardProps extends AstryxClickableCardRootProps {
  label?: string;
  href?: string;
  target?: string;
  padding?: AstryxCardPadding;
  variant?: AstryxCardVariant;
  width?: string;
  height?: string;
  maxWidth?: string;
  isDisabled?: boolean;
  isClickable?: boolean;
  className?: string;
  children?: ReactNode;
}

export function AstryxClickableCard({
  label = 'Open card',
  href,
  target,
  padding = 4,
  variant = 'default',
  width,
  height,
  maxWidth,
  isDisabled = false,
  isClickable = true,
  className,
  children,
  ...rootProps
}: AstryxClickableCardProps) {
  return (
    <ClickableCard
      {...rootProps}
      className={className}
      height={height}
      href={href || undefined}
      isDisabled={isDisabled}
      label={label}
      maxWidth={maxWidth}
      onClick={!href && isClickable ? () => undefined : undefined}
      padding={resolveAstryxCardPadding(padding)}
      target={target}
      variant={resolveAstryxCardVariant(variant)}
      width={width}
    >
      {children}
    </ClickableCard>
  );
}

function resolveAstryxCardPadding(padding: AstryxCardPadding): 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 {
  if (padding === 0.5) return 1;
  if (padding === 1.5) return 2;
  if (typeof padding === 'number') return padding;
  if (padding === 'none') return 0;
  if (padding === 'xs') return 2;
  if (padding === 'sm') return 3;
  if (padding === 'md') return 4;
  if (padding === 'lg') return 6;
  if (padding === 'xl') return 8;
  return 10;
}

function resolveAstryxCardVariant(variant: AstryxCardVariant) {
  return variant === 'subtle' ? 'muted' : variant;
}
