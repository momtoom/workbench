import { NumberInput } from '@astryxdesign/core/NumberInput';
import { useEffect, useState, type ComponentPropsWithoutRef } from 'react';
import { resolveAstryxFieldRootProps } from './AstryxFieldRoot';
import { cx } from './classNames';

export type AstryxNumberInputSize = 'sm' | 'md' | 'lg';
export type AstryxNumberInputStatus = 'none' | 'warning' | 'error' | 'success';

type AstryxNumberInputRootProps = Omit<
  ComponentPropsWithoutRef<typeof NumberInput>,
  | 'className'
  | 'description'
  | 'hasClear'
  | 'isDisabled'
  | 'isIntegerOnly'
  | 'isLabelHidden'
  | 'isOptional'
  | 'isRequired'
  | 'label'
  | 'max'
  | 'min'
  | 'onChange'
  | 'placeholder'
  | 'size'
  | 'status'
  | 'step'
  | 'units'
  | 'value'
  | 'width'
>;

export interface AstryxNumberInputProps extends AstryxNumberInputRootProps {
  label?: string;
  defaultValue?: number;
  placeholder?: string;
  description?: string;
  size?: AstryxNumberInputSize;
  width?: string;
  min?: number;
  max?: number;
  step?: number;
  units?: string;
  status?: AstryxNumberInputStatus;
  statusMessage?: string;
  hasClear?: boolean;
  isIntegerOnly?: boolean;
  isLabelHidden?: boolean;
  isOptional?: boolean;
  isRequired?: boolean;
  isDisabled?: boolean;
  className?: string;
}

export function AstryxNumberInput({
  label = 'Quantity',
  defaultValue = 12,
  placeholder = '0',
  description,
  size = 'md',
  width = '100%',
  min = 0,
  max = 100,
  step = 1,
  units,
  status = 'none',
  statusMessage,
  hasClear = false,
  isIntegerOnly = false,
  isLabelHidden = false,
  isOptional = false,
  isRequired = false,
  isDisabled = false,
  className,
  ...rootProps
}: AstryxNumberInputProps) {
  const [value, setValue] = useState<number | null>(defaultValue);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  const rootWidth = resolveAstryxFieldWidth(width);
  const { rootDomProps, rootStyle } = resolveAstryxFieldRootProps(rootProps, rootWidth);
  const sharedProps = {
    description: description || undefined,
    isDisabled,
    isIntegerOnly,
    isLabelHidden,
    isOptional: !isRequired && isOptional,
    isRequired,
    label,
    max,
    min,
    placeholder,
    size,
    status: status === 'none' ? undefined : { type: status, message: statusMessage || undefined },
    step,
    units: units || undefined,
    width: '100%',
  };
  const input = hasClear ? (
    <NumberInput {...sharedProps} hasClear onChange={setValue} value={value} />
  ) : (
    <NumberInput
      {...sharedProps}
      hasClear={false}
      onChange={setValue}
      value={typeof value === 'number' ? value : min}
    />
  );

  return (
    <div
      {...rootDomProps}
      className={cx('astryx-wb-field-root', className)}
      style={rootStyle}
    >
      {input}
    </div>
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
