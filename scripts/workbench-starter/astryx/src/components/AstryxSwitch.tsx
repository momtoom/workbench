import { Switch } from '@astryxdesign/core/Switch';
import { useEffect, useState, type ComponentPropsWithoutRef } from 'react';

export type AstryxSwitchLabelPosition = 'start' | 'end';
export type AstryxSwitchLabelSpacing = 'default' | 'spread';

type AstryxSwitchRootProps = Omit<
  ComponentPropsWithoutRef<typeof Switch>,
  | 'className'
  | 'description'
  | 'isDisabled'
  | 'isLoading'
  | 'isOptional'
  | 'isRequired'
  | 'label'
  | 'labelPosition'
  | 'labelSpacing'
  | 'onChange'
  | 'value'
  | 'width'
>;

export interface AstryxSwitchProps extends AstryxSwitchRootProps {
  label?: string;
  defaultValue?: boolean;
  description?: string;
  width?: string;
  labelPosition?: AstryxSwitchLabelPosition;
  labelSpacing?: AstryxSwitchLabelSpacing;
  isDisabled?: boolean;
  isRequired?: boolean;
  isOptional?: boolean;
  isLoading?: boolean;
  className?: string;
}

export function AstryxSwitch({
  label = 'Enable feature',
  defaultValue = true,
  description,
  width = '100%',
  labelPosition = 'end',
  labelSpacing = 'default',
  isDisabled = false,
  isRequired = false,
  isOptional = false,
  isLoading = false,
  className,
  ...rootProps
}: AstryxSwitchProps) {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  return (
    <Switch
      {...rootProps}
      className={className}
      description={description}
      isDisabled={isDisabled}
      isLoading={isLoading}
      isOptional={!isRequired && isOptional}
      isRequired={isRequired}
      label={label}
      labelPosition={labelPosition}
      labelSpacing={labelSpacing}
      onChange={setValue}
      value={value}
      width={resolveAstryxFieldWidth(width)}
    />
  );
}

function resolveAstryxFieldWidth(width: string): string {
  if (width === 'inherit') return '';
  if (width === 'full') return '100%';
  if (width === 'sm') return '240px';
  if (width === 'md') return '320px';
  if (width === 'lg') return '480px';
  return width;
}
