"use client"

import * as React from "react"
import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip"

import { cn } from "@/lib/utils"
import {
  isWorkbenchElementOfTypes,
  splitWorkbenchRuntimeRootProps,
} from "@/components/ui/workbench-runtime"
import { useWorkbenchPortalContainer } from "@/lib/workbench-portal"
import { Button } from "@/components/ui/button"

function TooltipProvider({
  delay = 0,
  ...props
}: TooltipPrimitive.Provider.Props) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delay={delay}
      {...props}
    />
  )
}

type TooltipProps = TooltipPrimitive.Root.Props &
  Pick<
    TooltipPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset" | "positionMethod"
  > & {
    content?: React.ReactNode
    contentClassName?: string
    trigger?: React.ReactNode
    triggerClassName?: string
  }

function Tooltip({
  align = "center",
  alignOffset = 0,
  children,
  content,
  contentClassName,
  positionMethod,
  side = "top",
  sideOffset = 4,
  trigger = "Hover me",
  triggerClassName,
  ...props
}: TooltipProps) {
  const simpleModeChildren = getTooltipSimpleModeChildren(children as React.ReactNode)
  const useSimpleMode = simpleModeChildren !== null || children == null || content !== undefined
  const tooltipContent = simpleModeChildren ?? content
  const { componentProps, runtimeRootProps } = splitWorkbenchRuntimeRootProps(
    props as Record<string, unknown>
  )

  return (
    <TooltipPrimitive.Root data-slot="tooltip" {...componentProps}>
      {useSimpleMode ? (
        <>
          <TooltipTrigger
            className={triggerClassName}
            render={<Button size="sm" variant="outline" />}
            {...runtimeRootProps}
          >
            {trigger}
          </TooltipTrigger>
          <TooltipContent
            align={align}
            alignOffset={alignOffset}
            className={contentClassName}
            positionMethod={positionMethod}
            side={side}
            sideOffset={sideOffset}
          >
            {tooltipContent}
          </TooltipContent>
        </>
      ) : children}
    </TooltipPrimitive.Root>
  )
}

function TooltipTrigger({ ...props }: TooltipPrimitive.Trigger.Props) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
}

function TooltipContent({
  className,
  side = "top",
  sideOffset = 4,
  align = "center",
  alignOffset = 0,
  children,
  positionMethod,
  ...props
}: TooltipPrimitive.Popup.Props &
  Pick<
    TooltipPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset" | "positionMethod"
  >) {
  const portalContainer = useWorkbenchPortalContainer()
  return (
    <TooltipPrimitive.Portal
      container={portalContainer}
    >
      <TooltipPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        positionMethod={positionMethod ?? (portalContainer ? "fixed" : undefined)}
        side={side}
        sideOffset={sideOffset}
        className="isolate z-50"
      >
        <TooltipPrimitive.Popup
          data-slot="tooltip-content"
          className={cn(
            "z-50 inline-flex w-fit max-w-xs origin-(--transform-origin) items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs text-background has-data-[slot=kbd]:pr-1.5 data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 **:data-[slot=kbd]:relative **:data-[slot=kbd]:isolate **:data-[slot=kbd]:z-50 **:data-[slot=kbd]:rounded-sm data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className
          )}
          {...props}
        >
          {children}
          <TooltipPrimitive.Arrow className="z-50 size-2.5 translate-y-[calc(-50%-2px)] rotate-45 rounded-xs bg-foreground fill-foreground data-[side=bottom]:top-1 data-[side=inline-end]:top-1/2! data-[side=inline-end]:-left-1 data-[side=inline-end]:-translate-y-1/2 data-[side=inline-start]:top-1/2! data-[side=inline-start]:-right-1 data-[side=inline-start]:-translate-y-1/2 data-[side=left]:top-1/2! data-[side=left]:-right-1 data-[side=left]:-translate-y-1/2 data-[side=right]:top-1/2! data-[side=right]:-left-1 data-[side=right]:-translate-y-1/2 data-[side=top]:-bottom-2.5" />
        </TooltipPrimitive.Popup>
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  )
}

const TOOLTIP_COMPOUND_CHILD_TYPES = new Set<React.ElementType>([
  TooltipTrigger,
  TooltipContent,
])

function getTooltipSimpleModeChildren(children: React.ReactNode): React.ReactNode[] | null {
  const childArray = React.Children.toArray(children).filter(isMeaningfulTooltipChild)
  if (childArray.length === 0) return null
  if (childArray.some(isTooltipCompoundModeElement)) return null
  return childArray
}

function isMeaningfulTooltipChild(child: React.ReactNode): boolean {
  return !(typeof child === "string" && child.trim() === "")
}

function isTooltipCompoundModeElement(child: React.ReactNode): boolean {
  return isWorkbenchElementOfTypes(child, TOOLTIP_COMPOUND_CHILD_TYPES)
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
