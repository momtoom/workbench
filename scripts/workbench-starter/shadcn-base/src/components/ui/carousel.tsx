import * as React from "react"
import useEmblaCarousel, {
  type UseEmblaCarouselType,
} from "embla-carousel-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { isWorkbenchElementOfType } from "@/components/ui/workbench-runtime"
import { RiArrowLeftSLine, RiArrowRightSLine } from "@remixicon/react"

type CarouselApi = UseEmblaCarouselType[1]
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>
type CarouselOptions = UseCarouselParameters[0]
type CarouselPlugin = UseCarouselParameters[1]
type CarouselControlPosition = "inside" | "outside"
type CarouselControlSize = Extract<
  NonNullable<React.ComponentProps<typeof Button>["size"]>,
  "icon" | "icon-xs" | "icon-sm" | "icon-lg"
>
type CarouselControlVariant = NonNullable<React.ComponentProps<typeof Button>["variant"]>
type CarouselControlShape = NonNullable<React.ComponentProps<typeof Button>["shape"]>
type CarouselControlTone = "default" | "diff"
type CarouselRadius = "none" | "default" | "sm" | "md" | "lg" | "xl" | "full"

const DEFAULT_CAROUSEL_CONTROL_OFFSET = "3rem"
const DEFAULT_CAROUSEL_CONTROL_POSITION: CarouselControlPosition = "outside"
const DEFAULT_CAROUSEL_CONTROL_SHAPE: CarouselControlShape = "pill"
const DEFAULT_CAROUSEL_CONTROL_SIZE: CarouselControlSize = "icon-sm"
const DEFAULT_CAROUSEL_CONTROL_TONE: CarouselControlTone = "default"
const DEFAULT_CAROUSEL_CONTROL_VARIANT: CarouselControlVariant = "outline"

type CarouselProps = {
  align?: "start" | "center" | "end"
  controlOffset?: string
  controlPosition?: CarouselControlPosition
  controlShape?: CarouselControlShape
  controlSize?: CarouselControlSize
  controlTone?: CarouselControlTone
  controlVariant?: CarouselControlVariant
  itemsPerView?: number
  layoutHeight?: string
  layoutWidth?: string
  loop?: boolean
  opts?: CarouselOptions
  paddingX?: string
  paddingY?: string
  plugins?: CarouselPlugin
  orientation?: "horizontal" | "vertical"
  radius?: CarouselRadius
  setApi?: (api: CarouselApi) => void
  showControls?: boolean
  verticalPaddingX?: string
  verticalPaddingY?: string
}

type CarouselContextProps = {
  carouselRef: ReturnType<typeof useEmblaCarousel>[0]
  api: ReturnType<typeof useEmblaCarousel>[1]
  scrollPrev: () => void
  scrollNext: () => void
  canScrollPrev: boolean
  canScrollNext: boolean
} & CarouselProps

const CarouselContext = React.createContext<CarouselContextProps | null>(null)

function useCarousel() {
  const context = React.useContext(CarouselContext)

  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />")
  }

  return context
}

function Carousel({
  align,
  controlOffset = DEFAULT_CAROUSEL_CONTROL_OFFSET,
  controlPosition = DEFAULT_CAROUSEL_CONTROL_POSITION,
  controlShape = DEFAULT_CAROUSEL_CONTROL_SHAPE,
  controlSize = DEFAULT_CAROUSEL_CONTROL_SIZE,
  controlTone = DEFAULT_CAROUSEL_CONTROL_TONE,
  controlVariant = DEFAULT_CAROUSEL_CONTROL_VARIANT,
  itemsPerView,
  layoutHeight,
  layoutWidth,
  orientation = "horizontal",
  loop,
  opts,
  paddingX,
  paddingY,
  radius,
  setApi,
  showControls = true,
  plugins,
  className,
  children,
  style,
  verticalPaddingX,
  verticalPaddingY,
  ...props
}: React.ComponentProps<"div"> & CarouselProps) {
  const resolvedOpts = {
    ...opts,
    ...(align ? { align } : {}),
    ...(typeof loop === "boolean" ? { loop } : {}),
    axis: orientation === "horizontal" ? "x" : "y",
  } satisfies CarouselOptions

  const [carouselRef, api] = useEmblaCarousel(
    resolvedOpts,
    plugins
  )
  const [canScrollPrev, setCanScrollPrev] = React.useState(false)
  const [canScrollNext, setCanScrollNext] = React.useState(false)
  const childArray = React.Children.toArray(children).filter(isMeaningfulCarouselChild)
  const slideChildren = childArray.filter(isCarouselSlideElement)
  const useSlideMode =
    slideChildren.length > 0 && slideChildren.length === childArray.length

  const onSelect = React.useCallback((api: CarouselApi) => {
    if (!api) return
    setCanScrollPrev(api.canScrollPrev())
    setCanScrollNext(api.canScrollNext())
  }, [])

  const scrollPrev = React.useCallback(() => {
    api?.scrollPrev()
  }, [api])

  const scrollNext = React.useCallback(() => {
    api?.scrollNext()
  }, [api])

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (orientation === "horizontal" && event.key === "ArrowLeft") {
        event.preventDefault()
        scrollPrev()
      } else if (orientation === "horizontal" && event.key === "ArrowRight") {
        event.preventDefault()
        scrollNext()
      } else if (orientation === "vertical" && event.key === "ArrowUp") {
        event.preventDefault()
        scrollPrev()
      } else if (orientation === "vertical" && event.key === "ArrowDown") {
        event.preventDefault()
        scrollNext()
      }
    },
    [orientation, scrollPrev, scrollNext]
  )

  React.useEffect(() => {
    if (!api || !setApi) return
    setApi(api)
  }, [api, setApi])

  React.useEffect(() => {
    if (!api) return
    onSelect(api)
    api.on("reInit", onSelect)
    api.on("select", onSelect)

    return () => {
      api?.off("reInit", onSelect)
      api?.off("select", onSelect)
    }
  }, [api, onSelect])

  React.useEffect(() => {
    if (!api) return

    api.reInit()
  }, [api, children, layoutHeight, layoutWidth, orientation])

  React.useEffect(() => {
    if (!api) return

    const rootNode = api.rootNode()
    const images = Array.from(rootNode.querySelectorAll("img"))
    if (images.length === 0) return

    const reInit = () => api.reInit()

    images.forEach((image) => {
      if (image.complete) return
      image.addEventListener("load", reInit)
      image.addEventListener("error", reInit)
    })

    return () => {
      images.forEach((image) => {
        image.removeEventListener("load", reInit)
        image.removeEventListener("error", reInit)
      })
    }
  }, [api, children])

  const layoutStyle = getCarouselLayoutStyle(style, {
    layoutHeight,
    layoutWidth,
    paddingX,
    paddingY,
    verticalPaddingX,
    verticalPaddingY,
  }, radius)

  return (
    <CarouselContext.Provider
      value={{
        carouselRef,
        api: api,
        opts: resolvedOpts,
        orientation:
          orientation || (resolvedOpts.axis === "y" ? "vertical" : "horizontal"),
        scrollPrev,
        scrollNext,
        canScrollPrev,
        canScrollNext,
        showControls,
        controlOffset,
        controlPosition,
        controlShape,
        controlSize,
        controlTone,
        controlVariant,
        itemsPerView,
        radius,
      }}
    >
      <div
        onKeyDownCapture={handleKeyDown}
        className={cn(
          "relative",
          layoutWidth && "w-[var(--carousel-layout-width)]",
          layoutHeight && "data-[orientation=vertical]:h-[var(--carousel-layout-height)]",
          paddingX && "px-[var(--carousel-padding-x)]",
          paddingY && "py-[var(--carousel-padding-y)]",
          verticalPaddingX && "data-[orientation=vertical]:px-[var(--carousel-vertical-padding-x)]",
          verticalPaddingY && "data-[orientation=vertical]:py-[var(--carousel-vertical-padding-y)]",
          getCarouselRadiusClassName(radius),
          className
        )}
        style={layoutStyle}
        role="region"
        aria-roledescription="carousel"
        data-orientation={orientation}
        data-slot="carousel"
        {...props}
      >
        {useSlideMode ? (
          <>
            <CarouselContent>{children}</CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </>
        ) : children}
      </div>
    </CarouselContext.Provider>
  )
}

type CarouselLayoutStyle = React.CSSProperties & {
  "--carousel-layout-height"?: string
  "--carousel-layout-width"?: string
  "--carousel-padding-x"?: string
  "--carousel-padding-y"?: string
  "--carousel-vertical-padding-x"?: string
  "--carousel-vertical-padding-y"?: string
}

function getCarouselLayoutStyle(
  style: React.CSSProperties | undefined,
  layout: Pick<
    CarouselProps,
    | "layoutHeight"
    | "layoutWidth"
    | "paddingX"
    | "paddingY"
    | "verticalPaddingX"
    | "verticalPaddingY"
  >,
  radius: CarouselRadius | undefined
): React.CSSProperties | undefined {
  const layoutStyle: CarouselLayoutStyle = { ...style }
  if (layout.layoutHeight) layoutStyle["--carousel-layout-height"] = layout.layoutHeight
  if (layout.layoutWidth) layoutStyle["--carousel-layout-width"] = layout.layoutWidth
  if (layout.paddingX) layoutStyle["--carousel-padding-x"] = layout.paddingX
  if (layout.paddingY) layoutStyle["--carousel-padding-y"] = layout.paddingY
  if (layout.verticalPaddingX) layoutStyle["--carousel-vertical-padding-x"] = layout.verticalPaddingX
  if (layout.verticalPaddingY) layoutStyle["--carousel-vertical-padding-y"] = layout.verticalPaddingY
  Object.assign(layoutStyle, getCarouselRadiusStyle(radius, false))

  return Object.keys(layoutStyle).length > 0 ? layoutStyle : undefined
}

function CarouselContent({ className, style, ...props }: React.ComponentProps<"div">) {
  const { carouselRef, orientation, radius } = useCarousel()

  return (
    <div
      ref={carouselRef}
      className={cn(
        "overflow-hidden",
        orientation === "vertical" && "h-full",
        getCarouselRadiusClassName(radius),
        className
      )}
      data-slot="carousel-content"
      style={mergeCarouselStyles(style, getCarouselRadiusStyle(radius, true))}
    >
      <div
        className={cn(
          "flex h-full",
          orientation === "horizontal" ? "-ml-4" : "flex-col",
        )}
        {...props}
      />
    </div>
  )
}

function CarouselItem({ className, style, ...props }: React.ComponentProps<"div">) {
  const { orientation, itemsPerView } = useCarousel()
  const itemBasis = formatCarouselItemBasis(itemsPerView)

  return (
    <div
      role="group"
      aria-roledescription="slide"
      data-slot="carousel-item"
      className={cn(
        "min-w-0 shrink-0 grow-0 basis-full",
        orientation === "horizontal" ? "pl-4" : "py-2",
        className
      )}
      style={itemBasis ? { flexBasis: itemBasis, ...style } : style}
      {...props}
    />
  )
}

type CarouselSlideProps = React.ComponentProps<typeof CarouselItem> & {
  contentClassName?: string
  frame?: boolean
}

function CarouselSlide({
  children,
  className,
  contentClassName,
  frame = false,
  ...props
}: CarouselSlideProps) {
  const shouldFrameContent = frame || Boolean(contentClassName)

  return (
    <CarouselItem className={className} {...props}>
      {shouldFrameContent ? (
        <div
          className={cn(
            "flex h-40 items-center justify-center rounded-lg border bg-muted text-lg font-medium",
            contentClassName
          )}
        >
          {children}
        </div>
      ) : children}
    </CarouselItem>
  )
}

function isCarouselSlideElement(child: React.ReactNode): child is React.ReactElement<CarouselSlideProps> {
  return isWorkbenchElementOfType(child, CarouselSlide, "CarouselSlide")
}

function isMeaningfulCarouselChild(child: React.ReactNode): boolean {
  return !(typeof child === "string" && child.trim() === "")
}

function formatCarouselItemBasis(itemsPerView: number | undefined): string | null {
  if (typeof itemsPerView !== "number" || !Number.isFinite(itemsPerView)) return null
  if (itemsPerView <= 0) return null
  return `${100 / itemsPerView}%`
}

function getCarouselRadiusClassName(radius: CarouselRadius | undefined): string | null {
  switch (radius) {
    case "default":
      return "rounded-[var(--ds-token-workbench-components-carousel-radius)]"
    case "sm":
      return "rounded-sm"
    case "md":
      return "rounded-md"
    case "lg":
      return "rounded-lg"
    case "xl":
      return "rounded-xl"
    case "full":
      return "rounded-full"
    case "none":
    default:
      return null
  }
}

function getCarouselRadiusValue(radius: CarouselRadius | undefined): React.CSSProperties["borderRadius"] | null {
  switch (radius) {
    case "default":
      return "var(--ds-token-workbench-components-carousel-radius)"
    case "sm":
      return "var(--radius-sm)"
    case "md":
      return "var(--radius-md)"
    case "lg":
      return "var(--radius-lg)"
    case "xl":
      return "var(--radius-xl)"
    case "full":
      return "var(--radius-full)"
    case "none":
      return 0
    default:
      return null
  }
}

function getCarouselRadiusStyle(
  radius: CarouselRadius | undefined,
  clip: boolean
): React.CSSProperties | undefined {
  const borderRadius = getCarouselRadiusValue(radius)
  if (borderRadius === null) return undefined

  return {
    borderRadius,
    ...(clip && borderRadius !== 0 ? { clipPath: `inset(0 round ${borderRadius})` } : {}),
  }
}

function mergeCarouselStyles(
  ...styles: Array<React.CSSProperties | undefined>
): React.CSSProperties | undefined {
  const mergedStyle = Object.assign({}, ...styles.filter(Boolean))
  return Object.keys(mergedStyle).length > 0 ? mergedStyle : undefined
}

type CarouselControlDirection = "next" | "previous"

function getCarouselControlButtonStyle({
  controlOffset,
  controlPosition,
  controlTone,
  direction,
  orientation,
  style,
}: {
  controlOffset: string | undefined
  controlPosition: CarouselControlPosition | undefined
  controlTone: CarouselControlTone | undefined
  direction: CarouselControlDirection
  orientation: CarouselProps["orientation"]
  style: React.CSSProperties | undefined
}): React.CSSProperties {
  const offset = controlOffset?.trim() || DEFAULT_CAROUSEL_CONTROL_OFFSET
  const inset = controlPosition === "inside" ? offset : `calc(-1 * ${offset})`
  const positionStyle =
    orientation === "horizontal"
      ? direction === "previous"
        ? { left: inset }
        : { right: inset }
      : direction === "previous"
        ? { top: inset }
        : { bottom: inset }

  return {
    ...positionStyle,
    ...(controlTone === "default"
      ? {
          borderColor:
            "var(--ds-token-workbench-components-carousel-control-border)",
        }
      : {}),
    ...style,
  }
}

function getCarouselControlToneClassName(tone: CarouselControlTone | undefined): string | null {
  if (tone !== "diff") return null

  return "border-transparent bg-[var(--ds-token-workbench-components-carousel-control-diff-background)] text-[var(--ds-token-workbench-components-carousel-control-diff-foreground)] shadow-sm hover:bg-[var(--ds-token-workbench-components-carousel-control-diff-hover-background)] dark:hover:bg-[var(--ds-token-workbench-components-carousel-control-diff-hover-background)]"
}

function CarouselPrevious({
  className,
  shape,
  style,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof Button>) {
  const {
    controlOffset,
    controlPosition,
    controlShape,
    controlSize,
    controlTone,
    controlVariant,
    orientation,
    scrollPrev,
    canScrollPrev,
    showControls,
  } = useCarousel()

  if (!showControls) return null

  return (
    <Button
      data-slot="carousel-previous"
      data-control-tone={controlTone}
      data-orientation={orientation}
      variant={variant ?? controlVariant ?? DEFAULT_CAROUSEL_CONTROL_VARIANT}
      shape={shape ?? controlShape ?? DEFAULT_CAROUSEL_CONTROL_SHAPE}
      size={size ?? controlSize ?? DEFAULT_CAROUSEL_CONTROL_SIZE}
      className={cn(
        "absolute touch-manipulation",
        orientation === "horizontal"
          ? "top-1/2 [transform:translateY(-50%)]"
          : "left-1/2 -translate-x-1/2 rotate-90",
        getCarouselControlToneClassName(controlTone),
        className
      )}
      disabled={!canScrollPrev}
      onClick={scrollPrev}
      style={typeof style === "function"
        ? (state) => getCarouselControlButtonStyle({
            controlOffset,
            controlPosition,
            controlTone,
            direction: "previous",
            orientation,
            style: style(state),
          })
        : getCarouselControlButtonStyle({
            controlOffset,
          controlPosition,
          controlTone,
            direction: "previous",
            orientation,
            style,
          })}
      {...props}
    >
      <RiArrowLeftSLine />
      <span className="sr-only">Previous slide</span>
    </Button>
  )
}

function CarouselNext({
  className,
  shape,
  style,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof Button>) {
  const {
    controlOffset,
    controlPosition,
    controlShape,
    controlSize,
    controlTone,
    controlVariant,
    orientation,
    scrollNext,
    canScrollNext,
    showControls,
  } = useCarousel()

  if (!showControls) return null

  return (
    <Button
      data-slot="carousel-next"
      data-control-tone={controlTone}
      data-orientation={orientation}
      variant={variant ?? controlVariant ?? DEFAULT_CAROUSEL_CONTROL_VARIANT}
      shape={shape ?? controlShape ?? DEFAULT_CAROUSEL_CONTROL_SHAPE}
      size={size ?? controlSize ?? DEFAULT_CAROUSEL_CONTROL_SIZE}
      className={cn(
        "absolute touch-manipulation",
        orientation === "horizontal"
          ? "top-1/2 [transform:translateY(-50%)]"
          : "left-1/2 -translate-x-1/2 rotate-90",
        getCarouselControlToneClassName(controlTone),
        className
      )}
      disabled={!canScrollNext}
      onClick={scrollNext}
      style={typeof style === "function"
        ? (state) => getCarouselControlButtonStyle({
            controlOffset,
            controlPosition,
            controlTone,
            direction: "next",
            orientation,
            style: style(state),
          })
        : getCarouselControlButtonStyle({
            controlOffset,
          controlPosition,
          controlTone,
            direction: "next",
            orientation,
            style,
          })}
      {...props}
    >
      <RiArrowRightSLine />
      <span className="sr-only">Next slide</span>
    </Button>
  )
}

export {
  type CarouselApi,
  type CarouselControlPosition,
  type CarouselControlShape,
  type CarouselControlSize,
  type CarouselControlTone,
  type CarouselControlVariant,
  type CarouselRadius,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselSlide,
  CarouselPrevious,
  CarouselNext,
  useCarousel,
}
