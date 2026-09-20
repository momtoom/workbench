"use client"

import * as React from "react"
import { format } from "date-fns"

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

type DatePickerProps = {
  align?: React.ComponentProps<typeof PopoverContent>["align"]
  buttonVariant?: React.ComponentProps<typeof Calendar>["buttonVariant"]
  captionLayout?: React.ComponentProps<typeof Calendar>["captionLayout"]
  className?: string
  defaultValue?: Date | string
  defaultOpen?: boolean
  disabled?: boolean
  formatPattern?: string
  numberOfMonths?: number
  onValueChange?: (date: Date | undefined) => void
  placeholder?: string
  showOutsideDays?: boolean
  side?: React.ComponentProps<typeof PopoverContent>["side"]
  timeZone?: React.ComponentProps<typeof Calendar>["timeZone"]
  value?: Date | string
  variant?: React.ComponentProps<typeof Button>["variant"]
}

function DatePicker({
  align = "start",
  buttonVariant,
  captionLayout = "label",
  className,
  defaultValue,
  defaultOpen,
  disabled,
  formatPattern = "PPP",
  numberOfMonths = 1,
  onValueChange,
  placeholder = "Pick a date",
  showOutsideDays = true,
  side = "bottom",
  timeZone,
  value,
  variant = "outline",
  ...props
}: DatePickerProps) {
  const [internalValue, setInternalValue] = React.useState<Date | undefined>(() =>
    normalizeDatePickerDate(defaultValue)
  )
  const selectedDate = value === undefined ? internalValue : normalizeDatePickerDate(value)
  const { runtimeRootProps } = splitWorkbenchRuntimeRootProps(
    props as Record<string, unknown>
  )

  function handleSelect(nextDate: Date | undefined) {
    if (value === undefined) {
      setInternalValue(nextDate)
    }
    onValueChange?.(nextDate)
  }

  return (
    <Popover defaultOpen={defaultOpen}>
      <PopoverTrigger
        render={<Button variant={variant} disabled={disabled} />}
        className={cn(
          "w-60 justify-start text-left font-normal",
          !selectedDate && "text-muted-foreground",
          className
        )}
        {...runtimeRootProps}
      >
        <RiCalendarLine className="size-4" />
        {selectedDate ? format(selectedDate, formatPattern) : placeholder}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align={align} side={side}>
        <Calendar
          buttonVariant={buttonVariant}
          captionLayout={captionLayout}
          mode="single"
          numberOfMonths={numberOfMonths}
          selected={selectedDate}
          showOutsideDays={showOutsideDays}
          timeZone={timeZone}
          onSelect={handleSelect}
        />
      </PopoverContent>
    </Popover>
  )
}

function normalizeDatePickerDate(value: Date | string | undefined): Date | undefined {
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

export { DatePicker }
