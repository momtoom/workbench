import * as React from "react"
import { Toggle as TogglePrimitive } from "@base-ui/react/toggle"
import { ToggleGroup as ToggleGroupPrimitive } from "@base-ui/react/toggle-group"
import { type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Icon } from "@/components/ui/icon"
import { toggleVariants } from "@/components/ui/toggle"
import { isWorkbenchElementOfType } from "@/components/ui/workbench-runtime"

const ToggleGroupContext = React.createContext<
  VariantProps<typeof toggleVariants> & {
    spacing?: number
    orientation?: "horizontal" | "vertical"
  }
>({
  size: "default",
  variant: "default",
  spacing: 2,
  orientation: "horizontal",
})

type ToggleGroupValueInput = ToggleGroupPrimitive.Props["defaultValue"] | string

type ToggleGroupProps = Omit<ToggleGroupPrimitive.Props, "defaultValue" | "value"> &
  VariantProps<typeof toggleVariants> & {
    defaultValue?: ToggleGroupValueInput
    orientation?: "horizontal" | "vertical"
    spacing?: number
    value?: ToggleGroupValueInput
  }

function normalizeToggleGroupValue(
  value: ToggleGroupValueInput | undefined
): ToggleGroupPrimitive.Props["defaultValue"] | undefined {
  if (typeof value !== "string") return value

  const trimmed = value.trim()
  if (!trimmed || trimmed === "[]") return []

  const bracketMatch = trimmed.match(/^\[(.*)\]$/)
  const rawItems = bracketMatch ? bracketMatch[1] : trimmed
  return rawItems
    .split(",")
    .map((item) => item.trim().replace(/^['"]|['"]$/g, ""))
    .filter(Boolean)
}

function ToggleGroup({
  className,
  defaultValue,
  variant,
  size,
  spacing = 2,
  orientation = "horizontal",
  children,
  value,
  ...props
}: ToggleGroupProps) {
  const normalizedDefaultValue = normalizeToggleGroupValue(defaultValue)
  const normalizedValue = normalizeToggleGroupValue(value)

  return (
    <ToggleGroupPrimitive
      key={value === undefined ? JSON.stringify(normalizedDefaultValue ?? []) : undefined}
      data-slot="toggle-group"
      data-variant={variant}
      data-size={size}
      data-spacing={spacing}
      data-orientation={orientation}
      style={{ "--gap": spacing } as React.CSSProperties}
      className={cn(
        "group/toggle-group flex w-fit flex-row items-center gap-[--spacing(var(--gap))] rounded-lg data-[size=sm]:rounded-[min(var(--radius-md),10px)] data-vertical:flex-col data-vertical:items-stretch",
        className
      )}
      {...(value === undefined
        ? { defaultValue: normalizedDefaultValue }
        : { value: normalizedValue ?? [] })}
      {...props}
    >
      <ToggleGroupContext.Provider
        value={{ variant, size, spacing, orientation }}
      >
        {children}
      </ToggleGroupContext.Provider>
    </ToggleGroupPrimitive>
  )
}

function ToggleGroupItem({
  className,
  children,
  variant = "default",
  size = "default",
  ...props
}: TogglePrimitive.Props & VariantProps<typeof toggleVariants>) {
  const context = React.useContext(ToggleGroupContext)

  return (
    <TogglePrimitive
      data-slot="toggle-group-item"
      data-icon-only={isToggleGroupIconOnlyChildren(children) ? "" : undefined}
      data-variant={context.variant || variant}
      data-size={context.size || size}
      data-spacing={context.spacing}
      className={cn(
        "shrink-0 group-data-[spacing=0]/toggle-group:rounded-none group-data-[spacing=0]/toggle-group:px-2 focus:z-10 focus-visible:z-10 group-data-[spacing=0]/toggle-group:has-data-[icon=inline-end]:pr-1.5 group-data-[spacing=0]/toggle-group:has-data-[icon=inline-start]:pl-1.5 group-data-horizontal/toggle-group:data-[spacing=0]:first:rounded-l-lg group-data-vertical/toggle-group:data-[spacing=0]:first:rounded-t-lg group-data-horizontal/toggle-group:data-[spacing=0]:last:rounded-r-lg group-data-vertical/toggle-group:data-[spacing=0]:last:rounded-b-lg group-data-horizontal/toggle-group:data-[spacing=0]:data-[variant=outline]:border-l-0 group-data-vertical/toggle-group:data-[spacing=0]:data-[variant=outline]:border-t-0 group-data-horizontal/toggle-group:data-[spacing=0]:data-[variant=outline]:first:border-l group-data-vertical/toggle-group:data-[spacing=0]:data-[variant=outline]:first:border-t",
        toggleVariants({
          variant: context.variant || variant,
          size: context.size || size,
        }),
        className
      )}
      {...props}
    >
      {children}
    </TogglePrimitive>
  )
}

function isToggleGroupIconOnlyChildren(children: React.ReactNode): boolean {
  const childArray = React.Children.toArray(children)
  return childArray.length === 1 && isWorkbenchElementOfType(childArray[0], Icon, "Icon")
}

export { ToggleGroup, ToggleGroupItem }
