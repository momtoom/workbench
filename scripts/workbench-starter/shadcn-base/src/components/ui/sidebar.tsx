"use client"

import * as React from "react"
import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { RiSideBarLine } from "@remixicon/react"

const SIDEBAR_COOKIE_NAME = "sidebar_state"
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
const SIDEBAR_WIDTH = "var(--ds-token-workbench-components-sidebar-width, 16rem)"
const SIDEBAR_WIDTH_MOBILE = "var(--ds-token-workbench-components-sidebar-width-mobile, 18rem)"
const SIDEBAR_WIDTH_ICON = "var(--ds-token-workbench-components-sidebar-collapsed-width-md, 3rem)"
const SIDEBAR_WIDTH_ICON_BY_SIZE = {
  sm: "var(--ds-token-workbench-components-sidebar-collapsed-width-sm, 2.5rem)",
  md: SIDEBAR_WIDTH_ICON,
  lg: "var(--ds-token-workbench-components-sidebar-collapsed-width-lg, 3.5rem)",
} as const
const SIDEBAR_MIN_RESIZABLE_WIDTH = 192
const SIDEBAR_MAX_RESIZABLE_WIDTH = 480
const SIDEBAR_KEYBOARD_SHORTCUT = "b"

type SidebarCollapsedSize = keyof typeof SIDEBAR_WIDTH_ICON_BY_SIZE

type SidebarResizeContextProps = {
  resizable: boolean
  resizing: boolean
  startResize: (event: React.PointerEvent<HTMLButtonElement>) => void
}

const SidebarResizeContext = React.createContext<SidebarResizeContextProps>({
  resizable: false,
  resizing: false,
  startResize: () => undefined,
})

const SidebarSizeContext = React.createContext<SidebarCollapsedSize>("md")

type SidebarContextProps = {
  state: "expanded" | "collapsed"
  open: boolean
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
}

const SidebarContext = React.createContext<SidebarContextProps | null>(null)

const fallbackSidebarContext: SidebarContextProps = {
  state: "collapsed",
  open: false,
  setOpen: () => undefined,
  openMobile: false,
  setOpenMobile: () => undefined,
  isMobile: false,
  toggleSidebar: () => undefined,
}

function useSidebar() {
  const context = React.useContext(SidebarContext)
  return context ?? fallbackSidebarContext
}

function SidebarProvider({
  contained = false,
  defaultOpen = true,
  open: openProp,
  onOpenChange: setOpenProp,
  className,
  style,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  contained?: boolean
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const detectedMobile = useIsMobile()
  const isMobile = detectedMobile && !contained
  const [openMobile, setOpenMobile] = React.useState(false)

  // This is the internal state of the sidebar.
  // We use openProp and setOpenProp for control from outside the component.
  const [_open, _setOpen] = React.useState(defaultOpen)
  const open = openProp ?? _open
  const setOpen = React.useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const openState = typeof value === "function" ? value(open) : value
      if (setOpenProp) {
        setOpenProp(openState)
      } else {
        _setOpen(openState)
      }

      // This sets the cookie to keep the sidebar state.
      document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
    },
    [setOpenProp, open]
  )

  // Helper to toggle the sidebar.
  const toggleSidebar = React.useCallback(() => {
    return isMobile ? setOpenMobile((open) => !open) : setOpen((open) => !open)
  }, [isMobile, setOpen, setOpenMobile])

  // Adds a keyboard shortcut to toggle the sidebar.
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
        (event.metaKey || event.ctrlKey)
      ) {
        event.preventDefault()
        toggleSidebar()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [toggleSidebar])

  // We add a state so that we can do data-state="expanded" or "collapsed".
  // This makes it easier to style the sidebar with Tailwind classes.
  const state = open ? "expanded" : "collapsed"

  const contextValue = React.useMemo<SidebarContextProps>(
    () => ({
      state,
      open,
      setOpen,
      isMobile,
      openMobile,
      setOpenMobile,
      toggleSidebar,
    }),
    [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar]
  )

  return (
    <SidebarContext.Provider value={contextValue}>
      <div
        data-slot="sidebar-wrapper"
        style={
          {
            "--sidebar-width": SIDEBAR_WIDTH,
            "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
            ...style,
          } as React.CSSProperties
        }
        className={cn(
          "group/sidebar-wrapper flex min-h-svh w-full has-data-[variant=inset]:bg-sidebar",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  )
}

function Sidebar({
  side = "left",
  variant = "sidebar",
  collapsible = "offcanvas",
  collapsedSize = "md",
  contained = false,
  expanded,
  resizable = false,
  className,
  children,
  dir,
  style,
  ...props
}: React.ComponentProps<"div"> & {
  side?: "left" | "right"
  variant?: "sidebar" | "floating" | "inset"
  collapsible?: "offcanvas" | "icon" | "none"
  collapsedSize?: SidebarCollapsedSize
  contained?: boolean
  expanded?: boolean
  resizable?: boolean
}) {
  const { isMobile, state, openMobile, setOpen, setOpenMobile } = useSidebar()
  const appliedExpandedRef = React.useRef<string | undefined>(undefined)
  const hasFloatingOffset = variant === "floating" || variant === "inset"
  const [resizedWidth, setResizedWidth] = React.useState<number | null>(null)
  const [resizing, setResizing] = React.useState(false)

  const startResize = React.useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    if (!resizable || isMobile || state !== "expanded") return

    const sidebar = event.currentTarget.closest<HTMLElement>('[data-slot="sidebar"]')
    const container = sidebar?.querySelector<HTMLElement>('[data-slot="sidebar-container"]')
    if (!sidebar || !container) return

    event.preventDefault()
    const pointerId = event.pointerId
    const startX = event.clientX
    const startWidth = container.getBoundingClientRect().width
    const direction = side === "left" ? 1 : -1
    setResizing(true)
    event.currentTarget.setPointerCapture(pointerId)

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const nextWidth = Math.min(
        SIDEBAR_MAX_RESIZABLE_WIDTH,
        Math.max(
          SIDEBAR_MIN_RESIZABLE_WIDTH,
          startWidth + (moveEvent.clientX - startX) * direction
        )
      )
      setResizedWidth(Math.round(nextWidth))
    }

    const finishResize = () => {
      setResizing(false)
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", finishResize)
      window.removeEventListener("pointercancel", finishResize)
    }

    window.addEventListener("pointermove", handlePointerMove)
    window.addEventListener("pointerup", finishResize)
    window.addEventListener("pointercancel", finishResize)
  }, [isMobile, resizable, side, state])

  const resizeContextValue = React.useMemo<SidebarResizeContextProps>(
    () => ({ resizable: resizable && !isMobile, resizing, startResize }),
    [isMobile, resizable, resizing, startResize]
  )

  React.useEffect(() => {
    if (expanded === undefined) return
    const appliedKey = `${isMobile ? "mobile" : "desktop"}:${expanded}`
    if (appliedExpandedRef.current === appliedKey) return
    appliedExpandedRef.current = appliedKey
    if (isMobile) {
      setOpenMobile(expanded)
      return
    }
    setOpen(expanded)
  }, [expanded, isMobile, setOpen, setOpenMobile])

  if (collapsible === "none") {
    return (
      <SidebarSizeContext.Provider value={collapsedSize}>
      <div
        data-slot="sidebar"
        className={cn(
          "flex h-full w-(--sidebar-width) flex-col bg-sidebar text-sidebar-foreground",
          className
        )}
        {...props}
      >
        {children}
      </div>
      </SidebarSizeContext.Provider>
    )
  }

  if (isMobile) {
    return (
      <SidebarSizeContext.Provider value={collapsedSize}>
      <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
        <SheetContent
          dir={dir}
          data-sidebar="sidebar"
          data-slot="sidebar"
          data-mobile="true"
          className={cn(
            "w-(--sidebar-width) bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden",
            className
          )}
          style={
            {
              "--sidebar-width": SIDEBAR_WIDTH_MOBILE,
              ...style,
            } as React.CSSProperties
          }
          side={side}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Sidebar</SheetTitle>
            <SheetDescription>Displays the mobile sidebar.</SheetDescription>
          </SheetHeader>
          {/* Same className and same `sidebar-inner` slot as the desktop
              branch. Dropping either made page-level sidebar styling apply on
              desktop and silently vanish on mobile -- a page that paints its
              sidebar dark got a light sheet, so hover styles written for the
              dark surface turned white-on-white. */}
          <div data-slot="sidebar-inner" className="flex h-full w-full flex-col bg-sidebar text-sidebar-foreground">
            {children}
          </div>
        </SheetContent>
      </Sheet>
      </SidebarSizeContext.Provider>
    )
  }

  return (
    <SidebarSizeContext.Provider value={collapsedSize}>
    <SidebarResizeContext.Provider value={resizeContextValue}>
    <div
      className={cn(
        "group peer w-(--sidebar-width) shrink-0 text-sidebar-foreground transition-[width] duration-200 ease-linear data-[collapsible=offcanvas]:w-0 data-[resizing=true]:transition-none",
        "data-[collapsible=icon]:w-(--sidebar-width-icon)",
        contained ? "block" : "hidden md:block"
      )}
      data-state={state}
      data-collapsible={state === "collapsed" ? collapsible : ""}
      data-collapsed-size={state === "collapsed" && collapsible === "icon" ? collapsedSize : ""}
      data-variant={variant}
      data-side={side}
      data-resizable={resizable ? "true" : "false"}
      data-resizing={resizing ? "true" : "false"}
      data-slot="sidebar"
      style={{
        "--sidebar-width": resizedWidth === null ? undefined : `${resizedWidth}px`,
        "--sidebar-width-icon": SIDEBAR_WIDTH_ICON_BY_SIZE[collapsedSize],
        // Caller style last: token overrides such as `--sidebar` are how a page
        // recolours its sidebar, and both branches previously dropped them.
        ...style,
      } as React.CSSProperties}
    >
      {/* This is what handles the sidebar gap on desktop */}
      <div
        data-slot="sidebar-gap"
        className={cn(
          "relative w-(--sidebar-width) bg-transparent transition-[width] duration-200 ease-linear group-data-[resizing=true]:transition-none",
          "group-data-[collapsible=offcanvas]:w-0",
          "group-data-[side=right]:rotate-180",
          "group-data-[collapsible=icon]:w-(--sidebar-width-icon)"
        )}
      />
      <div
        data-slot="sidebar-container"
        data-side={side}
        className={cn(
          "inset-y-0 z-30 w-(--sidebar-width) transition-[left,right,width] duration-200 ease-linear group-data-[resizing=true]:transition-none data-[side=left]:left-0 data-[side=left]:group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)] data-[side=right]:right-0 data-[side=right]:group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]",
          contained ? "absolute h-full" : "fixed h-svh",
          contained ? "flex" : "hidden md:flex",
          // Adjust the padding for floating and inset variants.
          hasFloatingOffset
            ? "p-2 group-data-[collapsible=icon]:w-(--sidebar-width-icon) group-data-[collapsible=icon]:p-1"
            : "group-data-[collapsible=icon]:w-(--sidebar-width-icon) group-data-[side=left]:border-r group-data-[side=right]:border-l",
          className
        )}
        {...props}
      >
        <div
          data-sidebar="sidebar"
          data-slot="sidebar-inner"
          className="flex size-full flex-col bg-sidebar text-sidebar-foreground group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:shadow-sm group-data-[variant=floating]:ring-1 group-data-[variant=floating]:ring-sidebar-border"
        >
          {children}
        </div>
      </div>
    </div>
    </SidebarResizeContext.Provider>
    </SidebarSizeContext.Provider>
  )
}

function SidebarTrigger({
  className,
  onClick,
  icon,
  collapsedIcon,
  expandedIcon,
  label = "Toggle Sidebar",
  children,
  ...props
}: React.ComponentProps<typeof Button> & {
  icon?: React.ReactNode
  collapsedIcon?: React.ReactNode
  expandedIcon?: React.ReactNode
  label?: string
}) {
  const { isMobile, openMobile, state, toggleSidebar } = useSidebar()
  const triggerState = (isMobile ? openMobile : state === "expanded") ? "expanded" : "collapsed"
  const stateIcon = triggerState === "expanded" ? expandedIcon : collapsedIcon

  return (
    <Button
      data-sidebar="trigger"
      data-slot="sidebar-trigger"
      data-state={triggerState}
      variant="ghost"
      size="icon-sm"
      className={cn("group/sidebar-trigger", className)}
      onClick={(event: Parameters<NonNullable<React.ComponentProps<typeof Button>["onClick"]>>[0]) => {
        onClick?.(event)
        toggleSidebar()
      }}
      {...props}
    >
      {children ?? stateIcon ?? icon ?? <RiSideBarLine />}
      <span className="sr-only">{label}</span>
    </Button>
  )
}

function SidebarTriggerCollapsedIcon({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="sidebar-trigger-collapsed-icon"
      className={cn("inline-flex size-4 items-center justify-center group-data-[state=expanded]/sidebar-trigger:hidden [&>svg]:size-4", className)}
      {...props}
    />
  )
}

function SidebarTriggerExpandedIcon({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="sidebar-trigger-expanded-icon"
      className={cn("hidden size-4 items-center justify-center group-data-[state=expanded]/sidebar-trigger:inline-flex [&>svg]:size-4", className)}
      {...props}
    />
  )
}

function SidebarRail({
  className,
  onClick,
  onPointerDown,
  style,
  ...props
}: React.ComponentProps<"button">) {
  const { toggleSidebar } = useSidebar()
  const { resizable, resizing, startResize } = React.useContext(SidebarResizeContext)
  const draggedRef = React.useRef(false)
  const pointerStartRef = React.useRef<number | null>(null)

  return (
    <button
      data-sidebar="rail"
      data-slot="sidebar-rail"
      aria-label="Toggle Sidebar"
      tabIndex={-1}
      onPointerDown={(event) => {
        onPointerDown?.(event)
        if (event.defaultPrevented || !resizable) return
        pointerStartRef.current = event.clientX
        draggedRef.current = false
        startResize(event)
      }}
      onPointerMove={(event) => {
        if (pointerStartRef.current !== null && Math.abs(event.clientX - pointerStartRef.current) > 3) {
          draggedRef.current = true
        }
      }}
      onPointerUp={() => {
        pointerStartRef.current = null
      }}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented || draggedRef.current) {
          draggedRef.current = false
          return
        }
        toggleSidebar()
      }}
      title={resizable ? "Resize or toggle Sidebar" : "Toggle Sidebar"}
      className={cn(
        "absolute inset-y-0 z-20 hidden w-4 transition-all ease-linear group-data-[side=left]:-right-4 group-data-[side=right]:left-0 after:absolute after:inset-y-0 after:start-1/2 after:w-[2px] hover:after:bg-sidebar-border sm:flex ltr:-translate-x-1/2 rtl:-translate-x-1/2",
        resizable && "cursor-col-resize",
        !resizable && "cursor-pointer",
        resizing && "after:bg-sidebar-border",
        "group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full hover:group-data-[collapsible=offcanvas]:bg-sidebar",
        "[[data-side=left][data-collapsible=offcanvas]_&]:-right-2",
        "[[data-side=right][data-collapsible=offcanvas]_&]:-left-2",
        className
      )}
      style={{ touchAction: resizable ? "none" : undefined, ...style }}
      {...props}
    />
  )
}

function SidebarInset({ className, ...props }: React.ComponentProps<"main">) {
  return (
    <main
      data-slot="sidebar-inset"
      className={cn(
        "relative flex w-full flex-1 flex-col bg-background md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2",
        className
      )}
      {...props}
    />
  )
}

function SidebarInput({
  className,
  ...props
}: React.ComponentProps<typeof Input>) {
  return (
    <Input
      data-slot="sidebar-input"
      data-sidebar="input"
      className={cn("h-8 w-full bg-background shadow-none group-data-[collapsible=icon]:hidden", className)}
      {...props}
    />
  )
}

function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-header"
      data-sidebar="header"
      className={cn("flex flex-col gap-2 p-2 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:p-1", className)}
      {...props}
    />
  )
}

function SidebarBrand({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-brand"
      data-sidebar="brand"
      className={cn(
        "flex h-12 min-w-0 items-center gap-3 overflow-visible px-2 transition-[gap,padding] duration-200 ease-linear group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0",
        className
      )}
      {...props}
    />
  )
}

const sidebarBrandMarkVariants = cva(
  "flex size-[var(--ds-token-workbench-components-sidebar-collapsed-item-size-lg)] shrink-0 items-center justify-center rounded-xl [--sidebar-brand-graphic-size:1.5rem] transition-[width,height,border-radius] duration-200 ease-linear group-data-[collapsed-size=sm]:size-[var(--ds-token-workbench-components-sidebar-collapsed-item-size-sm)] group-data-[collapsed-size=sm]:rounded-md group-data-[collapsed-size=sm]:[--sidebar-brand-graphic-size:1rem] group-data-[collapsed-size=md]:size-[var(--ds-token-workbench-components-sidebar-collapsed-item-size-md)] group-data-[collapsed-size=md]:rounded-lg group-data-[collapsed-size=md]:[--sidebar-brand-graphic-size:1.25rem] group-data-[collapsed-size=lg]:size-[var(--ds-token-workbench-components-sidebar-collapsed-item-size-lg)] group-data-[collapsed-size=lg]:[--sidebar-brand-graphic-size:1.5rem] [&>svg]:size-(--sidebar-brand-graphic-size)",
  {
    variants: {
      variant: {
        plain: "overflow-visible bg-transparent text-inherit",
        framed: "overflow-visible bg-primary text-primary-foreground",
      },
    },
    defaultVariants: {
      variant: "plain",
    },
  }
)

function SidebarBrandMark({
  className,
  variant = "plain",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof sidebarBrandMarkVariants>) {
  return (
    <div
      data-slot="sidebar-brand-mark"
      data-sidebar="brand-mark"
      className={cn(sidebarBrandMarkVariants({ variant }), className)}
      {...props}
    />
  )
}

const sidebarBrandImageVariants = cva("block size-full", {
  variants: {
    fit: {
      contain: "object-contain",
      cover: "object-cover",
    },
  },
  defaultVariants: {
    fit: "contain",
  },
})

function SidebarBrandImage({
  className,
  fit = "contain",
  alt = "",
  ...props
}: React.ComponentProps<"img"> & VariantProps<typeof sidebarBrandImageVariants>) {
  return (
    <img
      data-slot="sidebar-brand-image"
      data-sidebar="brand-image"
      alt={alt}
      className={cn(sidebarBrandImageVariants({ fit }), className)}
      {...props}
    />
  )
}

function SidebarBrandContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-brand-content"
      data-sidebar="brand-content"
      className={cn(
        "min-w-0 max-w-full flex-1 overflow-hidden whitespace-nowrap opacity-100 transition-[max-width,opacity] duration-200 ease-linear group-data-[collapsible=icon]:pointer-events-none group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:opacity-0 [&>*]:truncate",
        className
      )}
      {...props}
    />
  )
}

function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-footer"
      data-sidebar="footer"
      className={cn("flex flex-col gap-2 p-2 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:p-2", className)}
      {...props}
    />
  )
}

function SidebarSeparator({
  className,
  ...props
}: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="sidebar-separator"
      data-sidebar="separator"
      className={cn("mx-2 w-auto! bg-sidebar-border", className)}
      {...props}
    />
  )
}

function SidebarContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-content"
      data-sidebar="content"
      className={cn(
        "no-scrollbar flex min-h-0 flex-1 flex-col gap-0 overflow-auto group-data-[collapsible=icon]:overflow-hidden",
        className
      )}
      {...props}
    />
  )
}

function SidebarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group"
      data-sidebar="group"
      className={cn("relative flex w-full min-w-0 flex-col p-2 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:p-1", className)}
      {...props}
    />
  )
}

type SidebarGroupLabelProps = useRender.ComponentProps<"div"> &
  React.ComponentPropsWithRef<"div">

const SidebarGroupLabelRoot = React.forwardRef<
  HTMLDivElement,
  SidebarGroupLabelProps
>(function SidebarGroupLabelRoot({ className, render, ...props }, ref) {
  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(
      {
        className: cn(
          "flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-sidebar-foreground/70 ring-sidebar-ring outline-hidden transition-[margin,opacity] duration-200 ease-linear group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0 focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
          className
        ),
        ref,
      },
      props
    ),
    render,
    state: {
      slot: "sidebar-group-label",
      sidebar: "group-label",
    },
  })
})

const SidebarGroupLabel = React.forwardRef<HTMLDivElement, SidebarGroupLabelProps>(
  function SidebarGroupLabel(props, ref) {
    return <SidebarGroupLabelRoot ref={ref} {...props} />
  }
)

type SidebarGroupActionProps = useRender.ComponentProps<"button"> &
  React.ComponentPropsWithRef<"button">

const SidebarGroupActionRoot = React.forwardRef<
  HTMLButtonElement,
  SidebarGroupActionProps
>(function SidebarGroupActionRoot({ className, render, ...props }, ref) {
  return useRender({
    defaultTagName: "button",
    props: mergeProps<"button">(
      {
        className: cn(
          "absolute top-3.5 right-3 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground ring-sidebar-ring outline-hidden transition-transform group-data-[collapsible=icon]:hidden after:absolute after:-inset-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 md:after:hidden [&>svg]:size-4 [&>svg]:shrink-0",
          className
        ),
        ref,
      },
      props
    ),
    render,
    state: {
      slot: "sidebar-group-action",
      sidebar: "group-action",
    },
  })
})

const SidebarGroupAction = React.forwardRef<HTMLButtonElement, SidebarGroupActionProps>(
  function SidebarGroupAction(props, ref) {
    return <SidebarGroupActionRoot ref={ref} {...props} />
  }
)

function SidebarGroupContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group-content"
      data-sidebar="group-content"
      className={cn("w-full text-sm", className)}
      {...props}
    />
  )
}

function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu"
      data-sidebar="menu"
      className={cn("flex w-full min-w-0 flex-col gap-0 group-data-[collapsible=icon]:items-center", className)}
      {...props}
    />
  )
}

function SidebarMenuItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="sidebar-menu-item"
      data-sidebar="menu-item"
      className={cn("group/menu-item relative", className)}
      {...props}
    />
  )
}

const sidebarMenuButtonVariants = cva(
  "peer/menu-button group/menu-button relative flex w-full items-center overflow-hidden rounded-md text-left ring-sidebar-ring outline-hidden transition-[width,height,padding] group-has-data-[sidebar=menu-action]/menu-item:pr-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0! group-data-[collapsed-size=sm]:size-[var(--ds-token-workbench-components-sidebar-collapsed-item-size-sm)]! group-data-[collapsed-size=sm]:p-1! group-data-[collapsed-size=sm]:[&>[data-slot=avatar]]:size-[var(--ds-token-workbench-components-sidebar-collapsed-item-size-sm)]! group-data-[collapsed-size=sm]:[&>[data-slot=icon]]:scale-75 group-data-[collapsed-size=md]:size-[var(--ds-token-workbench-components-sidebar-collapsed-item-size-md)]! group-data-[collapsed-size=md]:p-2! group-data-[collapsed-size=md]:[&>[data-slot=avatar]]:size-[var(--ds-token-workbench-components-sidebar-collapsed-item-size-md)]! group-data-[collapsed-size=lg]:size-[var(--ds-token-workbench-components-sidebar-collapsed-item-size-lg)]! group-data-[collapsed-size=lg]:p-2.5! group-data-[collapsed-size=lg]:[&>[data-slot=avatar]]:size-[var(--ds-token-workbench-components-sidebar-collapsed-item-size-lg)]! group-data-[collapsed-size=lg]:[&>[data-slot=icon]]:scale-110 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-open:hover:bg-sidebar-accent data-open:hover:text-sidebar-accent-foreground data-active:bg-sidebar-accent data-active:font-medium data-active:text-sidebar-accent-foreground [&_svg]:shrink-0 [&>[data-slot=avatar]]:transition-[width,height] [&>[data-slot=icon]]:transition-transform [&>span:last-child]:truncate",
  {
    variants: {
      variant: {
        default: "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        outline:
          "bg-background shadow-[0_0_0_1px_var(--sidebar-border)] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_var(--sidebar-accent)]",
        panel:
          "border border-sidebar-border/60 bg-sidebar-accent/40 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
      },
      collapsedSurface: {
        preserve: "",
        transparent:
          "group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:shadow-none",
      },
      size: {
        inherit: "",
        default: "h-[var(--ds-token-workbench-components-sidebar-item-height-md)] gap-[var(--ds-token-workbench-components-sidebar-item-gap-md)] px-[var(--ds-token-workbench-components-sidebar-item-padding-x-md)] text-[length:var(--ds-token-workbench-components-sidebar-item-font-size-md)] [&_svg]:size-[var(--ds-token-workbench-components-sidebar-item-icon-size-md)]",
        sm: "h-[var(--ds-token-workbench-components-sidebar-item-height-sm)] gap-[var(--ds-token-workbench-components-sidebar-item-gap-sm)] px-[var(--ds-token-workbench-components-sidebar-item-padding-x-sm)] text-[length:var(--ds-token-workbench-components-sidebar-item-font-size-sm)] [&_svg]:size-[var(--ds-token-workbench-components-sidebar-item-icon-size-sm)]",
        lg: "h-[var(--ds-token-workbench-components-sidebar-item-height-lg)] gap-[var(--ds-token-workbench-components-sidebar-item-gap-lg)] px-[var(--ds-token-workbench-components-sidebar-item-padding-x-lg)] text-[length:var(--ds-token-workbench-components-sidebar-item-font-size-lg)] [&_svg]:size-[var(--ds-token-workbench-components-sidebar-item-icon-size-lg)] group-data-[collapsed-size=sm]:p-0! group-data-[collapsed-size=md]:p-0! group-data-[collapsed-size=lg]:p-0!",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "inherit",
      collapsedSurface: "preserve",
    },
  }
)

type SidebarMenuButtonProps = useRender.ComponentProps<"button"> &
  React.ComponentPropsWithRef<"button"> & {
    isActive?: boolean
    tooltip?: string | React.ComponentProps<typeof TooltipContent>
  } & VariantProps<typeof sidebarMenuButtonVariants>

const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  SidebarMenuButtonProps
>(function SidebarMenuButton(
  {
    render,
    isActive = false,
    variant = "default",
    size = "inherit",
    collapsedSurface = "preserve",
    tooltip,
    className,
    ...props
  },
  ref
) {
  const { isMobile, state } = useSidebar()
  const sidebarSize = React.useContext(SidebarSizeContext)
  const resolvedSize = size === "inherit" ? (sidebarSize === "md" ? "default" : sidebarSize) : size
  const comp = useRender({
    defaultTagName: "button",
    props: mergeProps<"button">(
      {
        className: cn(sidebarMenuButtonVariants({ variant, size: resolvedSize, collapsedSurface }), className),
        ref,
      },
      props
    ),
    render: !tooltip ? render : <TooltipTrigger render={render} />,
    state: {
      slot: "sidebar-menu-button",
      sidebar: "menu-button",
      size: resolvedSize,
      active: isActive,
    },
  })

  if (!tooltip) {
    return comp
  }

  if (typeof tooltip === "string") {
    tooltip = {
      children: tooltip,
    }
  }

  return (
    <Tooltip>
      {comp}
      <TooltipContent
        side="right"
        align="center"
        hidden={state !== "collapsed" || isMobile}
        {...tooltip}
      />
    </Tooltip>
  )
})

function SidebarMenuButtonPersistent({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="sidebar-menu-button-persistent"
      data-sidebar="menu-button-persistent"
      className={cn(
        "flex shrink-0 items-center justify-center group-data-[collapsible=icon]:absolute group-data-[collapsible=icon]:inset-0 group-data-[collapsible=icon]:[&>[data-slot=avatar]]:size-full! group-data-[collapsed-size=sm]:[&>[data-slot=icon]]:scale-75 group-data-[collapsed-size=lg]:[&>[data-slot=icon]]:scale-110 [&>svg]:size-4 [&>[data-slot=icon]]:transition-transform",
        className
      )}
      {...props}
    />
  )
}

function SidebarMenuButtonContent({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="sidebar-menu-button-content"
      data-sidebar="menu-button-content"
      className={cn("min-w-0 flex-1 overflow-hidden group-data-[collapsible=icon]:hidden", className)}
      {...props}
    />
  )
}

type SidebarMenuActionProps = useRender.ComponentProps<"button"> &
  React.ComponentPropsWithRef<"button"> & {
    showOnHover?: boolean
  }

const SidebarMenuActionRoot = React.forwardRef<
  HTMLButtonElement,
  SidebarMenuActionProps
>(function SidebarMenuActionRoot(
  { className, render, showOnHover = false, ...props },
  ref
) {
  return useRender({
    defaultTagName: "button",
    props: mergeProps<"button">(
      {
        className: cn(
          "absolute top-1.5 right-1 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground ring-sidebar-ring outline-hidden transition-transform group-data-[collapsible=icon]:hidden peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[size=default]/menu-button:top-1.5 peer-data-[size=lg]/menu-button:top-2.5 peer-data-[size=sm]/menu-button:top-1 after:absolute after:-inset-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 md:after:hidden [&>svg]:size-4 [&>svg]:shrink-0",
          showOnHover &&
            "group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 peer-data-active/menu-button:text-sidebar-accent-foreground aria-expanded:opacity-100 md:opacity-0",
          className
        ),
        ref,
      },
      props
    ),
    render,
    state: {
      slot: "sidebar-menu-action",
      sidebar: "menu-action",
    },
  })
})

const SidebarMenuAction = React.forwardRef<HTMLButtonElement, SidebarMenuActionProps>(
  function SidebarMenuAction(props, ref) {
    return <SidebarMenuActionRoot ref={ref} {...props} />
  }
)

function SidebarMenuBadge({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-menu-badge"
      data-sidebar="menu-badge"
      className={cn(
        "pointer-events-none absolute right-1 flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-xs font-medium text-sidebar-foreground tabular-nums select-none group-data-[collapsible=icon]:hidden peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[size=default]/menu-button:top-1.5 peer-data-[size=lg]/menu-button:top-2.5 peer-data-[size=sm]/menu-button:top-1 peer-data-active/menu-button:text-sidebar-accent-foreground",
        className
      )}
      {...props}
    />
  )
}

function SidebarMenuSkeleton({
  className,
  showIcon = false,
  ...props
}: React.ComponentProps<"div"> & {
  showIcon?: boolean
}) {
  // Random width between 50 to 90%.
  const [width] = React.useState(() => {
    return `${Math.floor(Math.random() * 40) + 50}%`
  })

  return (
    <div
      data-slot="sidebar-menu-skeleton"
      data-sidebar="menu-skeleton"
      className={cn("flex h-8 items-center gap-2 rounded-md px-2", className)}
      {...props}
    >
      {showIcon && (
        <Skeleton
          className="size-4 rounded-md"
          data-sidebar="menu-skeleton-icon"
        />
      )}
      <Skeleton
        className="h-4 max-w-(--skeleton-width) flex-1"
        data-sidebar="menu-skeleton-text"
        style={
          {
            "--skeleton-width": width,
          } as React.CSSProperties
        }
      />
    </div>
  )
}

function SidebarMenuSub({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu-sub"
      data-sidebar="menu-sub"
      className={cn(
        "mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l border-sidebar-border px-2.5 py-0.5 group-data-[collapsible=icon]:hidden",
        className
      )}
      {...props}
    />
  )
}

function SidebarMenuSubItem({
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="sidebar-menu-sub-item"
      data-sidebar="menu-sub-item"
      className={cn("group/menu-sub-item relative", className)}
      {...props}
    />
  )
}

type SidebarMenuSubButtonProps = useRender.ComponentProps<"a"> &
  React.ComponentPropsWithRef<"a"> & {
    size?: "sm" | "md"
    isActive?: boolean
  }

const SidebarMenuSubButtonRoot = React.forwardRef<
  HTMLAnchorElement,
  SidebarMenuSubButtonProps
>(function SidebarMenuSubButtonRoot(
  { render, size = "md", isActive = false, className, ...props },
  ref
) {
  return useRender({
    defaultTagName: "a",
    props: mergeProps<"a">(
      {
        className: cn(
          "flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 text-sidebar-foreground ring-sidebar-ring outline-hidden group-data-[collapsible=icon]:hidden hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[size=md]:text-sm data-[size=sm]:text-xs data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-sidebar-accent-foreground",
          className
        ),
        ref,
      },
      props
    ),
    render,
    state: {
      slot: "sidebar-menu-sub-button",
      sidebar: "menu-sub-button",
      size,
      active: isActive,
    },
  })
})

const SidebarMenuSubButton = React.forwardRef<HTMLAnchorElement, SidebarMenuSubButtonProps>(
  function SidebarMenuSubButton(props, ref) {
    return <SidebarMenuSubButtonRoot ref={ref} {...props} />
  }
)

export {
  Sidebar,
  SidebarBrand,
  SidebarBrandContent,
  SidebarBrandImage,
  SidebarBrandMark,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuButtonContent,
  SidebarMenuButtonPersistent,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  SidebarTriggerCollapsedIcon,
  SidebarTriggerExpandedIcon,
  useSidebar,
}
