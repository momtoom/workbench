import { TableHeaderCell } from '@astryxdesign/core/Table';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cx } from './classNames';

export type AstryxTableCellAlign = 'start' | 'center' | 'end';

type AstryxTableHeadRootProps = Omit<
  ComponentPropsWithoutRef<typeof TableHeaderCell>,
  'align' | 'children' | 'colSpan' | 'rowSpan' | 'xstyle'
>;

export interface AstryxTableHeadProps extends AstryxTableHeadRootProps {
  align?: AstryxTableCellAlign;
  children?: ReactNode;
  colSpan?: number;
  rowSpan?: number;
}

export function AstryxTableHead({
  align = 'start',
  children,
  className,
  scope = 'col',
  ...rootProps
}: AstryxTableHeadProps) {
  return (
    <TableHeaderCell
      {...rootProps}
      className={cx('astryx-wb-table-head', className)}
      data-align={align}
      scope={scope}
    >
      {children}
    </TableHeaderCell>
  );
}
