import { TableCell } from '@astryxdesign/core/Table';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cx } from './classNames';
import type { AstryxTableCellAlign } from './AstryxTableHead';

type AstryxTableCellRootProps = Omit<
  ComponentPropsWithoutRef<typeof TableCell>,
  'align' | 'children' | 'colSpan' | 'rowSpan' | 'xstyle'
>;

export interface AstryxTableCellProps extends AstryxTableCellRootProps {
  align?: AstryxTableCellAlign;
  children?: ReactNode;
  colSpan?: number;
  rowSpan?: number;
}

export function AstryxTableCell({
  align = 'start',
  children,
  className,
  ...rootProps
}: AstryxTableCellProps) {
  return (
    <TableCell {...rootProps} className={cx('astryx-wb-table-cell', className)} data-align={align}>
      {children}
    </TableCell>
  );
}
