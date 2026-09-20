import { TreeList, type TreeListItemData } from '@astryxdesign/core/TreeList';
import {
  Children,
  isValidElement,
  useMemo,
  type ComponentPropsWithoutRef,
  type ReactElement,
  type ReactNode,
} from 'react';
import { AstryxTreeListItem, type AstryxTreeListItemProps } from './AstryxTreeListItem';
import { cx } from './classNames';
import { useStableAstryxChildren } from './stableChildren';

export type AstryxTreeListDensity = 'compact' | 'balanced' | 'spacious';
type RootProps = Omit<ComponentPropsWithoutRef<typeof TreeList>, 'className' | 'density' | 'header' | 'items'>;
export interface AstryxTreeListProps extends RootProps {
  children?: ReactNode;
  header?: string;
  density?: AstryxTreeListDensity;
  className?: string;
}
export function AstryxTreeList({
  children,
  header = 'Project files',
  density = 'balanced',
  className,
  ...rootProps
}: AstryxTreeListProps) {
  const stableChildren = useStableAstryxChildren(children);
  const items = useMemo(() => collectItems(stableChildren), [stableChildren]);
  return (
    <TreeList
      {...rootProps}
      className={cx('astryx-wb-tree-list', className)}
      density={density}
      header={header || undefined}
      items={items}
    />
  );
}

function collectItems(children: ReactNode, parentPath = 'item'): TreeListItemData[] {
  return Children.toArray(children)
    .map(findTreeListItemElement)
    .filter((child): child is ReactElement<AstryxTreeListItemProps> => child !== null)
    .map((child, index) => {
      const { children: nestedChildren, ...props } = child.props;
      const id = props.id || `${parentPath}-${slug(props.label || '') || index + 1}`;
      return {
        id,
        label: child,
        description: props.description,
        href: props.href,
        isDisabled: props.isDisabled,
        isSelected: props.isSelected,
        isExpanded: props.isExpanded,
        children: collectItems(nestedChildren, id),
      };
    });
}

function findTreeListItemElement(node: ReactNode): ReactElement<AstryxTreeListItemProps> | null {
  if (!isValidElement<{ children?: ReactNode }>(node)) return null;
  if (isNamedComponent(node.type, AstryxTreeListItem, 'AstryxTreeListItem')) {
    return node as ReactElement<AstryxTreeListItemProps>;
  }
  for (const child of Children.toArray(node.props.children)) {
    const match = findTreeListItemElement(child);
    if (match) return match;
  }
  return null;
}

function isNamedComponent(type: unknown, component: unknown, name: string): boolean {
  if (type === component) return true;
  const namedType = type as { displayName?: string; name?: string } | null;
  return namedType?.displayName === name || namedType?.name === name;
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
