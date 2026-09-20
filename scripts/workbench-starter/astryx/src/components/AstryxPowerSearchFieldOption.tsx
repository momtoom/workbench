import {
  Children,
  isValidElement,
  type ComponentPropsWithoutRef,
  type ReactElement,
  type ReactNode,
} from 'react';
import { cx } from './classNames';

type OptionRootProps = Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'className'>;

export interface AstryxPowerSearchFieldOptionProps extends OptionRootProps {
  value?: string;
  label?: string;
  className?: string;
}

export function AstryxPowerSearchFieldOption({
  value = 'field',
  label = 'Field',
  className,
  ...rootProps
}: AstryxPowerSearchFieldOptionProps) {
  return (
    <div
      {...rootProps}
      className={cx('astryx-wb-power-search-select-option', className)}
      data-astryx-wb-power-search-field-option={value}
    >
      {label}
    </div>
  );
}

AstryxPowerSearchFieldOption.displayName = 'AstryxPowerSearchFieldOption';

export function collectAstryxPowerSearchFieldOptions(children: ReactNode) {
  return Children.toArray(children)
    .filter(
      (child): child is ReactElement<AstryxPowerSearchFieldOptionProps> =>
        isValidElement<AstryxPowerSearchFieldOptionProps>(child) &&
        isNamedComponent(
          child.type,
          AstryxPowerSearchFieldOption,
          'AstryxPowerSearchFieldOption',
        ),
    )
    .map((child, index) => ({
      value: child.props.value?.trim() || `field-${index + 1}`,
      label: child.props.label?.trim() || `Field ${index + 1}`,
      sourceElement: child,
    }));
}

function isNamedComponent(type: unknown, component: unknown, name: string) {
  if (type === component) return true;
  const namedType = type as { displayName?: string; name?: string } | null;
  return namedType?.displayName === name || namedType?.name === name;
}
