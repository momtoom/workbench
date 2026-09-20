import {
  Calendar,
  type DateRange,
  type ISODateString,
} from '@astryxdesign/core/Calendar';
import { useEffect, useState, type ComponentPropsWithoutRef } from 'react';
import { cx } from './classNames';

export type AstryxCalendarMode = 'single' | 'range';
export type AstryxCalendarWeekStart = 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat';

type AstryxCalendarRootProps = Omit<
  ComponentPropsWithoutRef<typeof Calendar>,
  | 'className'
  | 'defaultValue'
  | 'focusDate'
  | 'hasOutsideDays'
  | 'hasVariableRowCount'
  | 'hasWeekNumbers'
  | 'max'
  | 'min'
  | 'mode'
  | 'numberOfMonths'
  | 'onChange'
  | 'value'
  | 'weekStartsOn'
>;

export interface AstryxCalendarProps extends AstryxCalendarRootProps {
  mode?: AstryxCalendarMode;
  defaultValue?: string;
  defaultRangeStart?: string;
  defaultRangeEnd?: string;
  focusDate?: string;
  min?: string;
  max?: string;
  numberOfMonths?: 1 | 2;
  weekStartsOn?: AstryxCalendarWeekStart;
  hasOutsideDays?: boolean;
  hasWeekNumbers?: boolean;
  hasVariableRowCount?: boolean;
  className?: string;
}

export function AstryxCalendar({
  mode = 'single',
  defaultValue = '2026-07-27',
  defaultRangeStart = '2026-07-27',
  defaultRangeEnd = '2026-08-02',
  focusDate = '',
  min = '',
  max = '',
  numberOfMonths = 1,
  weekStartsOn = 'sun',
  hasOutsideDays = true,
  hasWeekNumbers = false,
  hasVariableRowCount = false,
  className,
  ...rootProps
}: AstryxCalendarProps) {
  const [singleValue, setSingleValue] = useState<ISODateString | undefined>(toISODate(defaultValue));
  const [rangeValue, setRangeValue] = useState<DateRange | undefined>(
    toDateRange(defaultRangeStart, defaultRangeEnd),
  );

  useEffect(() => setSingleValue(toISODate(defaultValue)), [defaultValue]);
  useEffect(
    () => setRangeValue(toDateRange(defaultRangeStart, defaultRangeEnd)),
    [defaultRangeEnd, defaultRangeStart],
  );

  const sharedProps = {
    ...rootProps,
    className: cx('astryx-wb-calendar', className),
    focusDate: toISODate(focusDate),
    hasOutsideDays,
    hasVariableRowCount,
    hasWeekNumbers,
    max: toISODate(max),
    min: toISODate(min),
    numberOfMonths,
    weekStartsOn,
  };

  return mode === 'range' ? (
    <Calendar {...sharedProps} mode="range" onChange={setRangeValue} value={rangeValue} />
  ) : (
    <Calendar {...sharedProps} mode="single" onChange={setSingleValue} value={singleValue} />
  );
}

function toISODate(value: string): ISODateString | undefined {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? (value as ISODateString) : undefined;
}

function toDateRange(start: string, end: string): DateRange | undefined {
  const parsedStart = toISODate(start);
  const parsedEnd = toISODate(end);
  return parsedStart && parsedEnd ? { start: parsedStart, end: parsedEnd } : undefined;
}
