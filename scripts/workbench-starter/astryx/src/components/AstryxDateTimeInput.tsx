import { DateTimeInput, type ISODateTimeString } from '@astryxdesign/core/DateTimeInput';
import { useEffect, useState, type ComponentPropsWithoutRef } from 'react';
import { cx } from './classNames';

export type AstryxDateTimeInputHourFormat = '12h' | '24h';
export type AstryxDateTimeInputSize = 'sm' | 'md' | 'lg';
export type AstryxDateTimeInputStatus = 'none' | 'success' | 'warning' | 'error';
export type AstryxDateTimeInputIncrement = 1 | 5 | 10 | 15 | 30;

type RootProps = Omit<
  ComponentPropsWithoutRef<typeof DateTimeInput>,
  | 'className' | 'description' | 'hasClear' | 'hasSeconds' | 'hourFormat'
  | 'isDisabled' | 'isLabelHidden' | 'isLoading' | 'isOptional' | 'isRequired'
  | 'label' | 'labelTooltip' | 'numberOfMonths' | 'onChange' | 'placeholder'
  | 'size' | 'status' | 'timeIncrement' | 'value' | 'width'
>;

export interface AstryxDateTimeInputProps extends RootProps {
  label?: string;
  description?: string;
  defaultValue?: string;
  placeholder?: string;
  size?: AstryxDateTimeInputSize;
  status?: AstryxDateTimeInputStatus;
  statusMessage?: string;
  width?: string;
  numberOfMonths?: 1 | 2;
  hourFormat?: AstryxDateTimeInputHourFormat;
  timeIncrement?: AstryxDateTimeInputIncrement;
  hasSeconds?: boolean;
  hasClear?: boolean;
  isDisabled?: boolean;
  isLoading?: boolean;
  isRequired?: boolean;
  isOptional?: boolean;
  isLabelHidden?: boolean;
  labelTooltip?: string;
  className?: string;
}

export function AstryxDateTimeInput({
  label = 'Publish time',
  description = 'Choose the date and local time.',
  defaultValue = '2026-07-27T14:30',
  placeholder = 'Select date and time',
  size = 'md',
  status = 'none',
  statusMessage = '',
  width = '100%',
  numberOfMonths = 1,
  hourFormat = '12h',
  timeIncrement = 15,
  hasSeconds = false,
  hasClear = true,
  isDisabled = false,
  isLoading = false,
  isRequired = false,
  isOptional = false,
  isLabelHidden = false,
  labelTooltip = '',
  className,
  ...rootProps
}: AstryxDateTimeInputProps) {
  const [value, setValue] = useState<ISODateTimeString | undefined>(toDateTime(defaultValue));
  useEffect(() => setValue(toDateTime(defaultValue)), [defaultValue]);
  return (
    <DateTimeInput
      {...rootProps}
      className={cx('astryx-wb-date-time-input', className)}
      description={description || undefined}
      hasClear={hasClear}
      hasSeconds={hasSeconds}
      hourFormat={hourFormat}
      isDisabled={isDisabled}
      isLabelHidden={isLabelHidden}
      isLoading={isLoading}
      isOptional={isOptional}
      isRequired={isRequired}
      label={label}
      labelTooltip={labelTooltip || undefined}
      numberOfMonths={numberOfMonths}
      onChange={setValue}
      placeholder={placeholder}
      size={size}
      status={status === 'none' ? undefined : { type: status, message: statusMessage || `${status} status` }}
      timeIncrement={timeIncrement}
      value={value}
      width={resolveWidth(width)}
    />
  );
}
function toDateTime(value: string): ISODateTimeString | undefined {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(value)
    ? (value as ISODateTimeString)
    : undefined;
}
function resolveWidth(value: string): number | string {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : value;
}
