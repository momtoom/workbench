import { Slider as SliderPrimitive } from "@base-ui/react/slider"

import { cn } from "@/lib/utils"

type SliderValueInput = SliderPrimitive.Root.Props["defaultValue"] | number | string

type SliderProps = Omit<SliderPrimitive.Root.Props, "defaultValue" | "value"> & {
  defaultValue?: SliderValueInput
  value?: SliderValueInput
}

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  ...props
}: SliderProps) {
  const normalizedDefaultValue = normalizeSliderValue(defaultValue)
  const normalizedValue = normalizeSliderValue(value)
  const values = normalizedValue ?? normalizedDefaultValue ?? [min]

  return (
    <SliderPrimitive.Root
      className={cn("data-horizontal:w-full data-vertical:h-full", className)}
      data-slot="slider"
      {...(normalizedValue === undefined
        ? { defaultValue: normalizedDefaultValue }
        : { value: normalizedValue })}
      min={min}
      max={max}
      thumbAlignment="edge"
      {...props}
    >
      <SliderPrimitive.Control className="relative flex w-full touch-none items-center select-none data-disabled:opacity-50 data-vertical:h-full data-vertical:min-h-40 data-vertical:w-auto data-vertical:flex-col">
        <SliderPrimitive.Track
          data-slot="slider-track"
          className="relative grow overflow-hidden rounded-full bg-muted select-none data-horizontal:h-1 data-horizontal:w-full data-vertical:h-full data-vertical:w-1"
        >
          <SliderPrimitive.Indicator
            data-slot="slider-range"
            className="bg-primary select-none data-horizontal:h-full data-vertical:w-full"
          />
        </SliderPrimitive.Track>
        {Array.from({ length: Math.max(1, values.length) }, (_, index) => (
          <SliderPrimitive.Thumb
            data-slot="slider-thumb"
            key={index}
            className="relative block size-3 shrink-0 rounded-full border border-ring bg-background ring-ring/50 transition-[color,box-shadow] select-none after:absolute after:-inset-2 hover:ring-3 focus-visible:ring-3 focus-visible:outline-hidden active:ring-3 disabled:pointer-events-none disabled:opacity-50"
          />
        ))}
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  )
}

function normalizeSliderValue(value: SliderValueInput | undefined): number[] | undefined {
  if (Array.isArray(value)) {
    return value.filter((item): item is number => typeof item === "number" && Number.isFinite(item))
  }
  if (typeof value === "number") return Number.isFinite(value) ? [value] : undefined
  if (typeof value !== "string") return undefined

  const normalized = value.trim().replace(/^\[/, "").replace(/\]$/, "")
  if (!normalized) return []
  const values = normalized
    .split(",")
    .map((item) => Number(item.trim().replace(/^['"]|['"]$/g, "")))
    .filter(Number.isFinite)
  return values.length > 0 ? values : undefined
}

export { Slider }
