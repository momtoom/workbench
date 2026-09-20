import { NavIcon } from '@astryxdesign/core/NavIcon';
import type { ComponentPropsWithoutRef } from 'react';
import { AstryxIcon } from './AstryxIcon';
import { cx } from './classNames';

type RootProps = Omit<ComponentPropsWithoutRef<typeof NavIcon>, 'className' | 'icon'>;
export interface AstryxNavIconProps extends RootProps {
  icon?: string;
  className?: string;
}
export function AstryxNavIcon({ icon = 'home', className, ...rootProps }: AstryxNavIconProps) {
  return (
    <NavIcon
      {...rootProps}
      className={cx('astryx-wb-nav-icon', className)}
      icon={<AstryxIcon color="inherit" icon={icon} size="sm" />}
    />
  );
}
