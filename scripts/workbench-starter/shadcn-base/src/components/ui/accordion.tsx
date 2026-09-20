import * as React from "react"
import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion"

import { cn } from "@/lib/utils"
import { RiArrowDownSLine, RiArrowUpSLine } from "@remixicon/react"

type AccordionValueInput = AccordionPrimitive.Root.Props["defaultValue"] | string

type AccordionProps = Omit<AccordionPrimitive.Root.Props, "defaultValue" | "value"> & {
  contentGap?: AccordionContentGap
  contentSize?: AccordionTypographySize
  contentTone?: AccordionTypographyTone
  contentWeight?: AccordionTypographyWeight
  defaultValue?: AccordionValueInput
  showDividers?: boolean
  titleSize?: AccordionTypographySize
  titleTone?: AccordionTypographyTone
  titleWeight?: AccordionTypographyWeight
  value?: AccordionValueInput
}

type AccordionContentGap = "none" | "xs" | "sm" | "md" | "lg"
type AccordionTypographySize = "xs" | "sm" | "md" | "lg" | "xl" | "display"
type AccordionTypographyTone = "default" | "muted" | "accent" | "danger" | "onAccent"
type AccordionTypographyWeight = "regular" | "medium" | "semibold" | "bold"
type AccordionTypographyContextValue = {
  contentGap: AccordionContentGap
  contentSize: AccordionTypographySize
  contentTone: AccordionTypographyTone
  contentWeight: AccordionTypographyWeight
  titleSize: AccordionTypographySize
  titleTone: AccordionTypographyTone
  titleWeight: AccordionTypographyWeight
}

const DEFAULT_ACCORDION_TYPOGRAPHY: AccordionTypographyContextValue = {
  contentGap: "sm",
  contentSize: "sm",
  contentTone: "default",
  contentWeight: "regular",
  titleSize: "sm",
  titleTone: "default",
  titleWeight: "medium",
}

const AccordionTypographyContext = React.createContext(DEFAULT_ACCORDION_TYPOGRAPHY)

const accordionTypographySizeClasses: Record<AccordionTypographySize, string> = {
  xs: "text-xs leading-5",
  sm: "text-sm leading-6",
  md: "text-base leading-7",
  lg: "text-lg leading-8",
  xl: "text-xl leading-8",
  display: "text-4xl leading-tight tracking-normal",
}

const accordionTypographyToneClasses: Record<AccordionTypographyTone, string> = {
  default: "text-foreground",
  muted: "text-muted-foreground",
  accent: "text-primary",
  danger: "text-destructive",
  onAccent: "text-primary-foreground",
}

const accordionTypographyWeightClasses: Record<AccordionTypographyWeight, string> = {
  regular: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
}

const accordionContentGapClasses: Record<AccordionContentGap, string> = {
  none: "gap-0",
  xs: "gap-1.5",
  sm: "gap-2.5",
  md: "gap-4",
  lg: "gap-6",
}

function getAccordionTypographyOverrideClasses({
  size,
  tone,
  weight,
  defaultSize,
  defaultTone,
  defaultWeight,
}: {
  size: AccordionTypographySize
  tone: AccordionTypographyTone
  weight: AccordionTypographyWeight
  defaultSize: AccordionTypographySize
  defaultTone: AccordionTypographyTone
  defaultWeight: AccordionTypographyWeight
}) {
  return cn(
    size !== defaultSize && accordionTypographySizeClasses[size],
    tone !== defaultTone && accordionTypographyToneClasses[tone],
    weight !== defaultWeight && accordionTypographyWeightClasses[weight]
  )
}

function normalizeAccordionValue(
  value: AccordionValueInput | undefined,
): AccordionPrimitive.Root.Props["defaultValue"] | undefined {
  if (typeof value !== "string") return value

  const trimmed = value.trim()
  if (!trimmed || trimmed === "[]") return []

  const bracketMatch = trimmed.match(/^\[(.*)\]$/)
  const rawItems = bracketMatch ? bracketMatch[1] : trimmed
  const items = rawItems
    .split(",")
    .map((item) => item.trim().replace(/^['"]|['"]$/g, ""))
    .filter(Boolean)

  return items.length > 0 ? items : []
}

function getAccordionValueKey(
  value: AccordionPrimitive.Root.Props["defaultValue"] | undefined,
  multiple: AccordionPrimitive.Root.Props["multiple"],
) {
  return `${multiple ? "multiple" : "single"}:${JSON.stringify(value ?? [])}`
}

function Accordion({
  className,
  contentGap = DEFAULT_ACCORDION_TYPOGRAPHY.contentGap,
  contentSize = DEFAULT_ACCORDION_TYPOGRAPHY.contentSize,
  contentTone = DEFAULT_ACCORDION_TYPOGRAPHY.contentTone,
  contentWeight = DEFAULT_ACCORDION_TYPOGRAPHY.contentWeight,
  defaultValue,
  multiple,
  showDividers = true,
  titleSize = DEFAULT_ACCORDION_TYPOGRAPHY.titleSize,
  titleTone = DEFAULT_ACCORDION_TYPOGRAPHY.titleTone,
  titleWeight = DEFAULT_ACCORDION_TYPOGRAPHY.titleWeight,
  value,
  ...props
}: AccordionProps) {
  const typography = React.useMemo(
    () => ({ contentGap, contentSize, contentTone, contentWeight, titleSize, titleTone, titleWeight }),
    [contentGap, contentSize, contentTone, contentWeight, titleSize, titleTone, titleWeight]
  )
  const normalizedDefaultValue = normalizeAccordionValue(defaultValue)
  const normalizedValue = normalizeAccordionValue(value)
  const isControlled = value !== undefined
  const accordionValueKey = getAccordionValueKey(
    isControlled ? normalizedValue : normalizedDefaultValue,
    multiple
  )

  return (
    <AccordionTypographyContext.Provider value={typography}>
      <AccordionPrimitive.Root
        key={accordionValueKey}
        data-slot="accordion"
        data-dividers={showDividers ? "true" : "false"}
        multiple={multiple}
        {...(isControlled
          ? { value: normalizedValue ?? [] }
          : { defaultValue: normalizedDefaultValue })}
        className={cn(
          "flex w-full flex-col",
          showDividers && "divide-y-[length:var(--ds-token-workbench-components-accordion-divider-width)] divide-[color:var(--ds-token-workbench-components-accordion-divider-color)] divide-solid",
          className
        )}
        {...props}
      />
    </AccordionTypographyContext.Provider>
  )
}

function AccordionItem({ className, ...props }: AccordionPrimitive.Item.Props) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn(className)}
      {...props}
    />
  )
}

type AccordionPanelProps = Omit<AccordionPrimitive.Item.Props, "value"> & {
  contentClassName?: string
  title?: React.ReactNode
  triggerClassName?: string
  value?: AccordionPrimitive.Item.Props["value"]
}

function AccordionPanel({
  children,
  className,
  contentClassName,
  title,
  triggerClassName,
  value,
  ...props
}: AccordionPanelProps) {
  const typography = React.useContext(AccordionTypographyContext)
  const fallbackValue = React.useId()
  const itemValue = value ?? fallbackValue

  return (
    <AccordionItem className={className} value={itemValue} {...props}>
      <AccordionTrigger className={cn(
        getAccordionTypographyOverrideClasses({
          size: typography.titleSize,
          tone: typography.titleTone,
          weight: typography.titleWeight,
          defaultSize: DEFAULT_ACCORDION_TYPOGRAPHY.titleSize,
          defaultTone: DEFAULT_ACCORDION_TYPOGRAPHY.titleTone,
          defaultWeight: DEFAULT_ACCORDION_TYPOGRAPHY.titleWeight,
        }),
        triggerClassName
      )}>
        {title}
      </AccordionTrigger>
      <AccordionContent className={cn(
        getAccordionTypographyOverrideClasses({
          size: typography.contentSize,
          tone: typography.contentTone,
          weight: typography.contentWeight,
          defaultSize: DEFAULT_ACCORDION_TYPOGRAPHY.contentSize,
          defaultTone: DEFAULT_ACCORDION_TYPOGRAPHY.contentTone,
          defaultWeight: DEFAULT_ACCORDION_TYPOGRAPHY.contentWeight,
        }),
        contentClassName
      )}>
        {children}
      </AccordionContent>
    </AccordionItem>
  )
}

function AccordionTrigger({
  className,
  children,
  ...props
}: AccordionPrimitive.Trigger.Props) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "group/accordion-trigger relative flex min-h-[var(--ds-token-workbench-components-accordion-trigger-height)] flex-1 items-start justify-between rounded-lg border border-transparent px-[var(--ds-token-workbench-components-accordion-padding-x)] py-2.5 text-left text-[length:var(--ds-token-workbench-components-accordion-title-font-size)] leading-[var(--ds-token-workbench-components-accordion-title-line-height)] font-[var(--ds-token-workbench-components-accordion-title-font-weight)] text-[var(--ds-token-workbench-components-accordion-title-color)] transition-all outline-none hover:underline focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:after:border-ring aria-disabled:pointer-events-none aria-disabled:opacity-50 **:data-[slot=accordion-trigger-icon]:ml-auto **:data-[slot=accordion-trigger-icon]:size-4 **:data-[slot=accordion-trigger-icon]:text-muted-foreground",
          className
        )}
        {...props}
      >
        {children}
        <RiArrowDownSLine data-slot="accordion-trigger-icon" className="pointer-events-none shrink-0 group-aria-expanded/accordion-trigger:hidden" />
        <RiArrowUpSLine data-slot="accordion-trigger-icon" className="pointer-events-none hidden shrink-0 group-aria-expanded/accordion-trigger:inline" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}

function AccordionContent({
  className,
  children,
  ...props
}: AccordionPrimitive.Panel.Props) {
  const typography = React.useContext(AccordionTypographyContext)

  return (
    <AccordionPrimitive.Panel
      data-slot="accordion-content"
      className="h-(--accordion-panel-height) overflow-hidden text-sm transition-[height] duration-200 ease-out data-ending-style:h-0 data-starting-style:h-0"
      {...props}
    >
      <div
        className={cn(
          "flex flex-col gap-[var(--ds-token-workbench-components-accordion-content-gap)] px-[var(--ds-token-workbench-components-accordion-padding-x)] pt-0 pb-[var(--ds-token-workbench-components-accordion-content-padding-y)] text-[length:var(--ds-token-workbench-components-accordion-content-font-size)] leading-[var(--ds-token-workbench-components-accordion-content-line-height)] font-[var(--ds-token-workbench-components-accordion-content-font-weight)] text-[var(--ds-token-workbench-components-accordion-content-color)] [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground [&_p]:m-0",
          typography.contentGap !== DEFAULT_ACCORDION_TYPOGRAPHY.contentGap && accordionContentGapClasses[typography.contentGap],
          className
        )}
      >
        {renderAccordionContentChildren(children)}
      </div>
    </AccordionPrimitive.Panel>
  )
}

const ACCORDION_INLINE_CONTENT_TAGS = new Set([
  "a",
  "abbr",
  "b",
  "bdi",
  "bdo",
  "br",
  "cite",
  "code",
  "data",
  "dfn",
  "del",
  "em",
  "i",
  "ins",
  "kbd",
  "mark",
  "q",
  "ruby",
  "s",
  "samp",
  "small",
  "span",
  "strong",
  "sub",
  "sup",
  "time",
  "u",
  "var",
  "wbr",
])

function renderAccordionContentChildren(children: React.ReactNode) {
  const content: React.ReactNode[] = []
  let inlineRun: React.ReactNode[] = []

  const flushInlineRun = () => {
    if (inlineRun.length === 0) return
    content.push(
      <p data-slot="accordion-content-text" key={`accordion-content-text-${content.length}`}>
        {inlineRun}
      </p>
    )
    inlineRun = []
  }

  for (const child of React.Children.toArray(children)) {
    if (typeof child === "string") {
      const normalizedText = child.replace(/\s+/g, " ")
      if (normalizedText.trim()) inlineRun.push(normalizedText)
      continue
    }
    if (typeof child === "number") {
      inlineRun.push(child)
      continue
    }
    if (React.isValidElement(child) && isAccordionInlineContentElement(child)) {
      inlineRun.push(child)
      continue
    }
    flushInlineRun()
    content.push(child)
  }

  flushInlineRun()
  return content
}

function isAccordionInlineContentElement(child: React.ReactElement) {
  return typeof child.type === "string" && ACCORDION_INLINE_CONTENT_TAGS.has(child.type)
}

export { Accordion, AccordionItem, AccordionPanel, AccordionTrigger, AccordionContent }
