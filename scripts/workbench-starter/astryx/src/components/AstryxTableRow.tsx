import { TableRow } from '@astryxdesign/core/Table';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cx } from './classNames';

type AstryxTableRowRootProps = Omit<ComponentPropsWithoutRef<typeof TableRow>, 'children' | 'xstyle'>;

export interface AstryxTableRowProps extends AstryxTableRowRootProps {
  children?: ReactNode;
}

export function AstryxTableRow({ children, className, isHeaderRow = false, ...rootProps }: AstryxTableRowProps) {
  return (
    <TableRow {...rootProps} className={cx('astryx-wb-table-row', className)} isHeaderRow={isHeaderRow}>
      {children}
    </TableRow>
  );
}
