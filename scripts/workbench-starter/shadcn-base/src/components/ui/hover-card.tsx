"use client"

import * as React from "react"
import { PreviewCard as PreviewCardPrimitive } from "@base-ui/react/preview-card"

import { cn } from "@/lib/utils"
import {
  isWorkbenchElementOfTypes,
  splitWorkbenchRuntimeRootProps,
} from "@/components/ui/workbench-runtime"
import { useWorkbenchPortalContainer } from "@/lib/workbench-portal"
import { Button } from "@/components/ui/button"

type HoverCardProps = PreviewCardPrimitive.Root.Props &
  Pick<
    PreviewCardPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset" | "positionMethod"
  > & {
    content?: React.ReactNode
    contentClassName?: string
    trigger?: React.ReactNode
    triggerClassName?: string
  }

function HoverCard({
  align = "center",
  alignOffset = 4,
  children,
  content,
  contentClassName,
  positionMethod,
  side = "bottom",
  sideOffset = 4,
  trigger = "Preview",
  triggerClassName,
  ...props
}: HoverCardProps) {
  const simpleModeChildren = getHoverCardSimpleModeChildren(children as React.ReactNode)
  const useSimpleMode = simpleModeChildren !== null || children == null || content !== undefined
  const hoverCardContent = simpleModeChildren ?? content
  const { componentProps, runtimeRootProps } = splitWorkbenchRuntimeRootProps(
    props as Record<string, unknown>
  )

  return (
    <PreviewCardPrimitive.Root data-slot="hover-card" {...componentProps}>
      {useSimpleMode ? (
        <>
          <HoverCardTrigger
            className={triggerClassName}
            render={<Button variant="outline" />}
            {...runtimeRootProps}
          >
            {trigger}
          </HoverCardTrigger>
          <HoverCardContent
            align={align}
            alignOffset={alignOffset}
            className={contentClassName}
            positionMethod={positionMethod}
            side={side}
            sideOffset={sideOffset}
          >
            {hoverCardContent}
          </HoverCardContent>
        </>
      ) : children}
    </PreviewCardPrimitive.Root>
  )
}

function HoverCardTrigger({ ...props }: PreviewCardPrimitive.Trigger.Props) {
  return (
    <PreviewCardPrimitive.Trigger data-slot="hover-card-trigger" {...props} />
  )
}

function HoverCardContent({
  className,
  side = "bottom",
  sideOffset = 4,
  align = "center",
  alignOffset = 4,
  positionMethod,
  ...props
}: PreviewCardPrimitive.Popup.Props &
  Pick<
    PreviewCardPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset" | "positionMethod"
  >) {
  const portalContainer = useWorkbenchPortalContainer()
  return (
    <PreviewCardPrimitive.Portal
      data-slot="hover-card-portal"
      container={portalContainer}
    >
      <PreviewCardPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        positionMethod={positionMethod ?? (portalContainer ? "fixed" : undefined)}
        side={side}
        sideOffset={sideOffset}
        className="isolate z-50"
      >
        <PreviewCardPrimitive.Popup
          data-slot="hover-card-content"
          className={cn(
            "z-50 w-64 origin-(--transform-origin) rounded-lg bg-popover p-2.5 text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-hidden duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className
          )}
          {...props}
        />
      </PreviewCardPrimitive.Positioner>
    </PreviewCardPrimitive.Portal>
  )
}

const HOVER_CARD_COMPOUND_CHILD_TYPES = new Set<React.ElementType>([
  HoverCardTrigger,
  HoverCardContent,
])

function getHoverCardSimpleModeChildren(children: React.ReactNode): React.ReactNode[] | null {
  const childArray = React.Children.toArray(children).filter(isMeaningfulHoverCardChild)
  if (childArray.length === 0) return null
  if (childArray.some(isHoverCardCompoundModeElement)) return null
  return childArray
}

function isMeaningfulHoverCardChild(child: React.ReactNode): boolean {
  return !(typeof child === "string" && child.trim() === "")
}

function isHoverCardCompoundModeElement(child: React.ReactNode): boolean {
  return isWorkbenchElementOfTypes(child, HOVER_CARD_COMPOUND_CHILD_TYPES)
}

export { HoverCard, HoverCardTrigger, HoverCardContent }
