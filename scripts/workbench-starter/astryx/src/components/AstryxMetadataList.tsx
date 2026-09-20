import { MetadataList } from '@astryxdesign/core/MetadataList';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cx } from './classNames';

export type AstryxMetadataListColumns = 'single' | 'multi' | 'two';
export type AstryxMetadataListLabelPosition = 'start' | 'top';
export type AstryxMetadataListOrientation = 'vertical' | 'horizontal';

type AstryxMetadataListRootProps = Omit<
  ComponentPropsWithoutRef<typeof MetadataList>,
  'children' | 'className' | 'columns' | 'label' | 'maxNumOfItems' | 'orientation' | 'title'
>;

export interface AstryxMetadataListProps extends AstryxMetadataListRootProps {
  title?: string;
  children?: ReactNode;
  columns?: AstryxMetadataListColumns;
  labelPosition?: AstryxMetadataListLabelPosition;
  orientation?: AstryxMetadataListOrientation;
  maxNumOfItems?: number;
  className?: string;
}

export function AstryxMetadataList({
  title = 'Component metadata',
  children,
  columns = 'single',
  labelPosition = 'start',
  orientation = 'vertical',
  maxNumOfItems,
  className,
  ...rootProps
}: AstryxMetadataListProps) {
  return (
    <MetadataList
      {...rootProps}
      className={cx('astryx-wb-metadata-list', className)}
      columns={resolveColumns(columns)}
      label={{ position: labelPosition }}
      maxNumOfItems={maxNumOfItems || undefined}
      orientation={orientation}
      title={title || undefined}
    >
      {children}
    </MetadataList>
  );
}

function resolveColumns(columns: AstryxMetadataListColumns): 'single' | 'multi' | number {
  return columns === 'two' ? 2 : columns;
}
