import { CheckboxInput } from '@astryxdesign/core/CheckboxInput';
import { useEffect, useState, type ComponentPropsWithoutRef } from 'react';

export type AstryxCheckboxInputSize = 'sm' | 'md';
export type AstryxCheckboxInputValue = boolean | 'indeterminate';

type AstryxCheckboxInputRootProps = Omit<
  ComponentPropsWithoutRef<typeof CheckboxInput>,
  | 'className'
  | 'description'
  | 'isDisabled'
  | 'isLoading'
  | 'isOptional'
  | 'isReadOnly'
  | 'isRequired'
  | 'label'
  | 'onChange'
  | 'size'
  | 'value'
  | 'width'
>;

export interface AstryxCheckboxInputProps extends AstryxCheckboxInputRootProps {
  label?: string;
  defaultValue?: AstryxCheckboxInputValue;
  description?: string;
  size?: AstryxCheckboxInputSize;
  width?: string;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  isRequired?: boolean;
  isOptional?: boolean;
  isLoading?: boolean;
  className?: string;
}

export function AstryxCheckboxInput({
  label = 'Accept terms',
  defaultValue = false,
  description,
  size = 'md',
  width = '100%',
  isDisabled = false,
  isReadOnly = false,
  isRequired = false,
  isOptional = false,
  isLoading = false,
  className,
  ...rootProps
}: AstryxCheckboxInputProps) {
  const [value, setValue] = useState<AstryxCheckboxInputValue>(defaultValue);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  return (
    <CheckboxInput
      {...rootProps}
      className={className}
      description={description}
      isDisabled={isDisabled}
      isLoading={isLoading}
      isOptional={!isRequired && isOptional}
      isReadOnly={isReadOnly}
      isRequired={isRequired}
      label={label}
      onChange={setValue}
      size={size}
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
