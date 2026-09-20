import { LayoutContent } from '@astryxdesign/core/Layout';
import type { AriaRole, ComponentPropsWithoutRef, ReactNode } from 'react';
import { cx } from './classNames';
import { resolveAstryxLayoutPadding, type AstryxLayoutPadding } from './AstryxLayoutHeader';

type AstryxLayoutContentRootProps = Omit<
  ComponentPropsWithoutRef<typeof LayoutContent>,
  'children' | 'className' | 'isScrollable' | 'label' | 'padding' | 'role'
>;

export interface AstryxLayoutContentProps extends AstryxLayoutContentRootProps {
  isScrollable?: boolean;
  padding?: AstryxLayoutPadding;
  label?: string;
  role?: AriaRole;
  className?: string;
  children?: ReactNode;
}

export function AstryxLayoutContent({
  isScrollable = true,
  padding = 'inherit',
  label,
  role,
  className,
  children,
  ...rootProps
}: AstryxLayoutContentProps) {
  return (
    <LayoutContent
      {...rootProps}
      className={cx('astryx-wb-layout-content', className)}
      isScrollable={isScrollable}
      label={label || undefined}
      padding={resolveAstryxLayoutPadding(padding)}
      role={role}
    >
      {children}
    </LayoutContent>
  );
}

AstryxLayoutContent.displayName = 'AstryxLayoutContent';
