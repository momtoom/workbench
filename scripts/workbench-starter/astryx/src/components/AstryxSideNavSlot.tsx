import { useSideNavCollapse } from '@astryxdesign/core/SideNav';
import { Children, isValidElement, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { AstryxSideNavItem } from './AstryxSideNavItem';
import { isAstryxElementType } from './AstryxWorkbenchChild';
import { cx } from './classNames';

export type AstryxSideNavSlotPosition = 'topContent' | 'footer' | 'footerIcons';
export type AstryxSideNavSlotCollapsedBehavior = 'auto' | 'hide' | 'show';

type AstryxSideNavSlotRootProps = Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'className'>;

export interface AstryxSideNavSlotProps extends AstryxSideNavSlotRootProps {
  slot?: AstryxSideNavSlotPosition;
  collapsedBehavior?: AstryxSideNavSlotCollapsedBehavior;
  className?: string;
  children?: ReactNode;
}

export function AstryxSideNavSlot({
  slot = 'topContent',
  collapsedBehavior = 'auto',
  className,
  children,
  ...rootProps
}: AstryxSideNavSlotProps) {
  const { isCollapsed, isCollapsible } = useSideNavCollapse();
  const containsNavigationItems = slot === 'topContent' && containsAstryxSideNavItem(children);
  const resolvedCollapsedBehavior =
    collapsedBehavior === 'auto' ? (slot === 'footerIcons' || containsNavigationItems ? 'show' : 'hide') : collapsedBehavior;
  const isCollapsedWithinSideNav = isCollapsible && isCollapsed;

  return (
    <div
      {...rootProps}
      className={cx('astryx-wb-side-nav-slot', className)}
      data-astryx-wb-side-nav-slot-content={containsNavigationItems ? 'navigation' : undefined}
      data-astryx-wb-side-nav-slot={slot}
      data-astryx-wb-side-nav-slot-collapsed-behavior={resolvedCollapsedBehavior}
      data-astryx-wb-side-nav-collapsed={isCollapsedWithinSideNav ? 'true' : 'false'}
    >
      {children}
    </div>
  );
}

AstryxSideNavSlot.displayName = 'AstryxSideNavSlot';

function containsAstryxSideNavItem(children: ReactNode): boolean {
  let contains = false;
  Children.forEach(children, (child) => {
    if (contains) return;
    if (isAstryxElementType(child, AstryxSideNavItem, 'AstryxSideNavItem')) {
      contains = true;
      return;
    }
    if (!isValidElement(child)) return;
    const props = child.props as { children?: ReactNode };
    if (props.children && containsAstryxSideNavItem(props.children)) contains = true;
  });
  return contains;
}
