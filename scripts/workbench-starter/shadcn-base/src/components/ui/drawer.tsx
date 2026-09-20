"use client"

import * as React from "react"
import { Drawer as DrawerPrimitive } from "vaul"

import { cn } from "@/lib/utils"
import {
  isWorkbenchElementOfTypes,
  splitWorkbenchRuntimeRootProps,
} from "@/components/ui/workbench-runtime"
import {
  useWorkbenchPortalContainer,
  WorkbenchPortalScopeProvider,
} from "@/lib/workbench-portal"

const DRAWER_TRIGGER_CLASS_NAME =
  "inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted"

type DrawerProps = React.ComponentProps<typeof DrawerPrimitive.Root> & {
  className?: string
  contentClassName?: string
  trigger?: React.ReactNode
  triggerClassName?: string
}

function Drawer({
  className,
  children,
  contentClassName,
  trigger = "Open drawer",
  triggerClassName,
  ...props
}: DrawerProps) {
  const simpleModeChildren = getDrawerSimpleModeChildren(children)
  const { componentProps, runtimeRootProps } = splitWorkbenchRuntimeRootProps(
    props as Record<string, unknown>
  )

  return (
    <DrawerPrimitive.Root data-slot="drawer" {...componentProps}>
      {simpleModeChildren ? (
        <>
          <DrawerTrigger
            className={cn(DRAWER_TRIGGER_CLASS_NAME, className, triggerClassName)}
            {...runtimeRootProps}
          >
            {trigger}
          </DrawerTrigger>
          <DrawerContent className={contentClassName}>
            {simpleModeChildren}
          </DrawerContent>
        </>
      ) : children}
    </DrawerPrimitive.Root>
  )
}

const DrawerTrigger = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Trigger>
>(function DrawerTrigger(props, ref) {
  return <DrawerPrimitive.Trigger ref={ref} data-slot="drawer-trigger" {...props} />
})

function DrawerPortal({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Portal>) {
  const workbenchPortalContainer = useWorkbenchPortalContainer()
  return (
    <DrawerPrimitive.Portal
      data-slot="drawer-portal"
      container={workbenchPortalContainer}
      {...props}
    />
  )
}

const DrawerClose = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Close>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Close>
>(function DrawerClose(props, ref) {
  return <DrawerPrimitive.Close ref={ref} data-slot="drawer-close" {...props} />
})

const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(function DrawerOverlay({ className, ...props }, ref) {
  return (
    <DrawerPrimitive.Overlay
      ref={ref}
      data-slot="drawer-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/10 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props}
    />
  )
})

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content>
>(function DrawerContent({ className, children, ...props }, ref) {
  const [contentElement, setContentElement] = React.useState<HTMLElement | null>(
    null
  )
  const handleContentRef = React.useCallback(
    (node: React.ElementRef<typeof DrawerPrimitive.Content> | null) => {
      setContentElement(node)
      if (typeof ref === "function") {
        ref(node)
        return
      }
      if (ref) {
        ref.current = node
      }
    },
    [ref]
  )

  return (
    <DrawerPortal data-slot="drawer-portal">
      <DrawerPrimitive.Close asChild>
        <DrawerOverlay />
      </DrawerPrimitive.Close>
      <DrawerPrimitive.Content
        ref={handleContentRef}
        data-slot="drawer-content"
        className={cn(
          "group/drawer-content fixed z-50 flex h-auto flex-col bg-popover text-sm text-popover-foreground data-[vaul-drawer-direction=bottom]:inset-x-0 data-[vaul-drawer-direction=bottom]:bottom-0 data-[vaul-drawer-direction=bottom]:mt-24 data-[vaul-drawer-direction=bottom]:max-h-[80vh] data-[vaul-drawer-direction=bottom]:rounded-t-xl data-[vaul-drawer-direction=bottom]:border-t data-[vaul-drawer-direction=left]:inset-y-0 data-[vaul-drawer-direction=left]:left-0 data-[vaul-drawer-direction=left]:w-3/4 data-[vaul-drawer-direction=left]:rounded-r-xl data-[vaul-drawer-direction=left]:border-r data-[vaul-drawer-direction=right]:inset-y-0 data-[vaul-drawer-direction=right]:right-0 data-[vaul-drawer-direction=right]:w-3/4 data-[vaul-drawer-direction=right]:rounded-l-xl data-[vaul-drawer-direction=right]:border-l data-[vaul-drawer-direction=top]:inset-x-0 data-[vaul-drawer-direction=top]:top-0 data-[vaul-drawer-direction=top]:mb-24 data-[vaul-drawer-direction=top]:max-h-[80vh] data-[vaul-drawer-direction=top]:rounded-b-xl data-[vaul-drawer-direction=top]:border-b data-[vaul-drawer-direction=left]:sm:max-w-sm data-[vaul-drawer-direction=right]:sm:max-w-sm",
          className
        )}
        {...props}
      >
        <WorkbenchPortalScopeProvider container={contentElement}>
          <div className="mx-auto mt-4 hidden h-1 w-25 shrink-0 rounded-full bg-muted group-data-[vaul-drawer-direction=bottom]/drawer-content:block" />
          {children}
        </WorkbenchPortalScopeProvider>
      </DrawerPrimitive.Content>
    </DrawerPortal>
  )
})

function DrawerHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-header"
      className={cn(
        "flex flex-col gap-0.5 p-0 group-data-[vaul-drawer-direction=bottom]/drawer-content:text-center group-data-[vaul-drawer-direction=top]/drawer-content:text-center md:gap-0.5 md:text-left",
        className
      )}
      {...props}
    />
  )
}

function DrawerFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-footer"
      className={cn("mt-auto flex flex-col gap-2 p-0", className)}
      {...props}
    />
  )
}

const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(function DrawerTitle({ className, ...props }, ref) {
  return (
    <DrawerPrimitive.Title
      ref={ref}
      data-slot="drawer-title"
      className={cn(
        "font-heading text-base font-medium text-foreground",
        className
      )}
      {...props}
    />
  )
})

const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(function DrawerDescription({ className, ...props }, ref) {
  return (
    <DrawerPrimitive.Description
      ref={ref}
      data-slot="drawer-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
})

const DRAWER_COMPOUND_CHILD_TYPES = new Set<React.ElementType>([
  DrawerTrigger,
  DrawerPortal,
  DrawerOverlay,
  DrawerContent,
])

function getDrawerSimpleModeChildren(children: React.ReactNode): React.ReactNode[] | null {
  const childArray = React.Children.toArray(children).filter(isMeaningfulDrawerChild)
  if (childArray.length === 0) return null
  if (childArray.some(isDrawerCompoundModeElement)) return null
  return childArray
}

function isMeaningfulDrawerChild(child: React.ReactNode): boolean {
  return !(typeof child === "string" && child.trim() === "")
}

function isDrawerCompoundModeElement(child: React.ReactNode): boolean {
  return isWorkbenchElementOfTypes(child, DRAWER_COMPOUND_CHILD_TYPES)
}

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
}
