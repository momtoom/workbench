import { NavHeadingMenuItem } from '@astryxdesign/core/NavMenu';
import type { ComponentPropsWithoutRef } from 'react';
import { AstryxIcon, type AstryxIconValue } from './AstryxIcon';
import { cx } from './classNames';

type AstryxNavHeadingMenuItemRootProps = Omit<
  ComponentPropsWithoutRef<typeof NavHeadingMenuItem>,
  'className' | 'description' | 'href' | 'icon' | 'isDisabled' | 'label' | 'onClick'
>;

export interface AstryxNavHeadingMenuItemProps extends AstryxNavHeadingMenuItemRootProps {
  label?: string;
  description?: string;
  href?: string;
  icon?: AstryxIconValue | 'none';
  isDisabled?: boolean;
  className?: string;
}

export function AstryxNavHeadingMenuItem({
  label = 'Dashboard',
  description,
  href,
  icon = 'none',
  isDisabled = false,
  className,
  ...rootProps
}: AstryxNavHeadingMenuItemProps) {
  return (
    <NavHeadingMenuItem
      {...rootProps}
      className={cx('astryx-wb-nav-heading-menu-item', className)}
      description={description || undefined}
      href={href || undefined}
      icon={icon === 'none' ? undefined : <AstryxIcon icon={icon} size="sm" />}
      isDisabled={isDisabled}
      label={label}
      onClick={href ? undefined : () => undefined}
    />
  );
}

AstryxNavHeadingMenuItem.displayName = 'AstryxNavHeadingMenuItem';
