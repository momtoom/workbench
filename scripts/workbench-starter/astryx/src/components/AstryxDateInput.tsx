import { DateInput } from '@astryxdesign/core/DateInput';
import type { ISODateString } from '@astryxdesign/core/Calendar';
import { useEffect, useState, type ComponentPropsWithoutRef } from 'react';
import { resolveAstryxFieldRootProps } from './AstryxFieldRoot';
import { cx } from './classNames';

export type AstryxDateInputSize = 'sm' | 'md' | 'lg';
export type AstryxDateInputStatus = 'none' | 'success' | 'warning' | 'error';

type AstryxDateInputRootProps = Omit<
  ComponentPropsWithoutRef<typeof DateInput>,
  | 'className'
  | 'description'
  | 'hasClear'
  | 'isDisabled'
  | 'isLabelHidden'
  | 'isLoading'
  | 'isOptional'
  | 'isRequired'
  | 'label'
  | 'labelTooltip'
  | 'max'
  | 'min'
  | 'numberOfMonths'
  | 'onChange'
  | 'placeholder'
  | 'size'
  | 'status'
  | 'value'
  | 'width'
>;

export interface AstryxDateInputProps extends AstryxDateInputRootProps {
  label?: string;
  description?: string;
  defaultValue?: string;
  min?: string;
  max?: string;
  placeholder?: string;
  size?: AstryxDateInputSize;
  status?: AstryxDateInputStatus;
  statusMessage?: string;
  width?: string;
  numberOfMonths?: 1 | 2;
  hasClear?: boolean;
  isDisabled?: boolean;
  isLoading?: boolean;
  isRequired?: boolean;
  isOptional?: boolean;
  isLabelHidden?: boolean;
  labelTooltip?: string;
  className?: string;
}

export function AstryxDateInput({
  label = 'Due date',
  description = '',
  defaultValue = '2026-07-05',
  min = '',
  max = '',
  placeholder = 'Select a date',
  size = 'md',
  status = 'none',
  statusMessage = '',
  width = '320px',
  numberOfMonths = 1,
  hasClear = true,
  isDisabled = false,
  isLoading = false,
  isRequired = false,
  isOptional = false,
  isLabelHidden = false,
  labelTooltip = '',
  className,
  ...rootProps
}: AstryxDateInputProps) {
  const [value, setValue] = useState<string | undefined>(defaultValue || undefined);

  useEffect(() => {
    setValue(defaultValue || undefined);
  }, [defaultValue]);
  const rootWidth = resolveAstryxFieldWidth(width);
  const { rootDomProps, rootStyle } = resolveAstryxFieldRootProps(rootProps, rootWidth);

  return (
    <div
      {...rootDomProps}
      className={cx('astryx-wb-field-root', className)}
      style={rootStyle}
    >
      <DateInput
        className="astryx-wb-date-input"
        description={description || undefined}
        hasClear={hasClear}
        isDisabled={isDisabled}
        isLabelHidden={isLabelHidden}
        isLoading={isLoading}
        isOptional={isOptional}
        isRequired={isRequired}
        label={label}
        labelTooltip={labelTooltip || undefined}
        max={toISODate(max)}
        min={toISODate(min)}
        numberOfMonths={numberOfMonths}
        onChange={(nextValue) => setValue(nextValue)}
        placeholder={placeholder}
        size={size}
        status={resolveInputStatus(status, statusMessage)}
        value={toISODate(value)}
        width="100%"
      />
    </div>
  );
}

function toISODate(value: string | undefined): ISODateString | undefined {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  return value as ISODateString;
}

function resolveInputStatus(status: AstryxDateInputStatus, message: string) {
  return status === 'none' ? undefined : { type: status, message: message || `${status} status` };
}

function resolveAstryxFieldWidth(width: string): string {
  if (width === 'inherit') return '';
  if (width === 'full') return '100%';
  if (width === 'sm') return '240px';
  if (width === 'md') return '320px';
  if (width === 'lg') return '480px';
  return width;
}
