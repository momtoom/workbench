import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cx } from './classNames';

export interface AstryxTableHeaderProps extends Omit<ComponentPropsWithoutRef<'thead'>, 'children'> {
  children?: ReactNode;
}

export function AstryxTableHeader({ children, className, ...rootProps }: AstryxTableHeaderProps) {
  return (
    <thead {...rootProps} className={cx('astryx-wb-table-header', className)}>
      {children}
    </thead>
  );
}
