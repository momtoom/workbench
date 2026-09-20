import * as React from "react"
import {
  DayPicker,
  getDefaultClassNames,
  type DayButton,
  type Locale,
} from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import { RiArrowLeftSLine, RiArrowRightSLine, RiArrowDownSLine } from "@remixicon/react"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  cellSize,
  defaultMonthDate,
  fluid = false,
  locale,
  formatters,
  components,
  selectedDate,
  style,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"]
  cellSize?: number | string
  defaultMonthDate?: string
  fluid?: boolean
  selectedDate?: string
}) {
  const defaultClassNames = getDefaultClassNames()
  const formattedCellSize = cellSize === undefined ? null : formatCalendarCellSize(cellSize)
  const parsedDefaultMonth = parseCalendarDate(defaultMonthDate)
  const parsedSelectedDate = parseCalendarDate(selectedDate)
  const dayPickerProps = {
    ...props,
    ...(parsedDefaultMonth ? { defaultMonth: parsedDefaultMonth } : null),
    ...(props.mode === "single" && parsedSelectedDate ? { selected: parsedSelectedDate } : null),
  } as React.ComponentProps<typeof DayPicker>
  const calendarStyle = {
    ...(formattedCellSize ? { "--cell-size": formattedCellSize } : null),
    ...style,
  } as React.CSSProperties

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "group/calendar bg-background p-2 [--cell-radius:var(--radius-md)] [--cell-size:--spacing(7)] in-data-[slot=card-content]:bg-transparent in-data-[slot=popover-content]:bg-transparent",
        fluid ? "h-full w-full" : "",
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className
      )}
      captionLayout={captionLayout}
      locale={locale}
      style={calendarStyle}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString(locale?.code, { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: cn(fluid ? "h-full w-full" : "w-fit", defaultClassNames.root),
        months: cn(
          "relative flex flex-col gap-4 md:flex-row",
          fluid ? "h-full min-h-0" : "",
          defaultClassNames.months
        ),
        month: cn("flex w-full flex-col gap-4", fluid ? "h-full min-h-0" : "", defaultClassNames.month),
        nav: cn(
          "absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1",
          defaultClassNames.nav
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-(--cell-size) p-0 select-none aria-disabled:opacity-50",
          defaultClassNames.button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-(--cell-size) p-0 select-none aria-disabled:opacity-50",
          defaultClassNames.button_next
        ),
        month_caption: cn(
          "flex h-(--cell-size) w-full items-center justify-center px-(--cell-size)",
          fluid ? "shrink-0" : "",
          defaultClassNames.month_caption
        ),
        dropdowns: cn(
          "flex h-(--cell-size) w-full items-center justify-center gap-1.5 text-sm font-medium",
          defaultClassNames.dropdowns
        ),
        dropdown_root: cn(
          "relative rounded-(--cell-radius)",
          defaultClassNames.dropdown_root
        ),
        dropdown: cn(
          "absolute inset-0 bg-popover opacity-0",
          defaultClassNames.dropdown
        ),
        caption_label: cn(
          "font-medium select-none",
          captionLayout === "label"
            ? "text-sm"
            : "flex items-center gap-1 rounded-(--cell-radius) text-sm [&>svg]:size-3.5 [&>svg]:text-muted-foreground",
          defaultClassNames.caption_label
        ),
        month_grid: cn("w-full border-collapse", fluid ? "flex min-h-0 flex-1 flex-col" : "", defaultClassNames.month_grid),
        weekdays: cn("flex", fluid ? "shrink-0" : "", defaultClassNames.weekdays),
        weekday: cn(
          "flex flex-1 items-center justify-center rounded-(--cell-radius) text-center text-xs font-normal text-muted-foreground select-none",
          defaultClassNames.weekday
        ),
        week: cn(
          fluid ? "flex min-h-(--cell-size) w-full" : "mt-2 flex w-full",
          defaultClassNames.week
        ),
        weeks: cn(
          fluid ? "grid min-h-0 flex-1 grid-rows-[repeat(6,minmax(0,1fr))] gap-2" : "",
          defaultClassNames.weeks
        ),
        week_number_header: cn(
          "w-(--cell-size) shrink-0 select-none",
          fluid ? "basis-(--cell-size)" : "",
          defaultClassNames.week_number_header
        ),
        week_number: cn(
          "flex w-(--cell-size) shrink-0 items-center justify-center text-xs text-muted-foreground select-none",
          fluid ? "basis-(--cell-size) min-h-(--cell-size)" : "h-(--cell-size)",
          defaultClassNames.week_number
        ),
        day: cn(
          "group/day relative flex h-full w-full items-center justify-center rounded-(--cell-radius) p-0 text-center select-none [&:last-child[data-selected=true]_button]:rounded-r-(--cell-radius)",
          props.showWeekNumber
            ? "[&:nth-child(2)[data-selected=true]_button]:rounded-l-(--cell-radius)"
            : "[&:first-child[data-selected=true]_button]:rounded-l-(--cell-radius)",
          fluid ? "min-h-(--cell-size) flex-1" : "aspect-square",
          defaultClassNames.day
        ),
        range_start: cn(
          "relative isolate z-0 rounded-l-(--cell-radius) bg-muted after:absolute after:inset-y-0 after:right-0 after:w-4 after:bg-muted",
          defaultClassNames.range_start
        ),
        range_middle: cn("rounded-none", defaultClassNames.range_middle),
        range_end: cn(
          "relative isolate z-0 rounded-r-(--cell-radius) bg-muted after:absolute after:inset-y-0 after:left-0 after:w-4 after:bg-muted",
          defaultClassNames.range_end
        ),
        today: cn(
          "rounded-(--cell-radius) bg-muted text-foreground data-[selected=true]:rounded-none",
          defaultClassNames.today
        ),
        outside: cn(
          "text-muted-foreground aria-selected:text-muted-foreground",
          defaultClassNames.outside
        ),
        disabled: cn(
          "text-muted-foreground opacity-50",
          defaultClassNames.disabled
        ),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return (
            <div
              data-slot="calendar"
              ref={rootRef}
              className={cn(className)}
              {...props}
            />
          )
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return (
              <RiArrowLeftSLine className={cn("size-4", className)} {...props} />
            )
          }

          if (orientation === "right") {
            return (
              <RiArrowRightSLine className={cn("size-4", className)} {...props} />
            )
          }

          return (
            <RiArrowDownSLine className={cn("size-4", className)} {...props} />
          )
        },
        DayButton: ({ ...props }) => (
          <CalendarDayButton fluid={fluid} locale={locale} {...props} />
        ),
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div className={cn("flex items-center justify-center text-center", fluid ? "h-full min-h-0 w-full" : "size-(--cell-size)")}>
                {children}
              </div>
            </td>
          )
        },
        ...components,
      }}
      {...dayPickerProps}
    />
  )
}

function formatCalendarCellSize(value: number | string): string | null {
  if (typeof value === "number") return `${value}px`
  const trimmed = value.trim()
  if (!trimmed || trimmed.includes("%")) return null
  if (/^\d+(?:\.\d+)?$/.test(trimmed)) return `${trimmed}px`
  return trimmed
}

function parseCalendarDate(value: string | undefined): Date | null {
  const match = value?.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2]) - 1
  const day = Number(match[3])
  const date = new Date(year, month, day)
  return date.getFullYear() === year && date.getMonth() === month && date.getDate() === day
    ? date
    : null
}

function CalendarDayButton({
  className,
  day,
  fluid = false,
  modifiers,
  locale,
  style,
  ...props
}: React.ComponentProps<typeof DayButton> & { fluid?: boolean; locale?: Partial<Locale> }) {
  const defaultClassNames = getDefaultClassNames()

  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  return (
    <Button
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString(locale?.code)}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      data-calendar-day-button="true"
      className={cn(
        "relative isolate z-10 flex size-auto w-full flex-col items-center justify-center gap-1 border-0 text-center leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-[3px] group-data-[focused=true]/day:ring-ring/50 data-[range-end=true]:rounded-(--cell-radius) data-[range-end=true]:rounded-r-(--cell-radius) data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground data-[range-middle=true]:rounded-none data-[range-middle=true]:bg-muted data-[range-middle=true]:text-foreground data-[range-start=true]:rounded-(--cell-radius) data-[range-start=true]:rounded-l-(--cell-radius) data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground dark:hover:text-foreground [&>span]:text-xs [&>span]:opacity-70",
        fluid ? "h-full min-h-(--cell-size) min-w-0" : "aspect-square min-w-(--cell-size)",
        defaultClassNames.day,
        className
      )}
      style={fluid ? { height: "100%", minHeight: "var(--cell-size)", minWidth: 0, width: "100%", ...style } : style}
      {...props}
    />
  )
}

export { Calendar, CalendarDayButton }
