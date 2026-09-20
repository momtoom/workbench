import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cx } from './classNames';

export interface AstryxTableBodyProps extends Omit<ComponentPropsWithoutRef<'tbody'>, 'children'> {
  children?: ReactNode;
}

export function AstryxTableBody({ children, className, ...rootProps }: AstryxTableBodyProps) {
  return (
    <tbody {...rootProps} className={cx('astryx-wb-table-body', className)}>
      {children}
    </tbody>
  );
}
