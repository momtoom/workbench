import { useEffect, useMemo, useState } from "react"
import type { CSSProperties } from "react"

export type IconProps = {
  className?: string
  color?: string
  decorative?: boolean
  name?: string
  nonScalingStroke?: boolean
  position?: "inline-start" | "inline-end" | "none"
  size?: number | string
  strokeWidth?: number | string
  style?: CSSProperties
  title?: string
}

type WorkbenchIconRuntimeGlobal = typeof globalThis & {
  __WORKBENCH_DEFAULT_ICON_SOURCES__?: Record<string, string>
}

const iconSvgCache = new Map<string, string | null>()
const DEFAULT_ICON_SIZE = 16
const DEFAULT_ICON_STROKE_WIDTH = "2"

function Icon({
  className = "",
  color,
  decorative = true,
  name = "circle-user",
  nonScalingStroke = false,
  position = "inline-start",
  size = DEFAULT_ICON_SIZE,
  strokeWidth,
  style,
  title,
}: IconProps) {
  const iconSource = resolveWorkbenchIconSource(name)
  const normalizedStrokeWidth = normalizeStrokeWidth(strokeWidth)
  const needsInlineSvg = nonScalingStroke || (
    normalizedStrokeWidth !== null && normalizedStrokeWidth !== DEFAULT_ICON_STROKE_WIDTH
  )
  const svgText = useWorkbenchIconSvg(needsInlineSvg ? iconSource : null)
  const svgMarkup = useMemo(
    () => sanitizeWorkbenchIconSvg(svgText, { nonScalingStroke, strokeWidth }),
    [nonScalingStroke, strokeWidth, svgText],
  )
  const resolvedSize = normalizeIconSize(size, DEFAULT_ICON_SIZE)
  const dataIcon = position && position !== "none" ? position : undefined
  const label = title?.trim() || normalizeIconName(name)
  const iconStyle = {
    display: "inline-block",
    flex: "0 0 auto",
    inlineSize: resolvedSize,
    blockSize: resolvedSize,
    lineHeight: 0,
    margin: 0,
    pointerEvents: "none",
    verticalAlign: "-0.125em",
    color: color?.trim() || undefined,
  } satisfies CSSProperties
  const maskStyle = iconSource && !svgMarkup ? {
    backgroundColor: "currentColor",
    WebkitMaskImage: toCssUrl(iconSource),
    WebkitMaskPosition: "center",
    WebkitMaskRepeat: "no-repeat",
    WebkitMaskSize: "contain",
    maskImage: toCssUrl(iconSource),
    maskPosition: "center",
    maskRepeat: "no-repeat",
    maskSize: "contain",
  } satisfies CSSProperties : undefined

  if (!iconSource) {
    return (
      <span
        aria-hidden={decorative ? true : undefined}
        aria-label={decorative ? undefined : label}
        className={["wb-icon", "wb-icon--missing", className].filter(Boolean).join(" ")}
        data-icon={dataIcon}
        data-slot="icon"
        role={decorative ? undefined : "img"}
        style={{ ...iconStyle, ...style }}
      />
    )
  }

  return (
    <span
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : label}
      className={["wb-icon", className].filter(Boolean).join(" ")}
      data-icon={dataIcon}
      data-slot="icon"
      dangerouslySetInnerHTML={svgMarkup ? { __html: svgMarkup } : undefined}
      role={decorative ? undefined : "img"}
      style={{ ...iconStyle, ...maskStyle, ...style }}
    />
  )
}

function useWorkbenchIconSvg(iconSource: string | null): string | null {
  const [svgText, setSvgText] = useState(() => iconSource ? iconSvgCache.get(iconSource) ?? null : null)

  useEffect(() => {
    if (!iconSource) {
      setSvgText(null)
      return
    }

    const cachedMarkup = iconSvgCache.get(iconSource)
    if (cachedMarkup !== undefined) {
      setSvgText(cachedMarkup)
      return
    }

    let cancelled = false
    fetch(iconSource)
      .then((response) => response.ok ? response.text() : null)
      .then((svg) => {
        iconSvgCache.set(iconSource, svg)
        if (!cancelled) setSvgText(svg)
      })
      .catch(() => {
        iconSvgCache.set(iconSource, null)
        if (!cancelled) setSvgText(null)
      })

    return () => {
      cancelled = true
    }
  }, [iconSource])

  return svgText
}

function sanitizeWorkbenchIconSvg(
  svgText: string | null,
  options: { nonScalingStroke?: boolean; strokeWidth?: number | string } = {},
): string | null {
  if (!svgText || svgText.length > 50000 || /<script\b/i.test(svgText)) return null
  const document = new DOMParser().parseFromString(svgText, "image/svg+xml")
  if (document.querySelector("parsererror")) return null
  const svg = document.querySelector("svg")
  if (!svg) return null

  svg.querySelectorAll("script, foreignObject, iframe, object, embed, link, style").forEach((node) => node.remove())
  for (const element of Array.from(svg.querySelectorAll("*"))) {
    for (const attribute of Array.from(element.attributes)) {
      const attributeName = attribute.name.toLowerCase()
      const attributeValue = attribute.value.trim().toLowerCase()
      if (
        attributeName === "style" ||
        attributeName.startsWith("on") ||
        ((attributeName === "href" || attributeName === "xlink:href") && attributeValue.startsWith("javascript:"))
      ) {
        element.removeAttribute(attribute.name)
      }
    }
  }

  const strokeTargets = getStrokeTargets(svg)
  // Stroke width and non-scaling stroke are the only reasons to render inline
  // rather than through the mask. A fill-only glyph -- every Carbon icon is one
  // -- has nothing to apply them to, so going inline would change nothing
  // except lose the mask path's currentColor binding and drop the icon to
  // SVG-default black. Hand it back to the mask instead.
  if (strokeTargets.length === 0) return null

  const normalizedStrokeWidth = normalizeStrokeWidth(options.strokeWidth)
  if (normalizedStrokeWidth) {
    applyStrokeWidth(strokeTargets, normalizedStrokeWidth)
  }
  if (options.nonScalingStroke) {
    applyVectorEffect(strokeTargets)
  }
  applyCurrentColorPaint(svg)

  svg.removeAttribute("class")
  svg.removeAttribute("height")
  svg.removeAttribute("style")
  svg.removeAttribute("width")
  svg.setAttribute("aria-hidden", "true")
  svg.setAttribute("focusable", "false")
  svg.setAttribute("height", "100%")
  svg.setAttribute("style", "display:block;width:100%;height:100%;overflow:visible")
  svg.setAttribute("width", "100%")
  if (!svg.getAttribute("viewBox")) svg.setAttribute("viewBox", "0 0 24 24")
  return svg.outerHTML
}

function applyStrokeWidth(strokeTargets: Element[], strokeWidth: string) {
  for (const element of strokeTargets) {
    element.setAttribute("stroke-width", strokeWidth)
  }
}

function applyVectorEffect(strokeTargets: Element[]) {
  for (const element of strokeTargets) {
    element.setAttribute("vector-effect", "non-scaling-stroke")
  }
}

// Inline rendering has to paint what the mask path paints. The mask fills every
// visible pixel with currentColor, so an inline icon carrying its own literal
// colors would stop following `text-*` the moment a stroke prop moved it here.
// `none` stays none, and paint servers keep their own reference.
function applyCurrentColorPaint(svg: Element) {
  if (!svg.getAttribute("fill")) svg.setAttribute("fill", "currentColor")
  for (const element of [svg, ...Array.from(svg.querySelectorAll("*"))]) {
    for (const attribute of ["fill", "stroke"] as const) {
      const value = element.getAttribute(attribute)
      if (!value || value === "none" || /^url\(/i.test(value)) continue
      element.setAttribute(attribute, "currentColor")
    }
  }
}

function getStrokeTargets(svg: Element): Element[] {
  const targets = new Set<Element>()
  const rootStroke = svg.getAttribute("stroke")
  const rootUsesStroke = Boolean(rootStroke && rootStroke !== "none")
  if (rootUsesStroke) targets.add(svg)
  for (const element of Array.from(svg.querySelectorAll("*"))) {
    const stroke = element.getAttribute("stroke")
    if (stroke && stroke !== "none") targets.add(element)
    if (rootUsesStroke && isSvgShapeElement(element)) targets.add(element)
  }
  return [...targets]
}

function isSvgShapeElement(element: Element): boolean {
  return ["circle", "ellipse", "line", "path", "polygon", "polyline", "rect"].includes(element.tagName.toLowerCase())
}

function resolveWorkbenchIconSource(name: string | undefined): string | null {
  if (!name) return null
  if (isWorkbenchIconAssetSource(name)) return normalizeWorkbenchIconAssetSource(name)
  const sourceMap = (globalThis as WorkbenchIconRuntimeGlobal).__WORKBENCH_DEFAULT_ICON_SOURCES__
  if (!sourceMap) return null
  const normalizedName = normalizeIconName(name)
  return sourceMap[normalizedName] ?? sourceMap[name] ?? null
}

function isWorkbenchIconAssetSource(value: string): boolean {
  const trimmed = value.trim()
  return trimmed.startsWith("/workbench-assets/icons/") ||
    trimmed.startsWith("workbench-assets/icons/") ||
    trimmed.endsWith(".svg") ||
    trimmed.startsWith("data:image/svg+xml")
}

function normalizeWorkbenchIconAssetSource(value: string): string {
  const trimmed = value.trim()
  return trimmed.startsWith("workbench-assets/icons/") ? `/${trimmed}` : trimmed
}

function toCssUrl(value: string): string {
  return `url(${JSON.stringify(value)})`
}

function normalizeIconName(value: string | undefined): string {
  const normalized = String(value || "circle-user")
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-zA-Z0-9-/.]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
  return normalized || "circle-user"
}

// The shared t-shirt scale, matching scripts/workbench-starter/components/Icon.tsx.
const ICON_SIZE_PRESETS: Record<string, string> = {
  xs: "12px",
  sm: "16px",
  md: "20px",
  lg: "24px",
  xl: "32px",
}

function normalizeIconSize(value: number | string | undefined, fallback: number): number | string {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const trimmed = value.trim()
    const preset = ICON_SIZE_PRESETS[trimmed.toLowerCase()]
    if (preset) return preset
    if (/^-?(?:\d+\.?\d*|\.\d+)$/.test(trimmed)) return Number(trimmed)
    // A string that is not a CSS length makes inline-size invalid, so the
    // browser drops the declaration and the icon collapses to 0x0 and vanishes
    // with no error. Keep the escape hatch for real lengths, fall back for the
    // rest so a bad value is visible rather than absent.
    if (isCssLengthValue(trimmed)) return trimmed
  }
  return fallback
}

function isCssLengthValue(value: string): boolean {
  if (/^-?(?:\d+\.?\d*|\.\d+)(?:px|r?em|%|vh|vw|vmin|vmax|ch|ex|cm|mm|in|pt|pc|q)$/i.test(value)) return true
  return /^(?:calc|clamp|min|max|var)\(/i.test(value)
}

function normalizeStrokeWidth(value: number | string | undefined): string | null {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) return String(value)
  if (typeof value === "string" && value.trim()) return value.trim()
  return null
}

export { Icon }
