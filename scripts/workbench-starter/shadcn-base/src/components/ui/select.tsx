"use client"

import * as React from "react"
import { Select as SelectPrimitive } from "@base-ui/react/select"

import { cn } from "@/lib/utils"
import {
  isWorkbenchElementOfType,
  isWorkbenchElementOfTypes,
  splitWorkbenchRuntimeRootProps,
} from "@/components/ui/workbench-runtime"
import { useWorkbenchPortalContainer } from "@/lib/workbench-portal"
import { RiArrowDownSLine, RiCheckLine, RiArrowUpSLine } from "@remixicon/react"

type SelectWorkbenchLabelRegistry = {
  authoredLabelsByValue: ReadonlyMap<string, React.ReactNode>
  clearLabelForValue: (valueKey: string, label: React.ReactNode) => void
  labelsByValue: React.MutableRefObject<Map<string, React.ReactNode>>
  setLabelForValue: (valueKey: string, label: React.ReactNode) => void
}

const SelectWorkbenchLabelContext =
  React.createContext<SelectWorkbenchLabelRegistry | null>(null)

type SelectRootProps<Value, Multiple extends boolean | undefined = false> =
  SelectPrimitive.Root.Props<Value, Multiple> & {
    placeholder?: React.ReactNode
  }

function Select<Value, Multiple extends boolean | undefined = false>({
  children,
  modal = false,
  placeholder = "Select an option",
  ...props
}: SelectRootProps<Value, Multiple>) {
  const labelsByValue = React.useRef(new Map<string, React.ReactNode>())
  const authoredLabelsByValue = React.useMemo(
    () => collectSelectItemLabels(children),
    [children]
  )
  const [, bumpLabelVersion] = React.useReducer((value: number) => value + 1, 0)

  const setLabelForValue = React.useCallback((valueKey: string, label: React.ReactNode) => {
    if (labelsByValue.current.get(valueKey) === label) return
    labelsByValue.current.set(valueKey, label)
    bumpLabelVersion()
  }, [])

  const clearLabelForValue = React.useCallback((valueKey: string, label: React.ReactNode) => {
    if (labelsByValue.current.get(valueKey) !== label) return
    labelsByValue.current.delete(valueKey)
    bumpLabelVersion()
  }, [])

  const labelRegistry = React.useMemo(
    () => ({ authoredLabelsByValue, clearLabelForValue, labelsByValue, setLabelForValue }),
    [authoredLabelsByValue, clearLabelForValue, setLabelForValue]
  )
  const simpleModeChildren = getSelectSimpleModeChildren(children)
  const { componentProps, runtimeRootProps } = splitWorkbenchRuntimeRootProps(
    props as Record<string, unknown>
  )

  return (
    <SelectWorkbenchLabelContext.Provider value={labelRegistry}>
      <SelectPrimitive.Root
        modal={modal}
        {...componentProps}
      >
        {simpleModeChildren ? (
          <>
            <SelectTrigger {...runtimeRootProps}><SelectValue placeholder={placeholder} /></SelectTrigger>
            <SelectContent>{simpleModeChildren}</SelectContent>
          </>
        ) : children}
      </SelectPrimitive.Root>
    </SelectWorkbenchLabelContext.Provider>
  )
}

function SelectGroup({ className, ...props }: SelectPrimitive.Group.Props) {
  return (
    <SelectPrimitive.Group
      data-slot="select-group"
      className={cn("scroll-my-1 p-1", className)}
      {...props}
    />
  )
}

function SelectValue({
  className,
  children,
  placeholder,
  ...props
}: SelectPrimitive.Value.Props) {
  const labelRegistry = React.useContext(SelectWorkbenchLabelContext)

  return (
    <SelectPrimitive.Value
      data-slot="select-value"
      className={cn("min-w-0 flex-1 truncate text-left", className)}
      placeholder={placeholder}
      {...props}
    >
      {children ??
        ((selectedValue: unknown) =>
          renderSelectFallbackValue(selectedValue, placeholder, labelRegistry))}
    </SelectPrimitive.Value>
  )
}

function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: SelectPrimitive.Trigger.Props & {
  size?: "sm" | "default"
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "flex w-fit min-w-36 max-w-full items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-2 pl-2.5 text-sm whitespace-nowrap transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-placeholder:text-muted-foreground data-[size=default]:h-8 data-[size=sm]:h-7 data-[size=sm]:rounded-[min(var(--radius-md),10px)] dark:bg-input/30 dark:hover:bg-input/50 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon
        render={
          <RiArrowDownSLine className="pointer-events-none size-4 text-muted-foreground" />
        }
      />
    </SelectPrimitive.Trigger>
  )
}

function SelectContent({
  className,
  children,
  side = "bottom",
  sideOffset = 4,
  align = "center",
  alignOffset = 0,
  alignItemWithTrigger = true,
  positionMethod,
  ...props
}: SelectPrimitive.Popup.Props &
  Pick<
    SelectPrimitive.Positioner.Props,
    | "align"
    | "alignOffset"
    | "side"
    | "sideOffset"
    | "alignItemWithTrigger"
    | "positionMethod"
  >) {
  const portalContainer = useWorkbenchPortalContainer()
  return (
    <SelectPrimitive.Portal
      container={portalContainer}
    >
      <SelectPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        alignItemWithTrigger={
          portalContainer ? false : alignItemWithTrigger
        }
        positionMethod={positionMethod}
        className="isolate z-50"
      >
        <SelectPrimitive.Popup
          data-slot="select-content"
          data-align-trigger={alignItemWithTrigger}
          className={cn("isolate z-50 max-h-(--available-height) w-(--anchor-width) min-w-36 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-lg text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 data-[align-trigger=true]:animate-none data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 animate-none! relative bg-popover/70 before:pointer-events-none before:absolute before:inset-0 before:-z-1 before:rounded-[inherit] before:backdrop-blur-2xl before:backdrop-saturate-150 **:data-[slot$=-item]:focus:bg-foreground/10 **:data-[slot$=-item]:data-highlighted:bg-foreground/10 **:data-[slot$=-separator]:bg-foreground/5 **:data-[slot$=-trigger]:focus:bg-foreground/10 **:data-[slot$=-trigger]:aria-expanded:bg-foreground/10! **:data-[variant=destructive]:focus:bg-foreground/10! **:data-[variant=destructive]:text-accent-foreground! **:data-[variant=destructive]:**:text-accent-foreground!", className )}
          {...props}
        >
          <SelectScrollUpButton />
          <SelectPrimitive.List>{children}</SelectPrimitive.List>
          <SelectScrollDownButton />
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  )
}

function SelectLabel({
  className,
  ...props
}: SelectPrimitive.GroupLabel.Props) {
  return (
    <SelectPrimitive.GroupLabel
      data-slot="select-label"
      className={cn("truncate px-1.5 py-1 text-xs text-muted-foreground", className)}
      {...props}
    />
  )
}

type SelectItemProps = Omit<SelectPrimitive.Item.Props, "value"> & {
  value?: SelectPrimitive.Item.Props["value"]
}

function SelectItem({
  className,
  children,
  label,
  value,
  ...props
}: SelectItemProps) {
  const labelRegistry = React.useContext(SelectWorkbenchLabelContext)
  const fallbackValue = React.useId()
  const fallbackLabel = getSelectItemFallbackLabel(children)
  const itemValue = value ?? fallbackValue
  const itemLabel = label ?? fallbackLabel
  const registryKey = getSelectValueRegistryKey(itemValue)

  React.useLayoutEffect(() => {
    if (!labelRegistry || registryKey == null) return
    labelRegistry.setLabelForValue(registryKey, itemLabel)
    return () => labelRegistry.clearLabelForValue(registryKey, itemLabel)
  }, [itemLabel, labelRegistry, registryKey])

  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      value={itemValue}
      label={itemLabel}
      className={cn(
        "relative flex w-full min-w-0 cursor-default items-center gap-1.5 overflow-hidden rounded-md py-1 pr-8 pl-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-foreground data-highlighted:text-foreground not-data-[variant=destructive]:focus:**:text-foreground not-data-[variant=destructive]:data-highlighted:**:text-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
        className
      )}
      {...props}
    >
      <SelectPrimitive.ItemText className="block min-w-0 flex-1 truncate">
        {children}
      </SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator
        render={
          <span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center" />
        }
      >
        <RiCheckLine className="pointer-events-none" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  )
}

function renderSelectFallbackValue(
  selectedValue: unknown,
  placeholder: React.ReactNode,
  labelRegistry: SelectWorkbenchLabelRegistry | null
): React.ReactNode {
  if (selectedValue == null || selectedValue === "") {
    return placeholder ?? null
  }

  if (Array.isArray(selectedValue)) {
    if (selectedValue.length === 0) return placeholder ?? null
    return selectedValue.map((value, index) => (
      <React.Fragment key={getSelectValueRegistryKey(value) ?? index}>
        {index > 0 ? ", " : null}
        {renderSelectSingleFallbackValue(value, labelRegistry)}
      </React.Fragment>
    ))
  }

  return renderSelectSingleFallbackValue(selectedValue, labelRegistry)
}

function renderSelectSingleFallbackValue(
  selectedValue: unknown,
  labelRegistry: SelectWorkbenchLabelRegistry | null
): React.ReactNode {
  if (
    selectedValue &&
    typeof selectedValue === "object" &&
    "label" in selectedValue &&
    selectedValue.label != null
  ) {
    return selectedValue.label as React.ReactNode
  }

  const registryKey = getSelectValueRegistryKey(selectedValue)
  if (registryKey != null) {
    return labelRegistry?.labelsByValue.current.get(registryKey) ??
      labelRegistry?.authoredLabelsByValue.get(registryKey) ??
      registryKey
  }

  return String(selectedValue)
}

function getSelectValueRegistryKey(value: unknown): string | null {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "bigint" ||
    typeof value === "boolean"
  ) {
    return String(value)
  }

  if (value && typeof value === "object" && "value" in value) {
    const objectValue = value.value
    if (
      typeof objectValue === "string" ||
      typeof objectValue === "number" ||
      typeof objectValue === "bigint" ||
      typeof objectValue === "boolean"
    ) {
      return String(objectValue)
    }
  }

  return null
}

function collectSelectItemLabels(children: React.ReactNode): Map<string, React.ReactNode> {
  const labelsByValue = new Map<string, React.ReactNode>()

  function visit(node: React.ReactNode) {
    React.Children.forEach(node, (child) => {
      if (!React.isValidElement(child)) return

      if (isWorkbenchElementOfType(child, SelectItem, "SelectItem")) {
        const props = child.props as SelectItemProps
        const registryKey = getSelectValueRegistryKey(props.value)
        if (registryKey != null) {
          labelsByValue.set(
            registryKey,
            props.label ?? getSelectItemFallbackLabel(props.children)
          )
        }
      }

      const nestedChildren = (child.props as { children?: React.ReactNode }).children
      if (nestedChildren) visit(nestedChildren)
    })
  }

  visit(children)
  return labelsByValue
}

function getSelectItemFallbackLabel(children: React.ReactNode): string {
  if (typeof children === "string" || typeof children === "number") {
    return String(children)
  }
  return "Item"
}

function SelectSeparator({
  className,
  ...props
}: SelectPrimitive.Separator.Props) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("pointer-events-none -mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  )
}

const SELECT_SIMPLE_MODE_CHILD_TYPES = new Set<React.ElementType>([
  SelectGroup,
  SelectItem,
  SelectSeparator,
])

function getSelectSimpleModeChildren(children: React.ReactNode): React.ReactNode[] | null {
  const childArray = React.Children.toArray(children).filter(isMeaningfulSelectChild)
  if (childArray.length === 0) return null
  if (!childArray.every(isSelectSimpleModeElement)) return null
  return childArray
}

function isMeaningfulSelectChild(child: React.ReactNode): boolean {
  return !(typeof child === "string" && child.trim() === "")
}

function isSelectSimpleModeElement(child: React.ReactNode): child is React.ReactElement {
  return isWorkbenchElementOfTypes(child, SELECT_SIMPLE_MODE_CHILD_TYPES)
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpArrow>) {
  return (
    <SelectPrimitive.ScrollUpArrow
      data-slot="select-scroll-up-button"
      className={cn(
        "top-0 z-10 flex w-full cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <RiArrowUpSLine
      />
    </SelectPrimitive.ScrollUpArrow>
  )
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownArrow>) {
  return (
    <SelectPrimitive.ScrollDownArrow
      data-slot="select-scroll-down-button"
      className={cn(
        "bottom-0 z-10 flex w-full cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <RiArrowDownSLine
      />
    </SelectPrimitive.ScrollDownArrow>
  )
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
