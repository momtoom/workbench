import * as React from "react"
import { RiArrowDownLine } from "@remixicon/react"
import {
  MessageScroller as MessageScrollerPrimitive,
  useMessageScroller,
  useMessageScrollerScrollable,
  useMessageScrollerVisibility,
} from "@shadcn/react/message-scroller"

import "./message-scroller.css"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type MessageScrollerButtonDirection = "start" | "end"
type MessageScrollerItemAnimation =
  | "none"
  | "fade"
  | "slide-up"
  | "slide-side"
  | "pop"
  | "spring-bounce"
  | "blur-fade"
  | "scale-fade"

type MessageScrollerScrollState = {
  start: boolean
  end: boolean
}

type MessageScrollerNativeScrollContextValue = {
  scrollable: MessageScrollerScrollState
  setViewportElement: (element: HTMLDivElement | null) => void
  syncScrollState: (element?: HTMLDivElement | null) => void
}

const DEFAULT_SCROLL_EDGE_THRESHOLD = 8
const MessageScrollerNativeScrollContext =
  React.createContext<MessageScrollerNativeScrollContextValue | null>(null)

type MessageScrollerProviderProps = React.ComponentProps<
  typeof MessageScrollerPrimitive.Provider
>

type MessageScrollerProps = React.ComponentProps<
  typeof MessageScrollerPrimitive.Root
> &
  Pick<
    MessageScrollerProviderProps,
    | "autoScroll"
    | "defaultScrollPosition"
    | "scrollEdgeThreshold"
    | "scrollMargin"
    | "scrollPreviousItemPeek"
  >

type MessageScrollerButtonProps = Omit<
  React.ComponentProps<typeof Button>,
  "onClick"
> & {
  behavior?: ScrollBehavior
  direction?: MessageScrollerButtonDirection
  onClick?: React.MouseEventHandler<HTMLButtonElement>
}

type MessageScrollerItemProps = React.ComponentProps<
  typeof MessageScrollerPrimitive.Item
> & {
  animation?: MessageScrollerItemAnimation
}

function MessageScrollerProvider(props: MessageScrollerProviderProps) {
  return <MessageScrollerPrimitive.Provider {...props} />
}

function MessageScroller({
  autoScroll,
  children,
  className,
  defaultScrollPosition,
  scrollEdgeThreshold,
  scrollMargin,
  scrollPreviousItemPeek,
  ...props
}: MessageScrollerProps) {
  const [viewportElement, setViewportElement] =
    React.useState<HTMLDivElement | null>(null)
  const [scrollable, setScrollable] = React.useState<MessageScrollerScrollState>({
    start: false,
    end: false,
  })
  const edgeThreshold = scrollEdgeThreshold ?? DEFAULT_SCROLL_EDGE_THRESHOLD
  const syncScrollState = React.useCallback(
    (element: HTMLDivElement | null = viewportElement) => {
      if (!element) return
      const next = {
        start: element.scrollTop > edgeThreshold,
        end:
          element.scrollHeight - element.scrollTop - element.clientHeight >
          edgeThreshold,
      }
      setScrollable((current) =>
        current.start === next.start && current.end === next.end
          ? current
          : next
      )
    },
    [edgeThreshold, viewportElement]
  )

  React.useLayoutEffect(() => {
    if (!viewportElement) return
    const ownerWindow = viewportElement.ownerDocument.defaultView
    const content = viewportElement.querySelector<HTMLElement>(
      '[data-slot="message-scroller-content"]'
    )
    const resizeObserver = ownerWindow?.ResizeObserver
      ? new ownerWindow.ResizeObserver(() => syncScrollState(viewportElement))
      : null

    resizeObserver?.observe(viewportElement)
    if (content) resizeObserver?.observe(content)
    syncScrollState(viewportElement)

    return () => resizeObserver?.disconnect()
  }, [syncScrollState, viewportElement])

  const nativeScrollContext = React.useMemo(
    () => ({ scrollable, setViewportElement, syncScrollState }),
    [scrollable, syncScrollState]
  )

  return (
    <MessageScrollerProvider
      autoScroll={autoScroll}
      defaultScrollPosition={defaultScrollPosition}
      scrollEdgeThreshold={scrollEdgeThreshold}
      scrollMargin={scrollMargin}
      scrollPreviousItemPeek={scrollPreviousItemPeek}
    >
      <MessageScrollerNativeScrollContext.Provider
        value={nativeScrollContext}
      >
        <MessageScrollerPrimitive.Root
          data-slot="message-scroller"
          className={cn(
            "group/message-scroller relative flex size-full min-h-0 flex-col overflow-hidden",
            className
          )}
          {...props}
        >
          {children}
        </MessageScrollerPrimitive.Root>
      </MessageScrollerNativeScrollContext.Provider>
    </MessageScrollerProvider>
  )
}

function MessageScrollerViewport({
  className,
  onScroll,
  ref,
  ...props
}: React.ComponentProps<typeof MessageScrollerPrimitive.Viewport>) {
  const nativeScrollContext = React.useContext(MessageScrollerNativeScrollContext)
  const setNativeViewportElement = nativeScrollContext?.setViewportElement
  const syncNativeScrollState = nativeScrollContext?.syncScrollState
  const setViewportRef = React.useCallback(
    (element: HTMLDivElement | null) => {
      setNativeViewportElement?.(element)
      if (typeof ref === "function") ref(element)
      else if (ref) ref.current = element
    },
    [ref, setNativeViewportElement]
  )

  return (
    <MessageScrollerPrimitive.Viewport
      ref={setViewportRef}
      data-slot="message-scroller-viewport"
      className={cn(
        "size-full min-h-0 min-w-0 overflow-y-auto overscroll-contain no-scrollbar",
        className
      )}
      onScroll={(event) => {
        syncNativeScrollState?.(event.currentTarget)
        onScroll?.(event)
      }}
      {...props}
    />
  )
}

function MessageScrollerContent({
  className,
  ...props
}: React.ComponentProps<typeof MessageScrollerPrimitive.Content>) {
  return (
    <MessageScrollerPrimitive.Content
      data-slot="message-scroller-content"
      className={cn("flex h-max min-h-full flex-col gap-8", className)}
      {...props}
    />
  )
}

function MessageScrollerItem({
  animation = "none",
  className,
  ...props
}: MessageScrollerItemProps) {
  return (
    <MessageScrollerPrimitive.Item
      data-slot="message-scroller-item"
      data-animation={animation === "none" ? undefined : animation}
      className={cn("min-w-0 shrink-0", className)}
      {...props}
    />
  )
}

function MessageScrollerButton({
  behavior,
  children,
  className,
  direction = "end",
  onClick,
  size = "icon-sm",
  tabIndex,
  type = "button",
  variant = "secondary",
  ...props
}: MessageScrollerButtonProps) {
  const nativeScrollContext = React.useContext(MessageScrollerNativeScrollContext)
  const { scrollToEnd, scrollToStart } = useMessageScroller()
  const active = nativeScrollContext
    ? nativeScrollContext.scrollable[direction]
    : false
  const buttonClassName = cn(
    "absolute z-20 inset-s-1/2 -translate-x-1/2 rounded-full border-border bg-background text-foreground shadow-sm transition-[translate,scale,opacity] duration-200 hover:bg-muted hover:text-foreground dark:bg-background data-[active=false]:pointer-events-none data-[active=false]:scale-95 data-[active=false]:opacity-0 data-[active=true]:translate-y-0 data-[active=true]:scale-100 data-[active=true]:opacity-100 data-[direction=end]:bottom-4 data-[direction=end]:data-[active=false]:translate-y-full data-[direction=start]:top-4 data-[direction=start]:data-[active=false]:-translate-y-full rtl:translate-x-1/2 data-[direction=start]:[&_svg]:rotate-180",
    className
  )
  const buttonChildren = children ?? (
    <>
      <RiArrowDownLine />
      <span className="sr-only">
        {direction === "end" ? "Scroll to end" : "Scroll to start"}
      </span>
    </>
  )

  if (nativeScrollContext) {
    return (
      <Button
        {...props}
        data-slot="message-scroller-button"
        data-active={active ? "true" : "false"}
        data-direction={direction}
        data-size={size}
        data-variant={variant}
        inert={!active}
        tabIndex={active ? tabIndex : -1}
        type={type}
        size={size}
        variant={variant}
        className={buttonClassName}
        onClick={(event) => {
          if (!active) return
          onClick?.(event)
          if (event.defaultPrevented) return
          event.currentTarget.blur()
          if (direction === "start") scrollToStart({ behavior })
          else scrollToEnd({ behavior })
        }}
      >
        {buttonChildren}
      </Button>
    )
  }

  return (
    <MessageScrollerPrimitive.Button
      behavior={behavior}
      direction={direction}
      onClick={onClick}
      render={
        <Button
          data-slot="message-scroller-button"
          data-size={size}
          data-variant={variant}
          size={size}
          variant={variant}
          tabIndex={tabIndex}
          type={type}
          className={buttonClassName}
          {...props}
        >
          {buttonChildren}
        </Button>
      }
    />
  )
}

export {
  MessageScrollerProvider,
  MessageScroller,
  MessageScrollerViewport,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerButton,
  useMessageScroller,
  useMessageScrollerScrollable,
  useMessageScrollerVisibility,
}
