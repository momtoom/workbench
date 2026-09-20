import { SideNavItem } from '@astryxdesign/core/SideNav';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { AstryxBadge } from './AstryxBadge';
import { AstryxIcon, type AstryxIconValue } from './AstryxIcon';
import { cx } from './classNames';

export type AstryxSideNavItemIcon = AstryxIconValue | 'none';
export type AstryxSideNavItemSize = 'sm' | 'md' | 'lg';
export type AstryxSideNavItemEmphasis = 'default' | 'button';

type AstryxSideNavItemRootProps = Omit<
  ComponentPropsWithoutRef<typeof SideNavItem>,
  | 'children'
  | 'className'
  | 'collapsible'
  | 'endContent'
  | 'href'
  | 'icon'
  | 'isDisabled'
  | 'isSelected'
  | 'label'
  | 'selectedIcon'
  | 'size'
>;

export interface AstryxSideNavItemProps extends AstryxSideNavItemRootProps {
  label?: string;
  href?: string;
  icon?: AstryxSideNavItemIcon;
  isSelected?: boolean;
  isDisabled?: boolean;
  collapsible?: boolean;
  defaultIsCollapsed?: boolean;
  emphasis?: AstryxSideNavItemEmphasis;
  size?: AstryxSideNavItemSize;
  endLabel?: string;
  className?: string;
  children?: ReactNode;
}

export function AstryxSideNavItem({
  label = 'Overview',
  href = '#',
  icon = 'none',
  isSelected = false,
  isDisabled = false,
  collapsible = false,
  defaultIsCollapsed = false,
  emphasis = 'default',
  size = 'md',
  endLabel,
  className,
  children,
  ...rootProps
}: AstryxSideNavItemProps) {
  const resolvedIcon = typeof icon === 'string' && icon.trim() ? icon : 'none';
  const endContent = endLabel
    ? emphasis === 'button'
      ? <AstryxBadge className="astryx-wb-side-nav-item-end-badge" label={endLabel} variant="neutral" />
      : endLabel
    : undefined;

  return (
    <div
      {...rootProps}
      className={cx('astryx-wb-side-nav-item', className)}
      data-astryx-wb-side-nav-item-emphasis={emphasis}
      data-astryx-wb-side-nav-item-selected={isSelected ? 'true' : undefined}
    >
      <SideNavItem
        collapsible={collapsible ? { defaultIsCollapsed } : false}
        endContent={endContent}
        href={href || undefined}
        icon={resolvedIcon === 'none' ? undefined : <AstryxIcon icon={resolvedIcon} size="sm" />}
        isDisabled={isDisabled}
        isSelected={isSelected}
        label={label}
        size={size}
      >
        {children}
      </SideNavItem>
    </div>
  );
}

AstryxSideNavItem.displayName = 'AstryxSideNavItem';
