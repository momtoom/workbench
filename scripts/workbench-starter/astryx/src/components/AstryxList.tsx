import { List } from '@astryxdesign/core/List';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cx } from './classNames';

export type AstryxListDensity = 'compact' | 'balanced' | 'spacious';
export type AstryxListStyle = 'none' | 'disc' | 'decimal' | 'circle';

type AstryxListRootProps = Omit<
  ComponentPropsWithoutRef<typeof List>,
  'children' | 'className' | 'density' | 'hasDividers' | 'header' | 'listStyle' | 'start'
>;

export interface AstryxListProps extends AstryxListRootProps {
  header?: string;
  children?: ReactNode;
  density?: AstryxListDensity;
  listStyle?: AstryxListStyle;
  hasDividers?: boolean;
  start?: number;
  className?: string;
}

export function AstryxList({
  header = 'Project checklist',
  children,
  density = 'balanced',
  listStyle = 'none',
  hasDividers = true,
  start = 1,
  className,
  ...rootProps
}: AstryxListProps) {
  return (
    <List
      {...rootProps}
      className={cx('astryx-wb-list', className)}
      density={density}
      hasDividers={hasDividers}
      header={header || undefined}
      listStyle={listStyle}
      start={start}
    >
      {children}
    </List>
  );
}
