import * as React from "react"
import { Switch as SwitchPrimitive } from "@base-ui/react/switch"

import { cn } from "@/lib/utils"

function Switch({
  className,
  size = "default",
  ...props
}: SwitchPrimitive.Root.Props & {
  size?: "sm" | "default"
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        "peer group/switch relative inline-flex shrink-0 items-center rounded-full border border-transparent transition-all outline-none [--wb-switch-track-width:var(--ds-token-workbench-components-switch-track-width)] [--wb-switch-track-height:var(--ds-token-workbench-components-switch-track-height)] [--wb-switch-thumb-size:var(--ds-token-workbench-components-switch-thumb-size)] [--wb-switch-border-width:var(--border-width,1px)] [--wb-switch-thumb-inset:calc((var(--wb-switch-track-height)_-_var(--wb-switch-thumb-size))_/_2)] [--wb-switch-thumb-start:calc(var(--wb-switch-thumb-inset)_-_var(--wb-switch-border-width))] [--wb-switch-thumb-x:var(--wb-switch-thumb-start)] after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 h-[var(--wb-switch-track-height)] w-[var(--wb-switch-track-width)] data-[size=sm]:[--wb-switch-track-width:calc(var(--spacing)*6)] data-[size=sm]:[--wb-switch-track-height:calc(var(--spacing)*3.5)] data-[size=sm]:[--wb-switch-thumb-size:calc(var(--spacing)*3)] data-checked:[--wb-switch-thumb-x:calc(var(--wb-switch-track-width)_-_var(--wb-switch-thumb-size)_-_var(--wb-switch-thumb-inset)_-_var(--wb-switch-border-width))] data-unchecked:[--wb-switch-thumb-x:var(--wb-switch-thumb-start)] dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-checked:bg-primary data-unchecked:bg-input dark:data-unchecked:bg-input/80 data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block size-[var(--wb-switch-thumb-size)] rounded-full bg-background ring-0 [transform:translateX(var(--wb-switch-thumb-x))] transition-transform dark:group-data-checked/switch:bg-primary-foreground dark:group-data-unchecked/switch:bg-foreground"
      />
    </SwitchPrimitive.Root>
  )
}

type SwitchFieldProps = Omit<
  React.ComponentProps<typeof Switch>,
  "children" | "className"
> & {
  className?: string
  description?: React.ReactNode
  label?: React.ReactNode
  switchClassName?: string
}

function SwitchField({
  className,
  description,
  label,
  switchClassName,
  ...props
}: SwitchFieldProps) {
  return (
    <label
      data-slot="switch-field"
      className={cn("flex w-fit items-start gap-2 text-sm", className)}
    >
      <Switch className={cn("mt-0.5", switchClassName)} {...props} />
      {label || description ? (
        <span className="grid gap-1 leading-none">
          {label ? (
            <span data-slot="switch-field-label" className="font-medium">
              {label}
            </span>
          ) : null}
          {description ? (
            <span
              data-slot="switch-field-description"
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

export { Switch, SwitchField }
