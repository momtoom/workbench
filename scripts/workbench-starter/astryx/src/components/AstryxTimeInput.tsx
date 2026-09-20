import { TimeInput } from '@astryxdesign/core/TimeInput';
import type { ISOTimeString } from '@astryxdesign/core/TimeInput';
import { useEffect, useState, type ComponentPropsWithoutRef } from 'react';
import { resolveAstryxFieldRootProps } from './AstryxFieldRoot';
import { cx } from './classNames';

export type AstryxTimeInputHourFormat = '12h' | '24h';
export type AstryxTimeInputSize = 'sm' | 'md' | 'lg';
export type AstryxTimeInputStatus = 'none' | 'success' | 'warning' | 'error';

type AstryxTimeInputRootProps = Omit<
  ComponentPropsWithoutRef<typeof TimeInput>,
  | 'className'
  | 'description'
  | 'hasAutoFocus'
  | 'hasClear'
  | 'hasSeconds'
  | 'hourFormat'
  | 'increment'
  | 'isDisabled'
  | 'isLabelHidden'
  | 'isLoading'
  | 'isOptional'
  | 'isRequired'
  | 'label'
  | 'labelTooltip'
  | 'max'
  | 'min'
  | 'onChange'
  | 'placeholder'
  | 'size'
  | 'status'
  | 'value'
  | 'width'
>;

export interface AstryxTimeInputProps extends AstryxTimeInputRootProps {
  label?: string;
  description?: string;
  defaultValue?: string;
  min?: string;
  max?: string;
  placeholder?: string;
  size?: AstryxTimeInputSize;
  status?: AstryxTimeInputStatus;
  statusMessage?: string;
  width?: string;
  hourFormat?: AstryxTimeInputHourFormat;
  increment?: number;
  hasSeconds?: boolean;
  hasClear?: boolean;
  hasAutoFocus?: boolean;
  isDisabled?: boolean;
  isLoading?: boolean;
  isRequired?: boolean;
  isOptional?: boolean;
  isLabelHidden?: boolean;
  labelTooltip?: string;
  className?: string;
}

export function AstryxTimeInput({
  label = 'Start time',
  description = '',
  defaultValue = '09:30',
  min = '',
  max = '',
  placeholder = 'Select a time',
  size = 'md',
  status = 'none',
  statusMessage = '',
  width = '240px',
  hourFormat = '12h',
  increment = 15,
  hasSeconds = false,
  hasClear = true,
  hasAutoFocus = false,
  isDisabled = false,
  isLoading = false,
  isRequired = false,
  isOptional = false,
  isLabelHidden = false,
  labelTooltip = '',
  className,
  ...rootProps
}: AstryxTimeInputProps) {
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
      <TimeInput
        className="astryx-wb-time-input"
        description={description || undefined}
        hasAutoFocus={hasAutoFocus}
        hasClear={hasClear}
        hasSeconds={hasSeconds}
        hourFormat={hourFormat}
        increment={increment}
        isDisabled={isDisabled}
        isLabelHidden={isLabelHidden}
        isLoading={isLoading}
        isOptional={isOptional}
        isRequired={isRequired}
        label={label}
        labelTooltip={labelTooltip || undefined}
        max={toISOTime(max)}
        min={toISOTime(min)}
        onChange={(nextValue) => setValue(nextValue)}
        placeholder={placeholder}
        size={size}
        status={resolveInputStatus(status, statusMessage)}
        value={toISOTime(value)}
        width="100%"
      />
    </div>
  );
}

function toISOTime(value: string | undefined): ISOTimeString | undefined {
  if (!value || !/^\d{2}:\d{2}(:\d{2})?$/.test(value)) return undefined;
  return value as ISOTimeString;
}

function resolveInputStatus(status: AstryxTimeInputStatus, message: string) {
  return status === 'none' ? undefined : { type: status, message: message || `${status} status` };
}

function resolveAstryxFieldWidth(width: string): string {
  if (width === 'inherit') return '';
  if (width === 'full') return '100%';
  if (width === 'sm') return '160px';
  if (width === 'md') return '240px';
  if (width === 'lg') return '320px';
  return width;
}
