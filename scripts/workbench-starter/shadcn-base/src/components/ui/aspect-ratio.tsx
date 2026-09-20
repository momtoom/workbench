type AspectRatioValue = number | string

const DEFAULT_ASPECT_RATIO = "16 / 9"

function normalizeAspectRatio(value: AspectRatioValue | undefined) {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? String(value) : DEFAULT_ASPECT_RATIO
  }

  const ratio = value?.trim().replace(/\s*\/\s*/g, " / ")
  if (!ratio) return DEFAULT_ASPECT_RATIO
  if (/^\d*\.?\d+(?:\s+\/\s+\d*\.?\d+)?$/.test(ratio)) return ratio
  return DEFAULT_ASPECT_RATIO
}

function AspectRatio({
  ratio,
  style,
  ...props
}: React.ComponentProps<"div"> & { ratio?: AspectRatioValue }) {
  const resolvedRatio = normalizeAspectRatio(ratio)

  return (
    <div
      data-slot="aspect-ratio"
      style={
        {
          width: "100%",
          ...style,
          aspectRatio: resolvedRatio,
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { AspectRatio }
