import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cx } from './classNames';

export interface AstryxTableFooterProps extends Omit<ComponentPropsWithoutRef<'tfoot'>, 'children'> {
  children?: ReactNode;
}

export function AstryxTableFooter({ children, className, ...rootProps }: AstryxTableFooterProps) {
  return (
    <tfoot {...rootProps} className={cx('astryx-wb-table-footer', className)}>
      {children}
    </tfoot>
  );
}
