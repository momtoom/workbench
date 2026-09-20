import { DateRangeInput, type DateRange } from '@astryxdesign/core/DateRangeInput';
import type { ISODateString } from '@astryxdesign/core/Calendar';
import {
  useCallback,
  useEffect,
  useState,
  type ComponentPropsWithoutRef,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { cx } from './classNames';
import { useStableAstryxChildren } from './stableChildren';

export type AstryxDateRangeInputSize = 'sm' | 'md' | 'lg';
export type AstryxDateRangeInputStatus = 'none' | 'success' | 'warning' | 'error';

type RootProps = Omit<
  ComponentPropsWithoutRef<typeof DateRangeInput>,
  | 'className' | 'description' | 'hasClear' | 'isDisabled' | 'isLabelHidden'
  | 'isLoading' | 'isOptional' | 'isRequired' | 'label' | 'labelTooltip' | 'max'
  | 'min' | 'numberOfMonths' | 'onChange' | 'placeholder' | 'presets' | 'size'
  | 'status' | 'value' | 'width'
>;

export interface AstryxDateRangeInputProps extends RootProps {
  children?: ReactNode;
  label?: string;
  description?: string;
  defaultStart?: string;
  defaultEnd?: string;
  min?: string;
  max?: string;
  placeholder?: string;
  size?: AstryxDateRangeInputSize;
  status?: AstryxDateRangeInputStatus;
  statusMessage?: string;
  width?: string;
  numberOfMonths?: 1 | 2;
  hasClear?: boolean;
  hasPresets?: boolean;
  isDisabled?: boolean;
  isLoading?: boolean;
  isRequired?: boolean;
  isOptional?: boolean;
  isLabelHidden?: boolean;
  labelTooltip?: string;
  className?: string;
}

export function AstryxDateRangeInput({
  children,
  label = 'Project window',
  description = 'Choose a start and end date.',
  defaultStart = '2026-07-27',
  defaultEnd = '2026-08-02',
  min = '',
  max = '',
  placeholder = 'Select a date range',
  size = 'md',
  status = 'none',
  statusMessage = '',
  width = '360px',
  numberOfMonths = 2,
  hasClear = true,
  hasPresets = true,
  isDisabled = false,
  isLoading = false,
  isRequired = false,
  isOptional = false,
  isLabelHidden = false,
  labelTooltip = '',
  className,
  ...rootProps
}: AstryxDateRangeInputProps) {
  const stableChildren = useStableAstryxChildren(children);
  const [value, setValue] = useState<DateRange | null>(toRange(defaultStart, defaultEnd));
  useEffect(() => setValue(toRange(defaultStart, defaultEnd)), [defaultEnd, defaultStart]);
  const handlePresetClick = useCallback((event: MouseEvent<HTMLDivElement>) => {
    const eventTarget = event.target as {
      closest?: (selector: string) => HTMLElement | null;
    } | null;
    const target = eventTarget?.closest?.('[data-astryx-wb-date-range-preset]') ?? null;
    if (!target || isDisabled) return;
    const nextRange = toRange(target.dataset.start ?? '', target.dataset.end ?? '');
    if (nextRange) setValue(nextRange);
  }, [isDisabled]);

  return (
    <div className={cx('astryx-wb-date-range-input', className)}>
      <DateRangeInput
        {...rootProps}
        className="astryx-wb-date-range-input__field"
        description={description || undefined}
        hasClear={hasClear}
        isDisabled={isDisabled}
        isLabelHidden={isLabelHidden}
        isLoading={isLoading}
        isOptional={isOptional}
        isRequired={isRequired}
        label={label}
        labelTooltip={labelTooltip || undefined}
        max={iso(max)}
        min={iso(min)}
        numberOfMonths={numberOfMonths}
        onChange={setValue}
        placeholder={placeholder}
        size={size}
        status={status === 'none' ? undefined : { type: status, message: statusMessage || `${status} status` }}
        value={value}
        width={resolveWidth(width)}
      />
      {hasPresets ? (
        <div
          aria-label={`${label} presets`}
          className="astryx-wb-date-range-input__presets"
          onClick={handlePresetClick}
        >
          {stableChildren}
        </div>
      ) : null}
    </div>
  );
}

AstryxDateRangeInput.displayName = 'AstryxDateRangeInput';

function iso(value: string): ISODateString | undefined {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? (value as ISODateString) : undefined;
}
function toRange(start: string, end: string): DateRange | null {
  const startDate = iso(start);
  const endDate = iso(end);
  return startDate && endDate ? { start: startDate, end: endDate } : null;
}
function resolveWidth(value: string): number | string {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : value;
}
