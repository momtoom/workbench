import { LayoutHeader } from '@astryxdesign/core/Layout';
import type { AriaRole, ComponentPropsWithoutRef, ReactNode } from 'react';
import { cx } from './classNames';
import type { AstryxStackGap } from './AstryxStack';

export type AstryxLayoutPadding = AstryxStackGap | 'inherit';

type AstryxLayoutHeaderRootProps = Omit<
  ComponentPropsWithoutRef<typeof LayoutHeader>,
  'children' | 'className' | 'hasDivider' | 'height' | 'label' | 'padding' | 'role'
>;

export interface AstryxLayoutHeaderProps extends AstryxLayoutHeaderRootProps {
  hasDivider?: boolean;
  height?: string;
  padding?: AstryxLayoutPadding;
  label?: string;
  role?: AriaRole;
  className?: string;
  children?: ReactNode;
}

export function AstryxLayoutHeader({
  hasDivider = true,
  height,
  padding = 'inherit',
  label,
  role,
  className,
  children,
  ...rootProps
}: AstryxLayoutHeaderProps) {
  return (
    <LayoutHeader
      {...rootProps}
      className={cx('astryx-wb-layout-header', className)}
      hasDivider={hasDivider}
      height={height || undefined}
      label={label || undefined}
      padding={resolveAstryxLayoutPadding(padding)}
      role={role}
    >
      {children}
    </LayoutHeader>
  );
}

AstryxLayoutHeader.displayName = 'AstryxLayoutHeader';

export function resolveAstryxLayoutPadding(
  padding: AstryxLayoutPadding,
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
