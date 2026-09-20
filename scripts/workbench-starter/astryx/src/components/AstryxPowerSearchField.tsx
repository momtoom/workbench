import type { FieldDefinition } from '@astryxdesign/core/PowerSearch';
import {
  Children,
  isValidElement,
  type ComponentPropsWithoutRef,
  type ReactElement,
  type ReactNode,
} from 'react';
import { AstryxIcon, type AstryxIconValue } from './AstryxIcon';
import { AstryxItem } from './AstryxItem';
import {
  AstryxPowerSearchEditor,
  type AstryxPowerSearchEditorProps,
} from './AstryxPowerSearchEditor';
import { collectAstryxPowerSearchOptions } from './AstryxPowerSearchOption';
import { cx } from './classNames';

export type AstryxPowerSearchFieldType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'enum'
  | 'enum_list'
  | 'string_list';

type AstryxPowerSearchFieldRootProps = Omit<
  ComponentPropsWithoutRef<'div'>,
  'children' | 'className'
>;

export interface AstryxPowerSearchFieldProps extends AstryxPowerSearchFieldRootProps {
  children?: ReactNode;
  fieldKey?: string;
  label?: string;
  type?: AstryxPowerSearchFieldType;
  icon?: AstryxIconValue | 'none';
  group?: string;
  description?: string;
  className?: string;
}

export interface AstryxPowerSearchFieldDefinition {
  definition: FieldDefinition;
  description?: string;
  group?: string;
  icon?: ReactNode;
  editor?: ReactElement<AstryxPowerSearchEditorProps>;
}

export function AstryxPowerSearchField({
  children,
  fieldKey = 'field',
  label = 'Search field',
  type = 'string',
  icon = 'search',
  group,
  description,
  className,
  ...rootProps
}: AstryxPowerSearchFieldProps) {
  return (
    <div
      {...rootProps}
      className={cx('astryx-wb-power-search-field', className)}
      data-astryx-wb-power-search-field={fieldKey}
    >
      <AstryxItem
        description={description || ''}
        endText={type}
        label={label}
        startIcon={icon}
      />
      {children}
    </div>
  );
}

AstryxPowerSearchField.displayName = 'AstryxPowerSearchField';

export function collectAstryxPowerSearchFields(children: ReactNode): AstryxPowerSearchFieldDefinition[] {
  return collectFieldElements(children).map((child, index) => {
    const type = child.props.type || 'string';
    const fieldKey = child.props.fieldKey?.trim() || `field-${index + 1}`;
    const label = child.props.label?.trim() || `Search field ${index + 1}`;
    const enumValues = collectAstryxPowerSearchOptions(child.props.children);
    const editor = findEditorElement(child.props.children);
    return {
      definition: {
        key: fieldKey,
        type,
        label,
        ...((type === 'enum' || type === 'enum_list') ? { enumValues } : {}),
      } as FieldDefinition,
      description: child.props.description?.trim() || undefined,
      group: child.props.group?.trim() || undefined,
      icon:
        child.props.icon && child.props.icon !== 'none'
          ? <AstryxIcon icon={child.props.icon} />
          : undefined,
      editor: editor || undefined,
    };
  });
}

function findEditorElement(
  children: ReactNode,
): ReactElement<AstryxPowerSearchEditorProps> | null {
  for (const node of Children.toArray(children)) {
    if (!isValidElement<{ children?: ReactNode }>(node)) continue;
    if (isNamedComponent(node.type, AstryxPowerSearchEditor, 'AstryxPowerSearchEditor')) {
      return node as ReactElement<AstryxPowerSearchEditorProps>;
    }
    const match = findEditorElement(node.props.children);
    if (match) return match;
  }
  return null;
}

function collectFieldElements(children: ReactNode): ReactElement<AstryxPowerSearchFieldProps>[] {
  const fields: ReactElement<AstryxPowerSearchFieldProps>[] = [];
  for (const child of Children.toArray(children)) {
    collectFieldElementsFromNode(child, fields);
  }
  return fields;
}

function collectFieldElementsFromNode(
  node: ReactNode,
  fields: ReactElement<AstryxPowerSearchFieldProps>[],
) {
  if (!isValidElement<{ children?: ReactNode }>(node)) return null;
  if (
    isNamedComponent(node.type, AstryxPowerSearchField, 'AstryxPowerSearchField') ||
    isNamedComponent(node.type, null, 'AstryxPowerSearchItem') ||
    isPowerSearchFieldProps(node.props)
  ) {
    fields.push(node as ReactElement<AstryxPowerSearchFieldProps>);
    return;
  }
  for (const child of Children.toArray(node.props.children)) {
    collectFieldElementsFromNode(child, fields);
  }
}

function isPowerSearchFieldProps(
  props: { children?: ReactNode } & Record<string, unknown>,
): boolean {
  return (
    typeof props.fieldKey === 'string' &&
    typeof props.label === 'string' &&
    typeof props.type === 'string' &&
    [
      'string',
      'number',
      'boolean',
      'date',
      'enum',
      'enum_list',
      'string_list',
    ].includes(props.type)
  );
}

function isNamedComponent(type: unknown, component: unknown, name: string): boolean {
  if (type === component) return true;
  const namedType = type as { displayName?: string; name?: string } | null;
  return namedType?.displayName === name || namedType?.name === name;
}
