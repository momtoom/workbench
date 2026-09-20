import * as React from "react"
import { ScrollArea as ScrollAreaPrimitive } from "@base-ui/react/scroll-area"

import { cn } from "@/lib/utils"
import { isWorkbenchElementOfTypes } from "@/components/ui/workbench-runtime"

function ScrollArea({
  className,
  children,
  ...props
}: ScrollAreaPrimitive.Root.Props) {
  const childArray = React.Children.toArray(children)
  const customScrollBars = childArray.filter(isScrollBarChild)
  const contentChildren = childArray.filter((child) => !isScrollBarChild(child))

  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      className={cn("relative", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        data-slot="scroll-area-viewport"
        className="size-full overscroll-contain rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1"
      >
        {contentChildren}
      </ScrollAreaPrimitive.Viewport>
      {customScrollBars.length > 0 ? customScrollBars : <ScrollBar />}
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  )
}

function ScrollBar({
  className,
  orientation = "vertical",
  ...props
}: ScrollAreaPrimitive.Scrollbar.Props) {
  return (
    <ScrollAreaPrimitive.Scrollbar
      data-slot="scroll-area-scrollbar"
      data-orientation={orientation}
      orientation={orientation}
      className={cn(
        "flex touch-none p-px transition-colors select-none data-horizontal:h-2.5 data-horizontal:flex-col data-horizontal:border-t data-horizontal:border-t-transparent data-vertical:h-full data-vertical:w-2.5 data-vertical:border-l data-vertical:border-l-transparent",
        className
      )}
      {...props}
    >
      <ScrollAreaPrimitive.Thumb
        data-slot="scroll-area-thumb"
        className="relative flex-1 rounded-full bg-border"
      />
    </ScrollAreaPrimitive.Scrollbar>
  )
}

const SCROLL_AREA_SCROLLBAR_CHILD_TYPES = new Set<React.ElementType>([ScrollBar])

function isScrollBarChild(child: React.ReactNode): child is React.ReactElement {
  return isWorkbenchElementOfTypes(child, SCROLL_AREA_SCROLLBAR_CHILD_TYPES)
}

export { ScrollArea, ScrollBar }
