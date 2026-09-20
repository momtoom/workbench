import { useSideNavCollapse } from '@astryxdesign/core/SideNav';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cx } from './classNames';

export type AstryxSideNavCollapseWrapperBehavior = 'hide' | 'show';

type AstryxSideNavCollapseWrapperRootProps = Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'className'>;

export interface AstryxSideNavCollapseWrapperProps extends AstryxSideNavCollapseWrapperRootProps {
  behavior?: AstryxSideNavCollapseWrapperBehavior;
  className?: string;
  children?: ReactNode;
}

export function AstryxSideNavCollapseWrapper({
  behavior = 'hide',
  className,
  children,
  ...rootProps
}: AstryxSideNavCollapseWrapperProps) {
  const { isCollapsed, isCollapsible } = useSideNavCollapse();
  const isCollapsedWithinSideNav = isCollapsible && isCollapsed;

  return (
    <div
      {...rootProps}
      className={cx('astryx-wb-side-nav-collapse-wrapper', className)}
      data-astryx-wb-side-nav-collapse-behavior={behavior}
      data-astryx-wb-side-nav-collapsed={isCollapsedWithinSideNav ? 'true' : 'false'}
    >
      {children}
    </div>
  );
}

AstryxSideNavCollapseWrapper.displayName = 'AstryxSideNavCollapseWrapper';
