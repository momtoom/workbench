import { Token } from '@astryxdesign/core/Token';
import type { SearchableItem } from '@astryxdesign/core/Typeahead';
import {
  Children,
  createContext,
  isValidElement,
  useContext,
  type ComponentPropsWithoutRef,
  type ReactElement,
  type ReactNode,
} from 'react';
import { AstryxIcon, type AstryxIconValue } from './AstryxIcon';
import { AstryxItem } from './AstryxItem';
import type { AstryxTokenColor } from './AstryxToken';
import { cx } from './classNames';

type AstryxTokenizerItemRootProps = Omit<
  ComponentPropsWithoutRef<typeof Token>,
  | 'className'
  | 'color'
  | 'description'
  | 'endContent'
  | 'icon'
  | 'isDisabled'
  | 'label'
  | 'onRemove'
  | 'size'
>;

export interface AstryxTokenizerItemProps extends AstryxTokenizerItemRootProps {
  id?: string;
  label?: string;
  description?: string;
  icon?: AstryxIconValue | 'none';
  endLabel?: string;
  isSelected?: boolean;
  isDisabled?: boolean;
  tokenColor?: AstryxTokenColor;
  className?: string;
}

interface AstryxTokenizerItemPresentation {
  kind: 'option' | 'token';
  onRemove?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export interface AstryxTokenizerItemData {
  isSelected: boolean;
  sourceElement: ReactElement<AstryxTokenizerItemProps>;
}

export type AstryxTokenizerSearchableItem = SearchableItem<AstryxTokenizerItemData>;

export const AstryxTokenizerItemPresentationContext =
  createContext<AstryxTokenizerItemPresentation>({ kind: 'option' });

export function AstryxTokenizerItem({
  id,
  label = 'Tokenizer item',
  description,
  icon = 'none',
  endLabel,
  isSelected = false,
  isDisabled = false,
  tokenColor = 'default',
  className,
  ...rootProps
}: AstryxTokenizerItemProps) {
  const presentation = useContext(AstryxTokenizerItemPresentationContext);

  if (presentation.kind === 'token') {
    return (
      <Token
        {...rootProps}
        className={cx('astryx-wb-tokenizer-item', className)}
        color={tokenColor}
        description={description || undefined}
        endContent={endLabel || undefined}
        icon={icon === 'none' || icon === '' ? undefined : <AstryxIcon icon={icon || 'user'} />}
        isDisabled={isDisabled}
        label={label}
        onRemove={isDisabled ? undefined : presentation.onRemove}
        size={presentation.size}
      />
    );
  }

  return (
    <div
      {...(rootProps as ComponentPropsWithoutRef<'div'>)}
      className={cx('astryx-wb-tokenizer-item', className)}
      data-astryx-wb-tokenizer-item-id={id || undefined}
      data-astryx-wb-tokenizer-item-selected={isSelected ? 'true' : undefined}
    >
      <AstryxItem
        description={description || ''}
        endText={endLabel}
        isDisabled={isDisabled}
        label={label}
        startIcon={icon}
      />
    </div>
  );
}

AstryxTokenizerItem.displayName = 'AstryxTokenizerItem';

export function collectAstryxTokenizerItems(children: ReactNode): AstryxTokenizerSearchableItem[] {
  return collectTokenizerItemElements(children).map((child, index) => {
    const label = child.props.label?.trim() || `Tokenizer item ${index + 1}`;
    return {
      id: child.props.id?.trim() || slug(label) || `tokenizer-item-${index + 1}`,
      label,
      element: child,
      auxiliaryData: {
        isSelected: child.props.isSelected === true,
        sourceElement: child,
      },
    };
  });
}

function collectTokenizerItemElements(children: ReactNode): ReactElement<AstryxTokenizerItemProps>[] {
  return Children.toArray(children)
    .map(findTokenizerItemElement)
    .filter((child): child is ReactElement<AstryxTokenizerItemProps> => child !== null);
}

function findTokenizerItemElement(node: ReactNode): ReactElement<AstryxTokenizerItemProps> | null {
  if (!isValidElement<{ children?: ReactNode }>(node)) return null;
  if (isNamedComponent(node.type, AstryxTokenizerItem, 'AstryxTokenizerItem')) {
    return node as ReactElement<AstryxTokenizerItemProps>;
  }
  for (const child of Children.toArray(node.props.children)) {
    const match = findTokenizerItemElement(child);
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
