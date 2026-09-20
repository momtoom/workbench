import * as React from "react"
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { isWorkbenchElementOfType } from "@/components/ui/workbench-runtime"

function Tabs({
  children,
  className,
  orientation = "horizontal",
  ...props
}: TabsPrimitive.Root.Props) {
  const childArray = React.Children.toArray(children).filter(isMeaningfulTabsChild)
  const paneChildren = childArray.filter(isTabsPaneElement)
  const usePaneMode = paneChildren.length > 0 && paneChildren.length === childArray.length

  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      orientation={orientation}
      className={cn(
        "group/tabs flex gap-2 data-horizontal:flex-col",
        className
      )}
      {...props}
    >
      {usePaneMode ? (
        <>
          <TabsList>
            {paneChildren.map((child) => (
              <TabsTrigger
                key={child.props.value}
                className={child.props.triggerClassName}
                disabled={child.props.disabled}
                value={child.props.value}
              >
                {child.props.title}
              </TabsTrigger>
            ))}
          </TabsList>
          {children}
        </>
      ) : children}
    </TabsPrimitive.Root>
  )
}

type TabsPaneProps = Omit<TabsPrimitive.Panel.Props, "title" | "value"> & {
  disabled?: boolean
  title?: React.ReactNode
  triggerClassName?: string
  value: TabsPrimitive.Tab.Props["value"]
}

function TabsPane({
  className,
  disabled: _disabled,
  keepMounted = true,
  title: _title,
  triggerClassName: _triggerClassName,
  value,
  ...props
}: TabsPaneProps) {
  void _disabled
  void _title
  void _triggerClassName

  return (
    <TabsContent
      className={className}
      keepMounted={keepMounted}
      value={value}
      {...props}
    />
  )
}

function isTabsPaneElement(child: React.ReactNode): child is React.ReactElement<TabsPaneProps> {
  return isWorkbenchElementOfType(child, TabsPane, "TabsPane")
}

function isMeaningfulTabsChild(child: React.ReactNode): boolean {
  return !(typeof child === "string" && child.trim() === "")
}

const tabsListVariants = cva(
  "group/tabs-list inline-flex w-fit items-center justify-center rounded-lg p-0.75 text-muted-foreground group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col data-[variant=line]:rounded-none",
  {
    variants: {
      variant: {
        default: "bg-muted",
        line: "gap-1 bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function TabsList({
  className,
  variant = "default",
  ...props
}: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-1.5 py-0.5 text-sm font-medium whitespace-nowrap text-foreground/60 transition-all group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 has-data-[icon=inline-end]:pr-1 has-data-[icon=inline-start]:pl-1 aria-disabled:pointer-events-none aria-disabled:opacity-50 dark:text-muted-foreground dark:hover:text-foreground group-data-[variant=default]/tabs-list:data-active:shadow-sm group-data-[variant=line]/tabs-list:data-active:shadow-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:data-active:bg-transparent dark:group-data-[variant=line]/tabs-list:data-active:border-transparent dark:group-data-[variant=line]/tabs-list:data-active:bg-transparent",
        "data-active:bg-background data-active:text-foreground dark:data-active:border-input dark:data-active:bg-input/30 dark:data-active:text-foreground",
        "after:absolute after:bg-foreground after:opacity-0 after:transition-opacity group-data-horizontal/tabs:after:inset-x-0 group-data-horizontal/tabs:after:bottom-[-5px] group-data-horizontal/tabs:after:h-0.5 group-data-vertical/tabs:after:inset-y-0 group-data-vertical/tabs:after:-right-1 group-data-vertical/tabs:after:w-0.5 group-data-[variant=line]/tabs-list:data-active:after:opacity-100",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({ className, keepMounted = true, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      keepMounted={keepMounted}
      className={cn("flex-1 text-sm outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, TabsPane, tabsListVariants }
