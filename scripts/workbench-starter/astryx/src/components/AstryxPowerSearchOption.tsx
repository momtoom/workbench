import type { EnumItem } from '@astryxdesign/core/PowerSearch';
import {
  Children,
  isValidElement,
  type ComponentPropsWithoutRef,
  type ReactElement,
  type ReactNode,
} from 'react';
import { cx } from './classNames';

type AstryxPowerSearchOptionRootProps = Omit<
  ComponentPropsWithoutRef<'div'>,
  'children' | 'className'
>;

export interface AstryxPowerSearchOptionProps extends AstryxPowerSearchOptionRootProps {
  value?: string;
  label?: string;
  className?: string;
}

export function AstryxPowerSearchOption({
  value = 'value',
  label = 'Option',
  className,
  ...rootProps
}: AstryxPowerSearchOptionProps) {
  return (
    <div
      {...rootProps}
      className={cx(
        'astryx-wb-power-search-option',
        'astryx-wb-power-search-select-option',
        className,
      )}
      data-astryx-wb-power-search-option={value}
    >
      {label}
    </div>
  );
}

AstryxPowerSearchOption.displayName = 'AstryxPowerSearchOption';

export function collectAstryxPowerSearchOptions(children: ReactNode): EnumItem[] {
  return collectAstryxPowerSearchOptionEntries(children).map(({ value, label }) => ({
    value,
    label,
  }));
}

export function collectAstryxPowerSearchOptionEntries(children: ReactNode) {
  return collectOptionElements(children).map((child, index) => ({
    value: child.props.value?.trim() || `option-${index + 1}`,
    label: child.props.label?.trim() || `Option ${index + 1}`,
    sourceElement: child,
  }));
}

function collectOptionElements(children: ReactNode): ReactElement<AstryxPowerSearchOptionProps>[] {
  const options: ReactElement<AstryxPowerSearchOptionProps>[] = [];
  for (const child of Children.toArray(children)) {
    collectOptionElementsFromNode(child, options);
  }
  return options;
}

function collectOptionElementsFromNode(
  node: ReactNode,
  options: ReactElement<AstryxPowerSearchOptionProps>[],
) {
  if (!isValidElement<{ children?: ReactNode }>(node)) return null;
  if (
    isNamedComponent(node.type, AstryxPowerSearchOption, 'AstryxPowerSearchOption')
  ) {
    options.push(node as ReactElement<AstryxPowerSearchOptionProps>);
    return;
  }
  for (const child of Children.toArray(node.props.children)) {
    collectOptionElementsFromNode(child, options);
  }
}

function isNamedComponent(type: unknown, component: unknown, name: string): boolean {
  if (type === component) return true;
  const namedType = type as { displayName?: string; name?: string } | null;
  return namedType?.displayName === name || namedType?.name === name;
}
