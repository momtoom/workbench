import type { SearchableItem } from '@astryxdesign/core/Typeahead';
import {
  Children,
  isValidElement,
  type ComponentPropsWithoutRef,
  type ReactElement,
  type ReactNode,
} from 'react';
import { AstryxItem } from './AstryxItem';
import type { AstryxIconValue } from './AstryxIcon';
import { cx } from './classNames';

type AstryxSearchItemRootProps = Omit<
  ComponentPropsWithoutRef<'div'>,
  'children' | 'className' | 'id'
>;

export interface AstryxSearchItemProps extends AstryxSearchItemRootProps {
  id?: string;
  label?: string;
  description?: string;
  group?: string;
  icon?: AstryxIconValue | 'none';
  endLabel?: string;
  isDefaultSelected?: boolean;
  className?: string;
}

export interface AstryxSearchItemData {
  group?: string;
  isDefaultSelected: boolean;
}

export type AstryxSearchableItem = SearchableItem<AstryxSearchItemData>;

export function AstryxSearchItem({
  id,
  label = 'Search item',
  description,
  group,
  icon = 'none',
  endLabel,
  isDefaultSelected = false,
  className,
  ...rootProps
}: AstryxSearchItemProps) {
  return (
    <div
      {...rootProps}
      className={cx('astryx-wb-search-item', className)}
      data-astryx-wb-search-item-default={isDefaultSelected ? 'true' : undefined}
      data-astryx-wb-search-item-group={group || undefined}
      data-astryx-wb-search-item-id={id || undefined}
    >
      <AstryxItem
        description={description || ''}
        endText={endLabel}
        label={label}
        startIcon={icon}
      />
    </div>
  );
}

AstryxSearchItem.displayName = 'AstryxSearchItem';

export function collectAstryxSearchItems(children: ReactNode): AstryxSearchableItem[] {
  return collectSearchItemElements(children)
    .map((child, index) => {
      const label = child.props.label?.trim() || `Search item ${index + 1}`;
      return {
        id: child.props.id?.trim() || slug(label) || `search-item-${index + 1}`,
        label,
        element: child,
        auxiliaryData: {
          group: child.props.group?.trim() || undefined,
          isDefaultSelected: child.props.isDefaultSelected === true,
        },
      };
    });
}

function collectSearchItemElements(children: ReactNode): ReactElement<AstryxSearchItemProps>[] {
  return Children.toArray(children)
    .map(findSearchItemElement)
    .filter((child): child is ReactElement<AstryxSearchItemProps> => child !== null);
}

function findSearchItemElement(node: ReactNode): ReactElement<AstryxSearchItemProps> | null {
  if (!isValidElement<{ children?: ReactNode }>(node)) return null;
  if (isNamedComponent(node.type, AstryxSearchItem, 'AstryxSearchItem')) {
    return node as ReactElement<AstryxSearchItemProps>;
  }
  for (const child of Children.toArray(node.props.children)) {
    const match = findSearchItemElement(child);
    if (match) return match;
  }
  return null;
}

function isNamedComponent(type: unknown, component: unknown, name: string): boolean {
  if (type === component) return true;
  const namedType = type as { displayName?: string; name?: string } | null;
  return namedType?.displayName === name || namedType?.name === name;
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
