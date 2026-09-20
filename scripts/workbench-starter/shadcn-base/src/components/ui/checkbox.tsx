"use client"

import * as React from "react"
import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox"

import { cn } from "@/lib/utils"
import { RiCheckLine } from "@remixicon/react"

function Checkbox({ className, ...props }: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer relative flex size-4 shrink-0 items-center justify-center rounded-sm border border-input transition-colors outline-none group-has-disabled/field:opacity-50 after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 aria-invalid:aria-checked:border-primary dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground dark:data-checked:bg-primary",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none [&>svg]:size-3.5"
      >
        <RiCheckLine
        />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

type CheckboxFieldProps = Omit<
  CheckboxPrimitive.Root.Props,
  "children" | "className"
> & {
  checkboxClassName?: string
  className?: string
  description?: React.ReactNode
  label?: React.ReactNode
}

function CheckboxField({
  checkboxClassName,
  className,
  description,
  label,
  ...props
}: CheckboxFieldProps) {
  return (
    <label
      data-slot="checkbox-field"
      className={cn("flex w-fit items-start gap-2 text-sm", className)}
    >
      <Checkbox className={cn("mt-0.5", checkboxClassName)} {...props} />
      {label || description ? (
        <span className="grid gap-1 leading-none">
          {label ? (
            <span data-slot="checkbox-field-label" className="font-medium">
              {label}
            </span>
          ) : null}
          {description ? (
            <span
              data-slot="checkbox-field-description"
              className="text-muted-foreground"
            >
              {description}
            </span>
          ) : null}
        </span>
      ) : null}
    </label>
  )
}

export { Checkbox, CheckboxField }
