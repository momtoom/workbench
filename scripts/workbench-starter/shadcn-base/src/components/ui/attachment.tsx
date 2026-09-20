import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import "./attachment.css"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type AttachmentState = "idle" | "uploading" | "processing" | "error" | "done"
type AttachmentMediaVariant = "icon" | "image"
type AttachmentGroupGap = "sm" | "md" | "lg"
type AttachmentGroupLayout = "scroll" | "wrap" | "stack"

type AttachmentContextValue = {
  state: AttachmentState
}

type WorkbenchIconRuntimeGlobal = typeof globalThis & {
  __WORKBENCH_DEFAULT_ICON_SOURCES__?: Record<string, string>
}

const AttachmentContext = React.createContext<AttachmentContextValue>({
  state: "done",
})

const attachmentVariants = cva(
  "group/attachment relative flex h-fit w-fit max-w-full min-w-0 shrink-0 self-start overflow-hidden rounded-xl border bg-card text-card-foreground transition-colors focus-within:ring-1 focus-within:ring-ring/50 has-[>a,>button]:hover:bg-muted/50 data-[state=error]:border-destructive/40 data-[state=idle]:border-dashed",
  {
    variants: {
      size: {
        default:
          "gap-2 text-sm has-data-[slot=attachment-content]:px-2.5 has-data-[slot=attachment-content]:py-2 has-data-[slot=attachment-media]:p-2",
        sm: "gap-2.5 text-xs has-data-[slot=attachment-content]:px-2 has-data-[slot=attachment-content]:py-1.5 has-data-[slot=attachment-media]:p-1.5",
        xs: "gap-1.5 rounded-lg text-xs has-data-[slot=attachment-content]:px-1.5 has-data-[slot=attachment-content]:py-1 has-data-[slot=attachment-media]:p-1",
      },
      orientation: {
        horizontal: "min-w-40 items-center",
        vertical: "w-24 flex-col has-data-[slot=attachment-content]:w-30",
      },
    },
    defaultVariants: {
      orientation: "horizontal",
      size: "default",
    },
  }
)

type AttachmentProps = React.ComponentProps<"div"> &
  VariantProps<typeof attachmentVariants> & {
    actionIconName?: string
    fileMeta?: string
    fileName?: string
    iconName?: string
    imageAlt?: string
    imageSrc?: string
    mediaVariant?: AttachmentMediaVariant
    progress?: number
    showAction?: boolean
    state?: AttachmentState
    statusText?: string
  }

function Attachment({
  actionIconName = "x",
  className,
  children,
  fileMeta = "PDF · 2.4 MB",
  fileName = "sales-report.pdf",
  iconName,
  imageAlt,
  imageSrc,
  mediaVariant = "icon",
  progress = 64,
  showAction = true,
  state = "done",
  size = "default",
  statusText,
  orientation = "horizontal",
  ...props
}: AttachmentProps) {
  const effectiveSize = orientation === "horizontal" ? size : "default"
  const hasAuthoredChildren = React.Children.count(children) > 0
  const normalizedProgress = normalizeAttachmentProgress(progress)
  const description = getAttachmentDescriptionText({
    fileMeta,
    progress: normalizedProgress,
    state,
    statusText,
  })

  return (
    <AttachmentContext.Provider value={{ state }}>
      <div
        data-slot="attachment"
        data-state={state}
        data-size={orientation === "horizontal" ? size : undefined}
        data-orientation={orientation}
        data-progress={normalizedProgress ?? undefined}
        className={cn(attachmentVariants({ size: effectiveSize, orientation }), className)}
        {...props}
      >
        {hasAuthoredChildren ? children : (
          <>
            <AttachmentTrigger aria-label={`Open ${fileName}`} />
            <AttachmentMedia
              iconName={iconName}
              imageAlt={imageAlt ?? fileName}
              imageSrc={imageSrc}
              variant={mediaVariant}
            />
            <AttachmentContent>
              <AttachmentTitle>{fileName}</AttachmentTitle>
              <AttachmentDescription>{description}</AttachmentDescription>
            </AttachmentContent>
            {showAction ? (
              <AttachmentActions>
                {state === "error" ? (
                  <AttachmentAction aria-label="Retry upload" iconName="refresh-cw" />
                ) : null}
                <AttachmentAction aria-label="Remove attachment" iconName={actionIconName} />
              </AttachmentActions>
            ) : null}
          </>
        )}
      </div>
    </AttachmentContext.Provider>
  )
}

const attachmentMediaVariants = cva(
  "relative flex aspect-square size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-foreground group-data-[orientation=vertical]/attachment:size-auto group-data-[orientation=vertical]/attachment:w-full group-data-[size=sm]/attachment:size-8 group-data-[size=xs]/attachment:size-7 group-data-[size=xs]/attachment:rounded-md group-data-[state=error]/attachment:bg-destructive/10 group-data-[state=error]/attachment:text-destructive [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 group-data-[orientation=vertical]/attachment:[&_svg:not([class*='size-'])]:size-6 group-data-[size=xs]/attachment:[&_svg:not([class*='size-'])]:size-3.5",
  {
    variants: {
      variant: {
        icon: "",
        image:
          "opacity-70 group-data-[state=done]/attachment:opacity-100 group-data-[state=idle]/attachment:opacity-100 *:[img]:aspect-square *:[img]:size-full *:[img]:object-cover",
      },
    },
    defaultVariants: {
      variant: "icon",
    },
  }
)

function AttachmentMedia({
  children,
  className,
  iconName,
  imageAlt = "",
  imageSrc,
  variant = "icon",
  ...props
}: React.ComponentProps<"div"> &
  Omit<VariantProps<typeof attachmentMediaVariants>, "variant"> & {
    iconName?: string
    imageAlt?: string
    imageSrc?: string
    variant?: AttachmentMediaVariant
  }) {
  const { state } = React.useContext(AttachmentContext)
  const hasAuthoredChildren = React.Children.count(children) > 0
  const isUploading = state === "uploading"
  const normalizedImageSrc = typeof imageSrc === "string" ? imageSrc.trim() : ""

  return (
    <div
      data-slot="attachment-media"
      data-variant={variant}
      className={cn(attachmentMediaVariants({ variant }), className)}
      {...props}
    >
      {hasAuthoredChildren ? children : (
        variant === "image" && normalizedImageSrc ? (
          <img src={normalizedImageSrc} alt={imageAlt} draggable={false} />
        ) : (
          <AttachmentIconGlyph
            loading={isUploading}
            name={getAttachmentMediaIconName(state, iconName, variant)}
          />
        )
      )}
    </div>
  )
}

function AttachmentContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="attachment-content"
      className={cn(
        "max-w-full min-w-0 flex-1 leading-tight group-data-[orientation=vertical]/attachment:px-1",
        className
      )}
      {...props}
    />
  )
}

function AttachmentTitle({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="attachment-title"
      className={cn(
        "block max-w-full min-w-0 truncate font-medium",
        className
      )}
      {...props}
    />
  )
}

function AttachmentDescription({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="attachment-description"
      className={cn(
        "mt-0.5 block min-w-0 max-w-full truncate text-xs text-muted-foreground group-data-[size=xs]/attachment:hidden group-data-[state=error]/attachment:text-destructive/80",
        className
      )}
      {...props}
    />
  )
}

function AttachmentActions({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="attachment-actions"
      className={cn(
        "relative z-20 flex shrink-0 items-center group-data-[orientation=vertical]/attachment:absolute group-data-[orientation=vertical]/attachment:top-3 group-data-[orientation=vertical]/attachment:right-3 group-data-[orientation=vertical]/attachment:gap-1",
        className
      )}
      {...props}
    />
  )
}

function AttachmentAction({
  children,
  className,
  iconName = "x",
  variant,
  size = "icon-xs",
  ...props
}: React.ComponentProps<typeof Button> & {
  iconName?: string
}) {
  return (
    <Button
      data-slot="attachment-action"
      variant={variant ?? "ghost"}
      size={size}
      className={cn(className)}
      {...props}
    >
      {children ?? <AttachmentIconGlyph className="size-3" name={iconName} />}
    </Button>
  )
}

function AttachmentTrigger({
  asChild = false,
  className,
  render,
  type,
  ...props
}: React.ComponentProps<"button"> & {
  asChild?: boolean
  render?: React.ReactElement | ((props: React.ComponentProps<"button">) => React.ReactElement)
}) {
  const triggerClassName = cn("absolute inset-0 z-10 outline-none", className)

  if (typeof render === "function") {
    return render({
      "data-slot": "attachment-trigger",
      className: triggerClassName,
      type: type ?? "button",
      ...props,
    } as React.ComponentProps<"button">)
  }

  if (React.isValidElement(render)) {
    return React.cloneElement(render, {
      "data-slot": "attachment-trigger",
      className: cn(triggerClassName, (render.props as { className?: string }).className),
      ...props,
    } as React.HTMLAttributes<HTMLElement>)
  }

  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="attachment-trigger"
      type={asChild ? undefined : (type ?? "button")}
      className={triggerClassName}
      {...props}
    />
  )
}

const attachmentGroupVariants = cva("min-w-0 py-1", {
  variants: {
    gap: {
      sm: "gap-2",
      md: "gap-3",
      lg: "gap-4",
    },
    layout: {
      scroll:
        "flex overflow-x-auto overscroll-x-contain no-scrollbar *:data-[slot=attachment]:flex-none",
      wrap: "flex flex-wrap overflow-visible *:data-[slot=attachment]:flex-none",
      stack: "grid overflow-visible",
    },
  },
  defaultVariants: {
    gap: "md",
    layout: "scroll",
  },
})

function AttachmentGroup({
  className,
  gap = "md",
  layout = "scroll",
  snap = true,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof attachmentGroupVariants> & {
    gap?: AttachmentGroupGap
    layout?: AttachmentGroupLayout
    snap?: boolean
  }) {
  const shouldSnap = layout === "scroll" && snap

  return (
    <div
      data-slot="attachment-group"
      data-gap={gap}
      data-layout={layout}
      data-snap={shouldSnap ? "" : undefined}
      className={cn(
        attachmentGroupVariants({ gap, layout }),
        shouldSnap && "snap-x snap-mandatory scroll-px-1 *:data-[slot=attachment]:snap-start",
        className
      )}
      {...props}
    />
  )
}

function AttachmentIconGlyph({
  className,
  loading = false,
  name,
}: {
  className?: string
  loading?: boolean
  name: string
}) {
  const iconSource = resolveWorkbenchAttachmentIconSource(name)
  return (
    <span
      aria-hidden="true"
      className={cn("inline-block size-4 shrink-0 bg-current", loading ? "animate-spin" : null, className)}
      data-slot="attachment-icon"
      style={{
        WebkitMaskImage: iconSource ? `url(${iconSource})` : undefined,
        maskImage: iconSource ? `url(${iconSource})` : undefined,
        WebkitMaskPosition: "center",
        maskPosition: "center",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskSize: "contain",
        maskSize: "contain",
      } as React.CSSProperties}
    />
  )
}

function getAttachmentMediaIconName(
  state: AttachmentState,
  iconName: string | undefined,
  variant: AttachmentMediaVariant
): string {
  if (state === "uploading") return "loader-circle"
  const authoredIcon = iconName?.trim()
  if (authoredIcon) return authoredIcon
  if (variant === "image") return "image"
  if (state === "idle") return "clock"
  if (state === "processing") return "file-search"
  if (state === "error") return "file-warning"
  return "file-text"
}

function getAttachmentDescriptionText({
  fileMeta,
  progress,
  state,
  statusText,
}: {
  fileMeta: string
  progress: number | null
  state: AttachmentState
  statusText: string | undefined
}): string {
  const trimmedStatus = statusText?.trim()
  if (state === "idle") return trimmedStatus || "Ready to upload"
  if (state === "uploading") {
    const label = trimmedStatus || "Uploading"
    return progress === null ? label : `${label} · ${progress}%`
  }
  if (state === "processing") return trimmedStatus || "Processing document"
  if (state === "error") return trimmedStatus || "Upload failed. Try again."
  return fileMeta
}

function normalizeAttachmentProgress(value: number | undefined): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null
  return Math.min(100, Math.max(0, Math.round(value)))
}

function resolveWorkbenchAttachmentIconSource(name: string | undefined): string | null {
  const rawName = name?.trim() ?? ""
  if (rawName && isWorkbenchAttachmentIconAssetSource(rawName)) return normalizeWorkbenchAttachmentIconAssetSource(rawName)
  const normalizedName = normalizeWorkbenchAttachmentIconName(name)
  if (!normalizedName) return null
  const sourceMap = (globalThis as WorkbenchIconRuntimeGlobal).__WORKBENCH_DEFAULT_ICON_SOURCES__
  if (sourceMap?.[normalizedName] || sourceMap?.[rawName]) return sourceMap?.[normalizedName] ?? sourceMap?.[rawName] ?? null
  if (normalizedName.startsWith("ri-")) return `/workbench-assets/icons/remixicon/${normalizedName}.svg`
  return `/workbench-assets/icons/lucide-preview/${normalizedName}.svg`
}

function isWorkbenchAttachmentIconAssetSource(value: string): boolean {
  const trimmed = value.trim()
  return trimmed.startsWith("/workbench-assets/icons/") ||
    trimmed.startsWith("workbench-assets/icons/") ||
    trimmed.endsWith(".svg") ||
    trimmed.startsWith("data:image/svg+xml")
}

function normalizeWorkbenchAttachmentIconAssetSource(value: string): string {
  const trimmed = value.trim()
  return trimmed.startsWith("workbench-assets/icons/") ? `/${trimmed}` : trimmed
}

function normalizeWorkbenchAttachmentIconName(value: string | undefined): string {
  const normalized = String(value || "file-text")
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-zA-Z0-9-/.]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
  return normalized || "file-text"
}

export {
  Attachment,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentContent,
  AttachmentTitle,
  AttachmentDescription,
  AttachmentActions,
  AttachmentAction,
  AttachmentTrigger,
}
