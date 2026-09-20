import { Button } from '@astryxdesign/core/Button';
import { OverflowList } from '@astryxdesign/core/OverflowList';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cx } from './classNames';
import { useStableAstryxChildren } from './stableChildren';

export type AstryxOverflowListCollapseFrom = 'start' | 'end';
export type AstryxOverflowListBehavior = 'observeParent' | 'observeSelf';
export type AstryxOverflowListGap = 0 | 0.5 | 1 | 1.5 | 2 | 3 | 4 | 5 | 6 | 8 | 10;
type RootProps = Omit<
  ComponentPropsWithoutRef<typeof OverflowList>,
  'behavior' | 'children' | 'className' | 'collapseFrom' | 'gap' | 'minVisibleItems' | 'overflowRenderer'
>;
export interface AstryxOverflowListProps extends RootProps {
  children?: ReactNode;
  gap?: AstryxOverflowListGap;
  minVisibleItems?: number;
  collapseFrom?: AstryxOverflowListCollapseFrom;
  behavior?: AstryxOverflowListBehavior;
  overflowLabel?: string;
  className?: string;
}
export function AstryxOverflowList({
  children,
  gap = 2,
  minVisibleItems = 1,
  collapseFrom = 'end',
  behavior = 'observeSelf',
  overflowLabel = 'more',
  className,
  ...rootProps
}: AstryxOverflowListProps) {
  const stableChildren = useStableAstryxChildren(children);
  return (
    <OverflowList
      {...rootProps}
      behavior={behavior}
      className={cx('astryx-wb-overflow-list', className)}
      collapseFrom={collapseFrom}
      gap={gap}
      minVisibleItems={minVisibleItems}
      overflowRenderer={(hidden) => <Button label={`+${hidden.length} ${overflowLabel}`} variant="ghost" />}
    >
      {stableChildren}
    </OverflowList>
  );
}
