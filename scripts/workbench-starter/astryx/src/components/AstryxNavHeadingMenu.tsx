import { NavHeadingMenu } from '@astryxdesign/core/NavMenu';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cx } from './classNames';
import { useStableAstryxChildren } from './stableChildren';

export type AstryxNavHeadingMenuSize = 'sm' | 'md' | 'lg';
type RootProps = Omit<ComponentPropsWithoutRef<typeof NavHeadingMenu>, 'children' | 'className' | 'minWidth' | 'size'>;
export interface AstryxNavHeadingMenuProps extends RootProps {
  children?: ReactNode;
  size?: AstryxNavHeadingMenuSize;
  minWidth?: string;
  className?: string;
}
export function AstryxNavHeadingMenu({
  children,
  size = 'md',
  minWidth = '',
  className,
  ...rootProps
}: AstryxNavHeadingMenuProps) {
  const stableChildren = useStableAstryxChildren(children);
  return (
    <NavHeadingMenu
      {...rootProps}
      className={cx('astryx-wb-nav-heading-menu', className)}
      minWidth={minWidth ? resolveSize(minWidth) : undefined}
      size={size}
    >
      {stableChildren}
    </NavHeadingMenu>
  );
}
function resolveSize(value: string): number | string {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : value;
}
