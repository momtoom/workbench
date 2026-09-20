import * as React from "react"
import { Menu as MenuPrimitive } from "@base-ui/react/menu"
import { cn } from "@/lib/utils"
import {
  isWorkbenchElementOfTypes,
  splitWorkbenchRuntimeRootProps,
} from "@/components/ui/workbench-runtime"
import { useWorkbenchPortalContainer } from "@/lib/workbench-portal"
import { Button, buttonVariants } from "@/components/ui/button"
import { RiArrowRightSLine, RiCheckLine } from "@remixicon/react"

const INSTANT_DISMISS_REASONS = new Set([
  "cancel-open",
  "focus-out",
  "outside-press",
  "trigger-press",
])

function getEventTimestamp(event: Event | undefined): number | null {
  return typeof event?.timeStamp === "number" ? event.timeStamp : null
}

function getNowTimestamp(): number {
  return globalThis.performance?.now?.() ?? Date.now()
}

type DropdownMenuProps = MenuPrimitive.Root.Props & {
  contentClassName?: string
  trigger?: React.ReactNode
  triggerClassName?: string
}

function DropdownMenu(allProps: DropdownMenuProps) {
  const {
  children,
  contentClassName,
  defaultOpen = false,
  modal,
  onOpenChange,
  open: openProp,
  trigger = "Open menu",
  triggerClassName,
  ...props
  } = allProps
  const modalProp = Object.prototype.hasOwnProperty.call(allProps, "modal")
    ? modal
    : false
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)
  const controlled = openProp !== undefined
  const open = controlled ? openProp : uncontrolledOpen
  const recentTriggerOpenTimestampRef = React.useRef<number | null>(null)
  const simpleModeChildren = getDropdownMenuSimpleModeChildren(children as React.ReactNode)
  const explicitTriggerModeChildren = getDropdownMenuExplicitTriggerModeChildren(children as React.ReactNode)
  const { componentProps, runtimeRootProps } = splitWorkbenchRuntimeRootProps(
    props as Record<string, unknown>
  )
  const handleOpenChange = React.useCallback<
    NonNullable<MenuPrimitive.Root.Props["onOpenChange"]>
  >(
    (nextOpen, eventDetails) => {
      const eventTimestamp =
        getEventTimestamp(eventDetails.event) ?? getNowTimestamp()

      if (nextOpen) {
        recentTriggerOpenTimestampRef.current = eventTimestamp
      }

      const cancelledInstantDismiss =
        !nextOpen &&
        INSTANT_DISMISS_REASONS.has(eventDetails.reason) &&
        recentTriggerOpenTimestampRef.current !== null &&
        eventTimestamp - recentTriggerOpenTimestampRef.current < 250

      if (cancelledInstantDismiss) {
        eventDetails.cancel()
        onOpenChange?.(nextOpen, eventDetails)
        return
      }

      if (!controlled) {
        setUncontrolledOpen(nextOpen)
      }

      if (!nextOpen) {
        recentTriggerOpenTimestampRef.current = null
      }

      onOpenChange?.(nextOpen, eventDetails)
    },
    [controlled, onOpenChange]
  )

  return (
    <MenuPrimitive.Root
      data-slot="dropdown-menu"
      modal={modalProp}
      onOpenChange={handleOpenChange}
      open={open}
      {...componentProps}
    >
      {simpleModeChildren ? (
        <>
          <DropdownMenuTrigger
            className={triggerClassName}
            variant="outline"
            {...runtimeRootProps}
          >
            {trigger}
          </DropdownMenuTrigger>
          <DropdownMenuContent className={contentClassName}>
            {simpleModeChildren}
          </DropdownMenuContent>
        </>
      ) : explicitTriggerModeChildren ? (
        <>
          {explicitTriggerModeChildren.trigger}
          <DropdownMenuContent className={contentClassName}>
            {explicitTriggerModeChildren.contentChildren}
          </DropdownMenuContent>
        </>
      ) : children}
    </MenuPrimitive.Root>
  )
}

function DropdownMenuPortal({ container, ...props }: MenuPrimitive.Portal.Props) {
  const workbenchPortalContainer = useWorkbenchPortalContainer()
  return (
    <MenuPrimitive.Portal
      data-slot="dropdown-menu-portal"
      container={
        container === undefined ? workbenchPortalContainer : container
      }
      {...props}
    />
  )
}

function DropdownMenuTrigger({
  asChild,
  children,
  className,
  nativeButton,
  render,
  size = "default",
  variant = "outline",
  ...props
}: MenuPrimitive.Trigger.Props & {
  asChild?: boolean
  size?: React.ComponentProps<typeof Button>["size"]
  variant?: React.ComponentProps<typeof Button>["variant"]
}) {
  if (asChild && React.isValidElement(children)) {
    return (
      <MenuPrimitive.Trigger
        className={className}
        data-button=""
        data-slot="dropdown-menu-trigger"
        nativeButton={nativeButton ?? true}
        render={render ?? children}
        {...props}
      />
    )
  }

  return (
    <MenuPrimitive.Trigger
      className={render ? className : cn(buttonVariants({ size, variant, shape: "rounded" }), className)}
      data-button=""
      data-slot="dropdown-menu-trigger"
      data-size={size}
      data-shape="rounded"
      data-variant={variant}
      nativeButton={nativeButton ?? true}
      render={render}
      {...props}
    >
      {children}
    </MenuPrimitive.Trigger>
  )
}

function DropdownMenuContent({
  align = "start",
  alignOffset = 0,
  side = "bottom",
  sideOffset,
  positionMethod,
  className,
  ...props
}: MenuPrimitive.Popup.Props &
  Pick<
    MenuPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset" | "positionMethod"
  >) {
  const portalContainer = useWorkbenchPortalContainer()
  const usesTokenTriggerGap = sideOffset === undefined
  return (
    <MenuPrimitive.Portal
      container={portalContainer}
    >
      <MenuPrimitive.Positioner
        data-slot="dropdown-menu-positioner"
        data-token-trigger-gap={usesTokenTriggerGap ? "" : undefined}
        className="isolate z-50 outline-none"
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset ?? 0}
        positionMethod={
          positionMethod ?? (portalContainer ? "fixed" : undefined)
        }
      >
        <MenuPrimitive.Popup
          data-slot="dropdown-menu-content"
          className={cn("z-50 max-h-(--available-height) w-max min-w-32 max-w-(--available-width) origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-lg p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 outline-none data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:overflow-hidden data-closed:fade-out-0 data-closed:zoom-out-95 animate-none! relative bg-popover/70 before:pointer-events-none before:absolute before:inset-0 before:-z-1 before:rounded-[inherit] before:backdrop-blur-2xl before:backdrop-saturate-150 **:data-[slot$=-item]:focus:bg-foreground/10 **:data-[slot$=-item]:data-highlighted:bg-foreground/10 **:data-[slot$=-separator]:bg-foreground/5 **:data-[slot$=-trigger]:focus:bg-foreground/10 **:data-[slot$=-trigger]:aria-expanded:bg-foreground/10! **:data-[variant=destructive]:focus:bg-foreground/10! **:data-[variant=destructive]:text-accent-foreground! **:data-[variant=destructive]:**:text-accent-foreground!", className )}
          {...props}
        />
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  )
}

function DropdownMenuGroup({ ...props }: MenuPrimitive.Group.Props) {
  return <MenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />
}

function DropdownMenuLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<"div"> & {
  inset?: boolean
}) {
  return (
    <div
      data-slot="dropdown-menu-label"
      data-inset={inset}
      className={cn(
        "px-1.5 py-1 text-xs font-medium text-muted-foreground data-inset:pl-7",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuItem({
  className,
  inset,
  variant = "default",
  ...props
}: MenuPrimitive.Item.Props & {
  inset?: boolean
  variant?: "default" | "destructive"
}) {
  return (
    <MenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        "group/dropdown-menu-item relative flex cursor-default items-center gap-1.5 whitespace-nowrap rounded-md px-1.5 py-1 text-sm outline-hidden select-none focus:bg-foreground/10 focus:text-foreground not-data-[variant=destructive]:focus:**:text-foreground data-inset:pl-7 data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 data-[variant=destructive]:focus:text-destructive dark:data-[variant=destructive]:focus:bg-destructive/20 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 data-[variant=destructive]:*:[svg]:text-destructive",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuSub({ ...props }: MenuPrimitive.SubmenuRoot.Props) {
  return <MenuPrimitive.SubmenuRoot data-slot="dropdown-menu-sub" {...props} />
}

type DropdownMenuSubmenuProps = Omit<MenuPrimitive.SubmenuRoot.Props, "children"> & {
  children?: React.ReactNode
  contentClassName?: string
  inset?: boolean
  trigger?: React.ReactNode
  triggerClassName?: string
}

function DropdownMenuSubmenu({
  children,
  contentClassName,
  inset,
  trigger = "Submenu",
  triggerClassName,
  ...props
}: DropdownMenuSubmenuProps) {
  const { componentProps, runtimeRootProps } = splitWorkbenchRuntimeRootProps(
    props as Record<string, unknown>
  )
  return (
    <DropdownMenuSub {...componentProps}>
      <DropdownMenuSubTrigger
        className={triggerClassName}
        inset={inset}
        {...runtimeRootProps}
      >
        {trigger}
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className={contentClassName}>
        {children}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  )
}

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: MenuPrimitive.SubmenuTrigger.Props & {
  inset?: boolean
}) {
  return (
    <MenuPrimitive.SubmenuTrigger
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset}
      className={cn(
        "flex cursor-default items-center gap-1.5 whitespace-nowrap rounded-md px-1.5 py-1 text-sm outline-hidden select-none focus:bg-foreground/10 focus:text-foreground not-data-[variant=destructive]:focus:**:text-foreground data-inset:pl-7 data-popup-open:bg-foreground/10 data-popup-open:text-foreground data-open:bg-foreground/10 data-open:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {children}
      <RiArrowRightSLine className="ml-auto" />
    </MenuPrimitive.SubmenuTrigger>
  )
}

function DropdownMenuSubContent({
  align = "start",
  alignOffset = -3,
  side = "right",
  sideOffset = 0,
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuContent>) {
  return (
    <DropdownMenuContent
      data-slot="dropdown-menu-sub-content"
      className={cn("w-max min-w-24 max-w-(--available-width) rounded-lg p-1 text-popover-foreground shadow-lg ring-1 ring-foreground/10 duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 animate-none! relative bg-popover/70 before:pointer-events-none before:absolute before:inset-0 before:-z-1 before:rounded-[inherit] before:backdrop-blur-2xl before:backdrop-saturate-150 **:data-[slot$=-item]:focus:bg-foreground/10 **:data-[slot$=-item]:data-highlighted:bg-foreground/10 **:data-[slot$=-separator]:bg-foreground/5 **:data-[slot$=-trigger]:focus:bg-foreground/10 **:data-[slot$=-trigger]:aria-expanded:bg-foreground/10! **:data-[variant=destructive]:focus:bg-foreground/10! **:data-[variant=destructive]:text-accent-foreground! **:data-[variant=destructive]:**:text-accent-foreground!", className )}
      align={align}
      alignOffset={alignOffset}
      side={side}
      sideOffset={sideOffset}
      {...props}
    />
  )
}

function DropdownMenuCheckboxItem({
  className,
  children,
  inset,
  ...props
}: MenuPrimitive.CheckboxItem.Props & {
  inset?: boolean
}) {
  return (
    <MenuPrimitive.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      data-inset={inset}
      className={cn(
        "relative flex cursor-default items-center gap-1.5 whitespace-nowrap rounded-md py-1 pr-8 pl-1.5 text-sm outline-hidden select-none focus:bg-foreground/10 focus:text-foreground focus:**:text-foreground data-inset:pl-7 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <span
        className="pointer-events-none absolute right-2 flex items-center justify-center"
        data-slot="dropdown-menu-checkbox-item-indicator"
      >
        <MenuPrimitive.CheckboxItemIndicator>
          <RiCheckLine
          />
        </MenuPrimitive.CheckboxItemIndicator>
      </span>
      {children}
    </MenuPrimitive.CheckboxItem>
  )
}

function DropdownMenuRadioGroup({ ...props }: MenuPrimitive.RadioGroup.Props) {
  return (
    <MenuPrimitive.RadioGroup
      data-slot="dropdown-menu-radio-group"
      {...props}
    />
  )
}

type DropdownMenuRadioSectionProps = Omit<MenuPrimitive.RadioGroup.Props, "children"> & {
  children?: React.ReactNode
}

function DropdownMenuRadioSection({
  children,
  defaultValue = "item-1",
  ...props
}: DropdownMenuRadioSectionProps) {
  return (
    <DropdownMenuRadioGroup defaultValue={defaultValue} {...props}>
      {children}
    </DropdownMenuRadioGroup>
  )
}

function DropdownMenuRadioItem({
  className,
  children,
  inset,
  ...props
}: MenuPrimitive.RadioItem.Props & {
  inset?: boolean
}) {
  return (
    <MenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      data-inset={inset}
      className={cn(
        "relative flex cursor-default items-center gap-1.5 whitespace-nowrap rounded-md py-1 pr-8 pl-1.5 text-sm outline-hidden select-none focus:bg-foreground/10 focus:text-foreground focus:**:text-foreground data-inset:pl-7 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <span
        className="pointer-events-none absolute right-2 flex items-center justify-center"
        data-slot="dropdown-menu-radio-item-indicator"
      >
        <MenuPrimitive.RadioItemIndicator>
          <RiCheckLine
          />
        </MenuPrimitive.RadioItemIndicator>
      </span>
      {children}
    </MenuPrimitive.RadioItem>
  )
}

function DropdownMenuSeparator({
  className,
  ...props
}: MenuPrimitive.Separator.Props) {
  return (
    <MenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  )
}

function DropdownMenuShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn(
        "ml-auto text-xs tracking-widest text-muted-foreground group-focus/dropdown-menu-item:text-foreground",
        className
      )}
      {...props}
    />
  )
}

const DROPDOWN_MENU_SIMPLE_MODE_CHILD_TYPES = new Set<React.ElementType>([
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioSection,
  DropdownMenuSeparator,
  DropdownMenuSubmenu,
])

const DROPDOWN_MENU_TRIGGER_CHILD_TYPES = new Set<React.ElementType>([
  DropdownMenuTrigger,
])

function getDropdownMenuSimpleModeChildren(children: React.ReactNode): React.ReactNode[] | null {
  const childArray = React.Children.toArray(children).filter(isMeaningfulDropdownMenuChild)
  if (childArray.length === 0) return null
  if (!childArray.every(isDropdownMenuSimpleModeElement)) return null
  return childArray
}

function getDropdownMenuExplicitTriggerModeChildren(children: React.ReactNode): {
  trigger: React.ReactElement
  contentChildren: React.ReactNode[]
} | null {
  const childArray = React.Children.toArray(children).filter(isMeaningfulDropdownMenuChild)
  const triggers = childArray.filter((child): child is React.ReactElement => (
    isWorkbenchElementOfTypes(child, DROPDOWN_MENU_TRIGGER_CHILD_TYPES)
  ))
  if (triggers.length !== 1) return null

  const trigger = triggers[0]
  const contentChildren = childArray.filter((child) => child !== trigger)
  if (contentChildren.length === 0) return null
  if (!contentChildren.every(isDropdownMenuSimpleModeElement)) return null

  return { trigger, contentChildren }
}

function isMeaningfulDropdownMenuChild(child: React.ReactNode): boolean {
  return !(typeof child === "string" && child.trim() === "")
}

function isDropdownMenuSimpleModeElement(child: React.ReactNode): child is React.ReactElement {
  return isWorkbenchElementOfTypes(child, DROPDOWN_MENU_SIMPLE_MODE_CHILD_TYPES)
}

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioSection,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubmenu,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
}
