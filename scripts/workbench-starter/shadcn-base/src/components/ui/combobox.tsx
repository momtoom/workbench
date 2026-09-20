"use client"

import * as React from "react"
import { Combobox as ComboboxPrimitive } from "@base-ui/react"

import { cn } from "@/lib/utils"
import {
  isWorkbenchElementOfType,
  isWorkbenchElementOfTypes,
  splitWorkbenchRuntimeRootProps,
} from "@/components/ui/workbench-runtime"
import { Button } from "@/components/ui/button"
import { useWorkbenchPortalContainer } from "@/lib/workbench-portal"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { RiArrowDownSLine, RiCloseLine, RiCheckLine } from "@remixicon/react"

type ComboboxWorkbenchLabelRegistry = {
  authoredLabelsByValue: ReadonlyMap<string, string>
  clearLabelForValue: (valueKey: string, label: string) => void
  labelsByValue: React.MutableRefObject<Map<string, string>>
  setLabelForValue: (valueKey: string, label: string) => void
}

const ComboboxWorkbenchLabelContext =
  React.createContext<ComboboxWorkbenchLabelRegistry | null>(null)

type ComboboxRootProps<Value, Multiple extends boolean | undefined = false> =
  ComboboxPrimitive.Root.Props<Value, Multiple> & {
    placeholder?: string
  }

function Combobox<Value, Multiple extends boolean | undefined = false>({
  children,
  itemToStringLabel,
  placeholder = "Select an item",
  ...props
}: ComboboxRootProps<Value, Multiple>) {
  const labelsByValue = React.useRef(new Map<string, string>())
  const authoredLabelsByValue = React.useMemo(
    () => collectComboboxItemLabels(children),
    [children]
  )
  const [, bumpLabelVersion] = React.useReducer((value: number) => value + 1, 0)

  const setLabelForValue = React.useCallback((valueKey: string, label: string) => {
    if (labelsByValue.current.get(valueKey) === label) return
    labelsByValue.current.set(valueKey, label)
    bumpLabelVersion()
  }, [])

  const clearLabelForValue = React.useCallback((valueKey: string, label: string) => {
    if (labelsByValue.current.get(valueKey) !== label) return
    labelsByValue.current.delete(valueKey)
    bumpLabelVersion()
  }, [])

  const labelRegistry = React.useMemo(
    () => ({ authoredLabelsByValue, clearLabelForValue, labelsByValue, setLabelForValue }),
    [authoredLabelsByValue, clearLabelForValue, setLabelForValue]
  )

  const getItemLabel = React.useCallback((itemValue: Value) => {
    const customLabel = itemToStringLabel?.(itemValue)
    if (customLabel != null) return customLabel

    const registryKey = getComboboxValueRegistryKey(itemValue)
    if (registryKey != null) {
      return labelsByValue.current.get(registryKey) ??
        authoredLabelsByValue.get(registryKey) ??
        registryKey
    }

    return stringifyComboboxValueLabel(itemValue)
  }, [authoredLabelsByValue, itemToStringLabel])
  const simpleModeChildren = getComboboxSimpleModeChildren(children)
  const { componentProps, runtimeRootProps } = splitWorkbenchRuntimeRootProps(
    props as Record<string, unknown>
  )

  return (
    <ComboboxWorkbenchLabelContext.Provider value={labelRegistry}>
      <ComboboxPrimitive.Root
        itemToStringLabel={getItemLabel}
        {...componentProps}
      >
        {simpleModeChildren ? (
          <>
            <ComboboxInput placeholder={placeholder} {...runtimeRootProps} />
            <ComboboxContent>
              <ComboboxList>{simpleModeChildren}</ComboboxList>
            </ComboboxContent>
          </>
        ) : children}
      </ComboboxPrimitive.Root>
    </ComboboxWorkbenchLabelContext.Provider>
  )
}

function ComboboxValue({ ...props }: ComboboxPrimitive.Value.Props) {
  return <ComboboxPrimitive.Value data-slot="combobox-value" {...props} />
}

const ComboboxTrigger = React.forwardRef<
  React.ElementRef<typeof ComboboxPrimitive.Trigger>,
  ComboboxPrimitive.Trigger.Props
>(function ComboboxTrigger({
  className,
  children,
  ...props
}, ref) {
  return (
    <ComboboxPrimitive.Trigger
      ref={ref}
      data-slot="combobox-trigger"
      className={cn("[&_svg:not([class*='size-'])]:size-4", className)}
      {...props}
    >
      {children}
      <RiArrowDownSLine className="pointer-events-none size-4 text-muted-foreground" />
    </ComboboxPrimitive.Trigger>
  )
})

function ComboboxClear({ className, ...props }: ComboboxPrimitive.Clear.Props) {
  return (
    <ComboboxPrimitive.Clear
      data-slot="combobox-clear"
      render={<InputGroupButton variant="ghost" size="icon-xs" />}
      className={cn(className)}
      {...props}
    >
      <RiCloseLine className="pointer-events-none" />
    </ComboboxPrimitive.Clear>
  )
}

function ComboboxInput({
  className,
  children,
  disabled = false,
  showTrigger = true,
  showClear = false,
  ...props
}: ComboboxPrimitive.Input.Props & {
  showTrigger?: boolean
  showClear?: boolean
}) {
  const { componentProps, runtimeRootProps } = splitWorkbenchRuntimeRootProps(
    props as Record<string, unknown>
  )

  return (
    <ComboboxPrimitive.InputGroup
      render={<InputGroup className={cn("w-auto", className)} {...runtimeRootProps} />}
    >
      <ComboboxPrimitive.Input
        render={<InputGroupInput disabled={disabled} />}
        {...componentProps}
      />
      <InputGroupAddon align="inline-end">
        {showTrigger && (
          <InputGroupButton
            size="icon-xs"
            variant="ghost"
            render={<ComboboxTrigger />}
            data-slot="input-group-button"
            className="group-has-data-[slot=combobox-clear]/input-group:hidden data-pressed:bg-transparent"
            disabled={disabled}
          />
        )}
        {showClear && <ComboboxClear disabled={disabled} />}
      </InputGroupAddon>
      {children}
    </ComboboxPrimitive.InputGroup>
  )
}

function ComboboxContent({
  className,
  side = "bottom",
  sideOffset = 6,
  align = "start",
  alignOffset = 0,
  anchor,
  positionMethod,
  ...props
}: ComboboxPrimitive.Popup.Props &
  Pick<
    ComboboxPrimitive.Positioner.Props,
    "side" | "align" | "sideOffset" | "alignOffset" | "anchor" | "positionMethod"
  >) {
  const portalContainer = useWorkbenchPortalContainer()
  return (
    <ComboboxPrimitive.Portal
      container={portalContainer}
    >
      <ComboboxPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        anchor={anchor}
        positionMethod={positionMethod ?? (portalContainer ? "fixed" : undefined)}
        className="isolate z-50"
      >
        <ComboboxPrimitive.Popup
          data-slot="combobox-content"
          data-chips={!!anchor}
          className={cn("group/combobox-content max-h-(--available-height) w-(--anchor-width) min-w-48 max-w-(--available-width) origin-(--transform-origin) overflow-hidden rounded-lg text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 data-[chips=true]:min-w-(--anchor-width) data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 *:data-[slot=input-group]:m-1 *:data-[slot=input-group]:mb-0 *:data-[slot=input-group]:h-8 *:data-[slot=input-group]:border-input/30 *:data-[slot=input-group]:bg-input/30 *:data-[slot=input-group]:shadow-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 animate-none! relative bg-popover/70 before:pointer-events-none before:absolute before:inset-0 before:-z-1 before:rounded-[inherit] before:backdrop-blur-2xl before:backdrop-saturate-150 **:data-[slot$=-item]:focus:bg-foreground/10 **:data-[slot$=-item]:data-highlighted:bg-foreground/10 **:data-[slot$=-separator]:bg-foreground/5 **:data-[slot$=-trigger]:focus:bg-foreground/10 **:data-[slot$=-trigger]:aria-expanded:bg-foreground/10! **:data-[variant=destructive]:focus:bg-foreground/10! **:data-[variant=destructive]:text-accent-foreground! **:data-[variant=destructive]:**:text-accent-foreground!", className )}
          {...props}
        />
      </ComboboxPrimitive.Positioner>
    </ComboboxPrimitive.Portal>
  )
}

function ComboboxList({ className, ...props }: ComboboxPrimitive.List.Props) {
  return (
    <ComboboxPrimitive.List
      data-slot="combobox-list"
      className={cn(
        "no-scrollbar max-h-[min(calc(--spacing(72)---spacing(9)),calc(var(--available-height)---spacing(9)))] scroll-py-1 overflow-y-auto overscroll-contain p-1",
        className
      )}
      {...props}
    />
  )
}

type ComboboxItemProps = Omit<ComboboxPrimitive.Item.Props, "value"> & {
  label?: string
  value?: ComboboxPrimitive.Item.Props["value"]
}

function ComboboxItem({
  className,
  children,
  label,
  value,
  ...props
}: ComboboxItemProps) {
  const labelRegistry = React.useContext(ComboboxWorkbenchLabelContext)
  const fallbackValue = React.useId()
  const itemValue = value ?? fallbackValue
  const registryKey = getComboboxValueRegistryKey(itemValue)
  const itemLabel = label ?? getComboboxItemFallbackLabel(children)

  React.useLayoutEffect(() => {
    if (!labelRegistry || registryKey == null) return
    labelRegistry.setLabelForValue(registryKey, itemLabel)
    return () => labelRegistry.clearLabelForValue(registryKey, itemLabel)
  }, [itemLabel, labelRegistry, registryKey])

  return (
    <ComboboxPrimitive.Item
      data-slot="combobox-item"
      value={itemValue}
      className={cn(
        "relative flex w-full min-w-0 cursor-default items-center gap-2 overflow-hidden rounded-md py-2 pr-9 pl-3 text-sm whitespace-nowrap outline-hidden select-none data-highlighted:bg-foreground/10 data-highlighted:text-foreground data-highlighted:**:text-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <span className="min-w-0 flex-1 truncate">{children}</span>
      <ComboboxPrimitive.ItemIndicator
        render={
          <span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center" />
        }
      >
        <RiCheckLine className="pointer-events-none" />
      </ComboboxPrimitive.ItemIndicator>
    </ComboboxPrimitive.Item>
  )
}

function ComboboxOption(props: ComboboxItemProps) {
  return <ComboboxItem {...props} />
}

function getComboboxValueRegistryKey(value: unknown): string | null {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value)
  }

  return null
}

function stringifyComboboxValueLabel(value: unknown): string {
  if (
    value &&
    typeof value === "object" &&
    "label" in value &&
    value.label != null
  ) {
    return String(value.label)
  }

  if (value == null) return ""
  return String(value)
}

function getComboboxItemFallbackLabel(children: React.ReactNode): string {
  const text = getComboboxReactNodeText(children).trim()
  return text || "Item"
}

function collectComboboxItemLabels(children: React.ReactNode): Map<string, string> {
  const labelsByValue = new Map<string, string>()

  function visit(node: React.ReactNode) {
    React.Children.forEach(node, (child) => {
      if (!React.isValidElement(child)) return

      if (
        isWorkbenchElementOfType(child, ComboboxItem, "ComboboxItem") ||
        isWorkbenchElementOfType(child, ComboboxOption, "ComboboxOption")
      ) {
        const props = child.props as ComboboxItemProps
        const registryKey = getComboboxValueRegistryKey(props.value)
        if (registryKey != null) {
          labelsByValue.set(
            registryKey,
            props.label ?? getComboboxItemFallbackLabel(props.children)
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

function getComboboxReactNodeText(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node)
  if (Array.isArray(node)) return node.map(getComboboxReactNodeText).join("")
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
    return getComboboxReactNodeText(node.props.children)
  }
  return ""
}

function ComboboxGroup({ className, ...props }: ComboboxPrimitive.Group.Props) {
  return (
    <ComboboxPrimitive.Group
      data-slot="combobox-group"
      className={cn(className)}
      {...props}
    />
  )
}

function ComboboxSection({
  children,
  label,
  ...props
}: ComboboxPrimitive.Group.Props & {
  label?: React.ReactNode
}) {
  return (
    <ComboboxGroup {...props}>
      {label ? <ComboboxLabel>{label}</ComboboxLabel> : null}
      {children}
    </ComboboxGroup>
  )
}

function ComboboxLabel({
  className,
  ...props
}: ComboboxPrimitive.GroupLabel.Props) {
  return (
    <ComboboxPrimitive.GroupLabel
      data-slot="combobox-label"
      className={cn("px-3 py-2 text-xs text-muted-foreground", className)}
      {...props}
    />
  )
}

function ComboboxCollection({ ...props }: ComboboxPrimitive.Collection.Props) {
  return (
    <ComboboxPrimitive.Collection data-slot="combobox-collection" {...props} />
  )
}

function ComboboxEmpty({ className, ...props }: ComboboxPrimitive.Empty.Props) {
  return (
    <ComboboxPrimitive.Empty
      data-slot="combobox-empty"
      className={cn(
        "hidden w-full justify-center py-2 text-center text-sm whitespace-nowrap text-muted-foreground group-data-empty/combobox-content:flex",
        className
      )}
      {...props}
    />
  )
}

function ComboboxSeparator({
  className,
  ...props
}: ComboboxPrimitive.Separator.Props) {
  return (
    <ComboboxPrimitive.Separator
      data-slot="combobox-separator"
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  )
}

function ComboboxChips({
  className,
  ...props
}: React.ComponentPropsWithRef<typeof ComboboxPrimitive.Chips> &
  ComboboxPrimitive.Chips.Props) {
  return (
    <ComboboxPrimitive.Chips
      data-slot="combobox-chips"
      className={cn(
        "flex min-h-8 flex-wrap items-center gap-1 rounded-lg border border-input bg-transparent bg-clip-padding px-2.5 py-1 text-sm transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 has-aria-invalid:border-destructive has-aria-invalid:ring-3 has-aria-invalid:ring-destructive/20 has-data-[slot=combobox-chip]:px-1 dark:bg-input/30 dark:has-aria-invalid:border-destructive/50 dark:has-aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

function ComboboxChip({
  className,
  children,
  showRemove = true,
  ...props
}: ComboboxPrimitive.Chip.Props & {
  showRemove?: boolean
}) {
  return (
    <ComboboxPrimitive.Chip
      data-slot="combobox-chip"
      className={cn(
        "flex h-[calc(--spacing(5.25))] w-fit items-center justify-center gap-1 rounded-sm bg-muted px-1.5 text-xs font-medium whitespace-nowrap text-foreground has-disabled:pointer-events-none has-disabled:cursor-not-allowed has-disabled:opacity-50 has-data-[slot=combobox-chip-remove]:pr-0",
        className
      )}
      {...props}
    >
      {children}
      {showRemove && (
        <ComboboxPrimitive.ChipRemove
          render={<Button variant="ghost" size="icon-xs" />}
          className="-ml-1 opacity-50 hover:opacity-100"
          data-slot="combobox-chip-remove"
        >
          <RiCloseLine className="pointer-events-none" />
        </ComboboxPrimitive.ChipRemove>
      )}
    </ComboboxPrimitive.Chip>
  )
}

function ComboboxChipsInput({
  className,
  ...props
}: ComboboxPrimitive.Input.Props) {
  return (
    <ComboboxPrimitive.Input
      data-slot="combobox-chip-input"
      className={cn("min-w-16 flex-1 outline-none", className)}
      {...props}
    />
  )
}

const COMBOBOX_SIMPLE_MODE_CHILD_TYPES = new Set<React.ElementType>([
  ComboboxGroup,
  ComboboxSection,
  ComboboxItem,
  ComboboxOption,
  ComboboxEmpty,
  ComboboxSeparator,
])

function getComboboxSimpleModeChildren(children: React.ReactNode): React.ReactNode[] | null {
  const childArray = React.Children.toArray(children).filter(isMeaningfulComboboxChild)
  if (childArray.length === 0) return null
  if (!childArray.every(isComboboxSimpleModeElement)) return null
  return childArray
}

function isMeaningfulComboboxChild(child: React.ReactNode): boolean {
  return !(typeof child === "string" && child.trim() === "")
}

function isComboboxSimpleModeElement(child: React.ReactNode): child is React.ReactElement {
  return isWorkbenchElementOfTypes(child, COMBOBOX_SIMPLE_MODE_CHILD_TYPES)
}

function useComboboxAnchor() {
  return React.useRef<HTMLDivElement | null>(null)
}

export {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxOption,
  ComboboxGroup,
  ComboboxSection,
  ComboboxLabel,
  ComboboxCollection,
  ComboboxEmpty,
  ComboboxSeparator,
  ComboboxChips,
  ComboboxChip,
  ComboboxChipsInput,
  ComboboxTrigger,
  ComboboxValue,
  useComboboxAnchor,
}
