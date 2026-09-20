"use client"

import * as React from "react"
import { format } from "date-fns"
import type { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { splitWorkbenchRuntimeRootProps } from "@/components/ui/workbench-runtime"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { RiCalendarLine } from "@remixicon/react"

type DateInput = Date | string
type DateRangeInput =
  | DateRange
  | {
      from?: DateInput
      to?: DateInput
    }

type DateRangePickerProps = {
  align?: React.ComponentProps<typeof PopoverContent>["align"]
  buttonVariant?: React.ComponentProps<typeof Calendar>["buttonVariant"]
  captionLayout?: React.ComponentProps<typeof Calendar>["captionLayout"]
  className?: string
  defaultFrom?: DateInput
  defaultTo?: DateInput
  defaultValue?: DateRangeInput
  defaultOpen?: boolean
  disabled?: boolean
  formatPattern?: string
  numberOfMonths?: number
  onValueChange?: (range: DateRange | undefined) => void
  placeholder?: string
  showOutsideDays?: boolean
  side?: React.ComponentProps<typeof PopoverContent>["side"]
  timeZone?: React.ComponentProps<typeof Calendar>["timeZone"]
  value?: DateRangeInput
  variant?: React.ComponentProps<typeof Button>["variant"]
}

function DateRangePicker({
  align = "start",
  buttonVariant,
  captionLayout = "label",
  className,
  defaultFrom,
  defaultTo,
  defaultValue,
  defaultOpen,
  disabled,
  formatPattern = "LLL dd, y",
  numberOfMonths = 2,
  onValueChange,
  placeholder = "Pick a date range",
  showOutsideDays = true,
  side = "bottom",
  timeZone,
  value,
  variant = "outline",
  ...props
}: DateRangePickerProps) {
  const [internalValue, setInternalValue] = React.useState<DateRange | undefined>(() =>
    normalizeDateRangePickerRange(defaultValue) ??
    normalizeDateRangePickerRange({ from: defaultFrom, to: defaultTo })
  )
  const selectedRange = value === undefined ? internalValue : normalizeDateRangePickerRange(value)
  const { runtimeRootProps } = splitWorkbenchRuntimeRootProps(
    props as Record<string, unknown>
  )

  function handleSelect(nextRange: DateRange | undefined) {
    if (value === undefined) {
      setInternalValue(nextRange)
    }
    onValueChange?.(nextRange)
  }

  const label = formatDateRangeLabel(selectedRange, formatPattern, placeholder)

  return (
    <Popover defaultOpen={defaultOpen}>
      <PopoverTrigger
        render={<Button variant={variant} disabled={disabled} />}
        className={cn(
          "w-70 justify-start text-left font-normal",
          !selectedRange?.from && "text-muted-foreground",
          className
        )}
        {...runtimeRootProps}
      >
        <RiCalendarLine className="size-4" />
        {label}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align={align} side={side}>
        <Calendar
          buttonVariant={buttonVariant}
          captionLayout={captionLayout}
          mode="range"
          defaultMonth={selectedRange?.from}
          numberOfMonths={numberOfMonths}
          selected={selectedRange}
          showOutsideDays={showOutsideDays}
          timeZone={timeZone}
          onSelect={handleSelect}
        />
      </PopoverContent>
    </Popover>
  )
}

function formatDateRangeLabel(
  range: DateRange | undefined,
  formatPattern: string,
  placeholder: string
) {
  if (!range?.from) return placeholder
  if (!range.to) return format(range.from, formatPattern)
  return `${format(range.from, formatPattern)} - ${format(range.to, formatPattern)}`
}

function normalizeDateRangePickerRange(range: DateRangeInput | undefined): DateRange | undefined {
  if (!range) return undefined
  const from = normalizeDateRangePickerDate(range.from)
  const to = normalizeDateRangePickerDate(range.to)
  if (!from && !to) return undefined
  return { from, to }
}

function normalizeDateRangePickerDate(value: DateInput | undefined): Date | undefined {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? undefined : value
  if (typeof value !== "string" || !value.trim()) return undefined

  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim())
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch
    return new Date(Number(year), Number(month) - 1, Number(day))
  }

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

export { DateRangePicker }
