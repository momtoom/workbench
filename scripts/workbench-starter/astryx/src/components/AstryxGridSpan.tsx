import { GridSpan } from '@astryxdesign/core/Grid';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cx } from './classNames';

export type AstryxGridSpanColumns = '1' | '2' | '3' | '4' | 'full';

type AstryxGridSpanRootProps = Omit<ComponentPropsWithoutRef<typeof GridSpan>, 'children' | 'className' | 'columns' | 'rows'>;

export interface AstryxGridSpanProps extends AstryxGridSpanRootProps {
  columns?: AstryxGridSpanColumns;
  rows?: number;
  className?: string;
  children?: ReactNode;
}

export function AstryxGridSpan({
  columns = 'full',
  rows,
  className,
  children,
  ...rootProps
}: AstryxGridSpanProps) {
  return (
    <GridSpan
      {...rootProps}
      className={cx('astryx-wb-grid-span', className)}
      columns={columns === 'full' ? 'full' : Number(columns)}
      rows={rows}
    >
      {children}
    </GridSpan>
  );
}
