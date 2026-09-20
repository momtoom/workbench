import * as React from "react"
import { Command as CommandPrimitive } from "cmdk"

import { cn } from "@/lib/utils"
import { isWorkbenchElementOfTypes } from "@/components/ui/workbench-runtime"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  InputGroup,
  InputGroupAddon,
} from "@/components/ui/input-group"
import { RiSearchLine, RiCheckLine } from "@remixicon/react"

type CommandProps = Omit<React.ComponentProps<typeof CommandPrimitive>, "label"> & {
  placeholder?: string
}

function Command({
  children,
  className,
  placeholder = "Search...",
  ...props
}: CommandProps) {
  const simpleModeChildren = getCommandSimpleModeChildren(children)

  return (
    <CommandPrimitive
      {...props}
      data-slot="command"
      label="Command menu"
      className={cn(
        "flex size-full flex-col overflow-hidden rounded-xl! bg-popover p-1 text-popover-foreground",
        className
      )}
    >
      {simpleModeChildren ? (
        <>
          <CommandInput placeholder={placeholder} />
          <CommandList>{simpleModeChildren}</CommandList>
        </>
      ) : children}
    </CommandPrimitive>
  )
}

function CommandDialog({
  title = "Command Palette",
  description = "Search for a command to run...",
  children,
  className,
  showCloseButton = false,
  ...props
}: Omit<React.ComponentProps<typeof Dialog>, "children"> & {
  title?: string
  description?: string
  className?: string
  showCloseButton?: boolean
  children: React.ReactNode
}) {
  return (
    <Dialog {...props}>
      <DialogHeader className="sr-only">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <DialogContent
        className={cn(
          "top-1/3 translate-y-0 overflow-hidden rounded-xl! p-0",
          className
        )}
        showCloseButton={showCloseButton}
      >
        {children}
      </DialogContent>
    </Dialog>
  )
}

function CommandInput({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div data-slot="command-input-wrapper" className="p-1 pb-0">
      <InputGroup className="h-8! rounded-lg! border-input/30 bg-input/30 shadow-none! *:data-[slot=input-group-addon]:pl-2!">
        <CommandPrimitive.Input
          data-slot="command-input"
          className={cn(
            "w-full text-sm outline-hidden disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          {...props}
        />
        <InputGroupAddon>
          <RiSearchLine className="size-4 shrink-0 opacity-50" />
        </InputGroupAddon>
      </InputGroup>
    </div>
  )
}

function CommandList({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      data-slot="command-list"
      className={cn(
        "no-scrollbar max-h-72 scroll-py-1 overflow-x-hidden overflow-y-auto outline-none",
        className
      )}
      {...props}
    />
  )
}

function CommandEmpty({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty
      data-slot="command-empty"
      className={cn("py-6 text-center text-sm", className)}
      {...props}
    />
  )
}

function CommandGroup({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={cn(
        "overflow-hidden p-1 text-foreground **:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:py-1.5 **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:font-medium **:[[cmdk-group-heading]]:text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function CommandSection({
  children,
  heading = "Options",
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Group> & {
  heading?: React.ReactNode
}) {
  return (
    <CommandGroup heading={heading} {...props}>
      {children}
    </CommandGroup>
  )
}

function CommandSeparator({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Separator>) {
  return (
    <CommandPrimitive.Separator
      data-slot="command-separator"
      className={cn("-mx-1 h-px bg-border", className)}
      {...props}
    />
  )
}

type CommandItemProps = Omit<React.ComponentProps<typeof CommandPrimitive.Item>, "value"> & {
  label?: string
  value?: string
}

function CommandItem({
  className,
  children,
  label,
  value,
  ...props
}: CommandItemProps) {
  const itemLabel = label ?? getCommandItemFallbackLabel(children)
  const itemValue = value ?? itemLabel

  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      value={itemValue}
      className={cn(
        "group/command-item relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none in-data-[slot=dialog-content]:rounded-lg! data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 data-selected:bg-muted data-selected:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 data-selected:*:[svg]:text-foreground",
        className
      )}
      {...props}
    >
      {children}
      <RiCheckLine className="ml-auto opacity-0 group-has-data-[slot=command-shortcut]/command-item:hidden group-data-[checked=true]/command-item:opacity-100" />
    </CommandPrimitive.Item>
  )
}

function CommandOption({
  children,
  shortcut,
  value,
  ...props
}: CommandItemProps & {
  shortcut?: React.ReactNode
}) {
  const itemValue = value ?? getCommandItemFallbackLabel(children)

  return (
    <CommandItem value={itemValue} {...props}>
      {children}
      {shortcut ? <CommandShortcut>{shortcut}</CommandShortcut> : null}
    </CommandItem>
  )
}

function getCommandItemFallbackLabel(children: React.ReactNode): string {
  const text = getCommandReactNodeText(children).trim()
  return text || "Item"
}

function getCommandReactNodeText(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node)
  if (Array.isArray(node)) return node.map(getCommandReactNodeText).join("")
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
    return getCommandReactNodeText(node.props.children)
  }
  return ""
}

function CommandShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="command-shortcut"
      className={cn(
        "ml-auto text-xs tracking-widest text-muted-foreground group-data-selected/command-item:text-foreground",
        className
      )}
      {...props}
    />
  )
}

const COMMAND_SIMPLE_MODE_CHILD_TYPES = new Set<React.ElementType>([
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandOption,
  CommandSection,
  CommandSeparator,
])

function getCommandSimpleModeChildren(children: React.ReactNode): React.ReactNode[] | null {
  const childArray = React.Children.toArray(children).filter(isMeaningfulCommandChild)
  if (childArray.length === 0) return null
  if (!childArray.every(isCommandSimpleModeElement)) return null
  return childArray
}

function isMeaningfulCommandChild(child: React.ReactNode): boolean {
  return !(typeof child === "string" && child.trim() === "")
}

function isCommandSimpleModeElement(child: React.ReactNode): child is React.ReactElement {
  return isWorkbenchElementOfTypes(child, COMMAND_SIMPLE_MODE_CHILD_TYPES)
}

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandSection,
  CommandItem,
  CommandOption,
  CommandShortcut,
  CommandSeparator,
}
