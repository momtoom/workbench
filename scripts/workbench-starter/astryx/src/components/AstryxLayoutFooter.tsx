import { LayoutFooter } from '@astryxdesign/core/Layout';
import type { AriaRole, ComponentPropsWithoutRef, ReactNode } from 'react';
import { cx } from './classNames';
import { resolveAstryxLayoutPadding, type AstryxLayoutPadding } from './AstryxLayoutHeader';

type AstryxLayoutFooterRootProps = Omit<
  ComponentPropsWithoutRef<typeof LayoutFooter>,
  'children' | 'className' | 'hasDivider' | 'height' | 'label' | 'padding' | 'role'
>;

export interface AstryxLayoutFooterProps extends AstryxLayoutFooterRootProps {
  hasDivider?: boolean;
  height?: string;
  padding?: AstryxLayoutPadding;
  label?: string;
  role?: AriaRole;
  className?: string;
  children?: ReactNode;
}

export function AstryxLayoutFooter({
  hasDivider = true,
  height,
  padding = 'inherit',
  label,
  role,
  className,
  children,
  ...rootProps
}: AstryxLayoutFooterProps) {
  return (
    <LayoutFooter
      {...rootProps}
      className={cx('astryx-wb-layout-footer', className)}
      hasDivider={hasDivider}
      height={height || undefined}
      label={label || undefined}
      padding={resolveAstryxLayoutPadding(padding)}
      role={role}
    >
      {children}
    </LayoutFooter>
  );
}

AstryxLayoutFooter.displayName = 'AstryxLayoutFooter';
