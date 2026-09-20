import { TopNavItem } from '@astryxdesign/core/TopNav';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { AstryxIcon, type AstryxIconValue } from './AstryxIcon';
import { cx } from './classNames';

export type AstryxTopNavItemIcon = AstryxIconValue | 'none';
export type AstryxTopNavItemSize = 'sm' | 'md' | 'lg';

type AstryxTopNavItemRootProps = Omit<
  ComponentPropsWithoutRef<typeof TopNavItem>,
  'children' | 'className' | 'href' | 'icon' | 'isDisabled' | 'isIconOnly' | 'isSelected' | 'label' | 'size'
>;

export interface AstryxTopNavItemProps extends AstryxTopNavItemRootProps {
  label?: string;
  href?: string;
  icon?: AstryxTopNavItemIcon;
  isSelected?: boolean;
  isDisabled?: boolean;
  isIconOnly?: boolean;
  size?: AstryxTopNavItemSize;
  className?: string;
  children?: ReactNode;
}

export function AstryxTopNavItem({
  label = 'Overview',
  href = '#',
  icon = 'none',
  isSelected = false,
  isDisabled = false,
  isIconOnly = false,
  size = 'md',
  className,
  children,
  ...rootProps
}: AstryxTopNavItemProps) {
  return (
    <TopNavItem
      {...rootProps}
      className={cx('astryx-wb-top-nav-item', className)}
      href={href || undefined}
      icon={icon === 'none' ? undefined : <AstryxIcon icon={icon} size="sm" />}
      isDisabled={isDisabled}
      isIconOnly={isIconOnly}
      isSelected={isSelected}
      label={label}
      size={size}
    >
      {children}
    </TopNavItem>
  );
}

AstryxTopNavItem.displayName = 'AstryxTopNavItem';
