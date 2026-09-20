import {
  Children,
  isValidElement,
  type ComponentPropsWithoutRef,
  type ReactElement,
  type ReactNode,
} from 'react';
import { cx } from './classNames';

type OptionRootProps = Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'className'>;

export interface AstryxPowerSearchOperatorOptionProps extends OptionRootProps {
  value?: string;
  label?: string;
  className?: string;
}

export function AstryxPowerSearchOperatorOption({
  value = 'is',
  label = 'is',
  className,
  ...rootProps
}: AstryxPowerSearchOperatorOptionProps) {
  return (
    <div
      {...rootProps}
      className={cx('astryx-wb-power-search-select-option', className)}
      data-astryx-wb-power-search-operator-option={value}
    >
      {label}
    </div>
  );
}

AstryxPowerSearchOperatorOption.displayName = 'AstryxPowerSearchOperatorOption';

export function collectAstryxPowerSearchOperatorOptions(children: ReactNode) {
  return Children.toArray(children)
    .filter(
      (child): child is ReactElement<AstryxPowerSearchOperatorOptionProps> =>
        isValidElement<AstryxPowerSearchOperatorOptionProps>(child) &&
        isNamedComponent(
          child.type,
          AstryxPowerSearchOperatorOption,
          'AstryxPowerSearchOperatorOption',
        ),
    )
    .map((child, index) => ({
      value: child.props.value?.trim() || `operator-${index + 1}`,
      label: child.props.label?.trim() || `Operator ${index + 1}`,
      sourceElement: child,
    }));
}

function isNamedComponent(type: unknown, component: unknown, name: string) {
  if (type === component) return true;
  const namedType = type as { displayName?: string; name?: string } | null;
  return namedType?.displayName === name || namedType?.name === name;
}
