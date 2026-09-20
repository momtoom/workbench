import { Table } from '@astryxdesign/core/Table';
import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from './classNames';

export type AstryxTableDensity = 'compact' | 'balanced' | 'spacious';
export type AstryxTableDividers = 'rows' | 'columns' | 'grid' | 'none';
export type AstryxTableOverflow = 'wrap' | 'truncate';
export type AstryxTableVerticalAlign = 'middle' | 'top' | 'bottom';

export interface AstryxTableProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  children?: ReactNode;
  density?: AstryxTableDensity;
  dividers?: AstryxTableDividers;
  textOverflow?: AstryxTableOverflow;
  verticalAlign?: AstryxTableVerticalAlign;
  isStriped?: boolean;
  hasHover?: boolean;
}

export function AstryxTable({
  children,
  density = 'balanced',
  dividers = 'rows',
  textOverflow = 'wrap',
  verticalAlign = 'middle',
  isStriped = false,
  hasHover = true,
  className,
  ...rootProps
}: AstryxTableProps) {
  return (
    <div {...rootProps} className={cx('astryx-wb-table-frame', className)}>
      <Table
        density={density}
        dividers={dividers}
        hasHover={hasHover}
        isStriped={isStriped}
        tableProps={{ className: 'astryx-wb-table' }}
        textOverflow={textOverflow}
        verticalAlign={verticalAlign}
      >
        {children}
      </Table>
    </div>
  );
}
