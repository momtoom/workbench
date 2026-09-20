import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cx } from './classNames';

type AstryxTreeListItemRootProps = Omit<ComponentPropsWithoutRef<'span'>, 'children' | 'className' | 'id'>;

export interface AstryxTreeListItemProps extends AstryxTreeListItemRootProps {
  id?: string;
  label?: string;
  description?: string;
  href?: string;
  isDisabled?: boolean;
  isSelected?: boolean;
  isExpanded?: boolean;
  children?: ReactNode;
  className?: string;
}

export function AstryxTreeListItem({
  id,
  label = 'Tree item',
  description,
  href,
  isDisabled = false,
  isSelected = false,
  isExpanded = false,
  children: _children,
  className,
  ...rootProps
}: AstryxTreeListItemProps) {
  return (
    <span
      {...rootProps}
      className={cx('astryx-wb-tree-list-item', className)}
      data-astryx-wb-tree-item-description={description || undefined}
      data-astryx-wb-tree-item-disabled={isDisabled ? 'true' : undefined}
      data-astryx-wb-tree-item-expanded={isExpanded ? 'true' : undefined}
      data-astryx-wb-tree-item-href={href || undefined}
      data-astryx-wb-tree-item-id={id || undefined}
      data-astryx-wb-tree-item-selected={isSelected ? 'true' : undefined}
    >
      {label}
    </span>
  );
}

AstryxTreeListItem.displayName = 'AstryxTreeListItem';
