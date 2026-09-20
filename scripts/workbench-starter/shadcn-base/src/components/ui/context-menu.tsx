"use client"

import * as React from "react"
import { ContextMenu as ContextMenuPrimitive } from "@base-ui/react/context-menu"

import { cn } from "@/lib/utils"
import {
  isWorkbenchElementOfTypes,
  splitWorkbenchRuntimeRootProps,
} from "@/components/ui/workbench-runtime"
import { useWorkbenchPortalContainer } from "@/lib/workbench-portal"
import { RiArrowRightSLine, RiCheckLine } from "@remixicon/react"

type ContextMenuProps = ContextMenuPrimitive.Root.Props & {
  contentClassName?: string
  target?: React.ReactNode
  targetClassName?: string
}

function ContextMenu({
  children,
  contentClassName,
  target = "Right click target",
  targetClassName,
  ...props
}: ContextMenuProps) {
  const simpleModeChildren = getContextMenuSimpleModeChildren(children as React.ReactNode)
  const { componentProps, runtimeRootProps } = splitWorkbenchRuntimeRootProps(
    props as Record<string, unknown>
  )

  return (
    <ContextMenuPrimitive.Root data-slot="context-menu" {...componentProps}>
      {simpleModeChildren ? (
        <>
          <ContextMenuTrigger
            className={cn(
              "flex h-16 w-48 items-center justify-center rounded-lg border border-dashed text-sm",
              targetClassName
            )}
            {...runtimeRootProps}
          >
            {target}
          </ContextMenuTrigger>
          <ContextMenuContent className={contentClassName}>
            {simpleModeChildren}
          </ContextMenuContent>
        </>
      ) : children}
    </ContextMenuPrimitive.Root>
  )
}

function ContextMenuPortal({ container, ...props }: ContextMenuPrimitive.Portal.Props) {
  const portalContainer = useWorkbenchPortalContainer()
  return (
    <ContextMenuPrimitive.Portal
      data-slot="context-menu-portal"
      container={
        container === undefined
          ? portalContainer
          : container
      }
      {...props}
    />
  )
}

function ContextMenuTrigger({
  className,
  ...props
}: ContextMenuPrimitive.Trigger.Props) {
  return (
    <ContextMenuPrimitive.Trigger
      data-slot="context-menu-trigger"
      className={cn("select-none", className)}
      {...props}
    />
  )
}

function ContextMenuContent({
  className,
  align = "start",
  alignOffset = 4,
  positionMethod,
  side = "right",
  sideOffset = 0,
  ...props
}: ContextMenuPrimitive.Popup.Props &
  Pick<
    ContextMenuPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset" | "positionMethod"
  >) {
  const portalContainer = useWorkbenchPortalContainer()
  return (
    <ContextMenuPortal>
      <ContextMenuPrimitive.Positioner
        className="isolate z-50 outline-none"
        align={align}
        alignOffset={alignOffset}
        positionMethod={positionMethod ?? (portalContainer ? "fixed" : undefined)}
        side={side}
        sideOffset={sideOffset}
      >
        <ContextMenuPrimitive.Popup
          data-slot="context-menu-content"
          className={cn("z-50 max-h-(--available-height) min-w-36 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-lg p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 outline-none data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 animate-none! relative bg-popover/70 before:pointer-events-none before:absolute before:inset-0 before:-z-1 before:rounded-[inherit] before:backdrop-blur-2xl before:backdrop-saturate-150 **:data-[slot$=-item]:focus:bg-foreground/10 **:data-[slot$=-item]:data-highlighted:bg-foreground/10 **:data-[slot$=-separator]:bg-foreground/5 **:data-[slot$=-trigger]:focus:bg-foreground/10 **:data-[slot$=-trigger]:aria-expanded:bg-foreground/10!", className )}
          {...props}
        />
      </ContextMenuPrimitive.Positioner>
    </ContextMenuPortal>
  )
}

function ContextMenuGroup({ ...props }: ContextMenuPrimitive.Group.Props) {
  return (
    <ContextMenuPrimitive.Group data-slot="context-menu-group" {...props} />
  )
}

function ContextMenuLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<"div"> & {
  inset?: boolean
}) {
  return (
    <div
      data-slot="context-menu-label"
      data-inset={inset}
      className={cn(
        "px-1.5 py-1 text-xs font-medium text-muted-foreground data-inset:pl-7",
        className
      )}
      {...props}
    />
  )
}

function ContextMenuItem({
  className,
  inset,
  variant = "default",
  ...props
}: ContextMenuPrimitive.Item.Props & {
  inset?: boolean
  variant?: "default" | "destructive"
}) {
  return (
    <ContextMenuPrimitive.Item
      data-slot="context-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        "group/context-menu-item relative flex cursor-default items-center gap-1.5 rounded-md px-1.5 py-1 text-sm outline-hidden select-none focus:bg-foreground/10 focus:text-foreground not-data-[variant=destructive]:focus:**:text-foreground data-inset:pl-7 data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 data-[variant=destructive]:focus:text-destructive dark:data-[variant=destructive]:focus:bg-destructive/20 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 data-[variant=destructive]:*:[svg]:text-destructive",
        className
      )}
      {...props}
    />
  )
}

function ContextMenuSub({ ...props }: ContextMenuPrimitive.SubmenuRoot.Props) {
  return (
    <ContextMenuPrimitive.SubmenuRoot data-slot="context-menu-sub" {...props} />
  )
}

type ContextMenuSubmenuProps = Omit<ContextMenuPrimitive.SubmenuRoot.Props, "children"> & {
  children?: React.ReactNode
  contentClassName?: string
  inset?: boolean
  trigger?: React.ReactNode
  triggerClassName?: string
}

function ContextMenuSubmenu({
  children,
  contentClassName,
  inset,
  trigger = "Submenu",
  triggerClassName,
  ...props
}: ContextMenuSubmenuProps) {
  const { componentProps, runtimeRootProps } = splitWorkbenchRuntimeRootProps(
    props as Record<string, unknown>
  )
  return (
    <ContextMenuSub {...componentProps}>
      <ContextMenuSubTrigger
        className={triggerClassName}
        inset={inset}
        {...runtimeRootProps}
      >
        {trigger}
      </ContextMenuSubTrigger>
      <ContextMenuSubContent className={contentClassName}>
        {children}
      </ContextMenuSubContent>
    </ContextMenuSub>
  )
}

function ContextMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: ContextMenuPrimitive.SubmenuTrigger.Props & {
  inset?: boolean
}) {
  return (
    <ContextMenuPrimitive.SubmenuTrigger
      data-slot="context-menu-sub-trigger"
      data-inset={inset}
      className={cn(
        "flex cursor-default items-center gap-1.5 rounded-md px-1.5 py-1 text-sm outline-hidden select-none focus:bg-foreground/10 focus:text-foreground focus:**:text-foreground data-inset:pl-7 data-open:bg-foreground/10 data-open:text-foreground data-open:**:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {children}
      <RiArrowRightSLine className="ml-auto" />
    </ContextMenuPrimitive.SubmenuTrigger>
  )
}

function ContextMenuSubContent({
  ...props
}: React.ComponentProps<typeof ContextMenuContent>) {
  return (
    <ContextMenuContent
      data-slot="context-menu-sub-content"
      className="shadow-lg animate-none! relative bg-popover/70 before:pointer-events-none before:absolute before:inset-0 before:-z-1 before:rounded-[inherit] before:backdrop-blur-2xl before:backdrop-saturate-150 **:data-[slot$=-item]:focus:bg-foreground/10 **:data-[slot$=-item]:data-highlighted:bg-foreground/10 **:data-[slot$=-separator]:bg-foreground/5 **:data-[slot$=-trigger]:focus:bg-foreground/10 **:data-[slot$=-trigger]:aria-expanded:bg-foreground/10!"
      side="right"
      {...props}
    />
  )
}

function ContextMenuCheckboxItem({
  className,
  children,
  inset,
  ...props
}: ContextMenuPrimitive.CheckboxItem.Props & {
  inset?: boolean
}) {
  return (
    <ContextMenuPrimitive.CheckboxItem
      data-slot="context-menu-checkbox-item"
      data-inset={inset}
      className={cn(
        "relative flex cursor-default items-center gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm outline-hidden select-none focus:bg-foreground/10 focus:text-foreground focus:**:text-foreground data-inset:pl-7 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <span className="pointer-events-none absolute right-2">
        <ContextMenuPrimitive.CheckboxItemIndicator>
          <RiCheckLine
          />
        </ContextMenuPrimitive.CheckboxItemIndicator>
      </span>
      {children}
    </ContextMenuPrimitive.CheckboxItem>
  )
}

function ContextMenuRadioGroup({
  ...props
}: ContextMenuPrimitive.RadioGroup.Props) {
  return (
    <ContextMenuPrimitive.RadioGroup
      data-slot="context-menu-radio-group"
      {...props}
    />
  )
}

type ContextMenuRadioSectionProps = Omit<ContextMenuPrimitive.RadioGroup.Props, "children"> & {
  children?: React.ReactNode
}

function ContextMenuRadioSection({
  children,
  defaultValue = "item-1",
  ...props
}: ContextMenuRadioSectionProps) {
  return (
    <ContextMenuRadioGroup defaultValue={defaultValue} {...props}>
      {children}
    </ContextMenuRadioGroup>
  )
}

function ContextMenuRadioItem({
  className,
  children,
  inset,
  ...props
}: ContextMenuPrimitive.RadioItem.Props & {
  inset?: boolean
}) {
  return (
    <ContextMenuPrimitive.RadioItem
      data-slot="context-menu-radio-item"
      data-inset={inset}
      className={cn(
        "relative flex cursor-default items-center gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm outline-hidden select-none focus:bg-foreground/10 focus:text-foreground focus:**:text-foreground data-inset:pl-7 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <span className="pointer-events-none absolute right-2">
        <ContextMenuPrimitive.RadioItemIndicator>
          <RiCheckLine
          />
        </ContextMenuPrimitive.RadioItemIndicator>
      </span>
      {children}
    </ContextMenuPrimitive.RadioItem>
  )
}

function ContextMenuSeparator({
  className,
  ...props
}: ContextMenuPrimitive.Separator.Props) {
  return (
    <ContextMenuPrimitive.Separator
      data-slot="context-menu-separator"
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  )
}

function ContextMenuShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="context-menu-shortcut"
      className={cn(
        "ml-auto text-xs tracking-widest text-muted-foreground group-focus/context-menu-item:text-foreground",
        className
      )}
      {...props}
    />
  )
}

const CONTEXT_MENU_SIMPLE_MODE_CHILD_TYPES = new Set<React.ElementType>([
  ContextMenuGroup,
  ContextMenuLabel,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioGroup,
  ContextMenuRadioSection,
  ContextMenuSeparator,
  ContextMenuSubmenu,
])

function getContextMenuSimpleModeChildren(children: React.ReactNode): React.ReactNode[] | null {
  const childArray = React.Children.toArray(children).filter(isMeaningfulContextMenuChild)
  if (childArray.length === 0) return null
  if (!childArray.every(isContextMenuSimpleModeElement)) return null
  return childArray
}

function isMeaningfulContextMenuChild(child: React.ReactNode): boolean {
  return !(typeof child === "string" && child.trim() === "")
}

function isContextMenuSimpleModeElement(child: React.ReactNode): child is React.ReactElement {
  return isWorkbenchElementOfTypes(child, CONTEXT_MENU_SIMPLE_MODE_CHILD_TYPES)
}

export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioItem,
  ContextMenuRadioSection,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuGroup,
  ContextMenuPortal,
  ContextMenuSub,
  ContextMenuSubmenu,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuRadioGroup,
}
