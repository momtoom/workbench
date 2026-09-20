import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import "./alert.css"
import { cn } from "@/lib/utils"
import { isWorkbenchElementOfType } from "@/components/ui/workbench-runtime"

const alertVariants = cva(
  "group/alert relative grid w-full border text-left",
  {
    variants: {
      variant: {
        default: "",
        destructive: "",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

type WorkbenchIconRuntimeGlobal = typeof globalThis & {
  __WORKBENCH_DEFAULT_ICON_SOURCES__?: Record<string, string>
}

type AlertProps = React.ComponentProps<"div"> & VariantProps<typeof alertVariants> & {
  icon?: string
  showIcon?: boolean
}

function Alert({
  children,
  className,
  icon = "alert-circle",
  showIcon = false,
  style,
  variant,
  ...props
}: AlertProps) {
  const hasAction = React.Children.toArray(children).some(isAlertActionElement)

  return (
    <div
      data-slot="alert"
      data-has-action={hasAction ? "true" : undefined}
      data-show-icon={showIcon ? "true" : undefined}
      data-variant={variant ?? "default"}
      role="alert"
      className={cn(alertVariants({ variant }), "wb-alert", className)}
      style={style}
      {...props}
    >
      {showIcon ? <AlertIcon name={icon} /> : null}
      {children}
    </div>
  )
}

function AlertIcon({ className, name = "alert-circle" }: { className?: string; name?: string }) {
  const iconSource = resolveWorkbenchAlertIconSource(name)
  return (
    <span
      aria-hidden="true"
      data-slot="alert-icon"
      className={cn("wb-alert__icon inline-block shrink-0 bg-current", className)}
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

function resolveWorkbenchAlertIconSource(name: string | undefined): string | null {
  const rawName = name?.trim() ?? ""
  if (rawName && isWorkbenchAlertIconAssetSource(rawName)) return rawName
  const normalizedName = normalizeWorkbenchAlertIconName(name)
  if (!normalizedName) return null
  const sourceMap = (globalThis as WorkbenchIconRuntimeGlobal).__WORKBENCH_DEFAULT_ICON_SOURCES__
  if (sourceMap?.[normalizedName] || sourceMap?.[rawName]) return sourceMap?.[normalizedName] ?? sourceMap?.[rawName] ?? null
  if (normalizedName.startsWith("ri-")) return `/workbench-assets/icons/remixicon/${normalizedName}.svg`
  return sourceMap?.[normalizedName] ?? sourceMap?.[rawName] ?? `/workbench-assets/icons/lucide-preview/${normalizedName}.svg`
}

function isWorkbenchAlertIconAssetSource(value: string): boolean {
  return value.startsWith("/workbench-assets/icons/") ||
    value.startsWith("workbench-assets/icons/") ||
    value.endsWith(".svg") ||
    value.startsWith("data:image/svg+xml")
}

function normalizeWorkbenchAlertIconName(value: string | undefined): string {
  const normalized = String(value || "alert-circle")
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-zA-Z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
  return normalized || "alert-circle"
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "wb-alert__title [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground",
        className
      )}
      {...props}
    />
  )
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "wb-alert__description text-balance md:text-pretty [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground [&_p:not(:last-child)]:mb-4",
        className
      )}
      {...props}
    />
  )
}

function AlertAction({ className, children, style, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-action"
      className={cn("wb-alert__action flex items-center", className)}
      style={style}
      {...props}
    >
      {children}
    </div>
  )
}

function isAlertActionElement(child: React.ReactNode): boolean {
  return isWorkbenchElementOfType(child, AlertAction, "AlertAction")
}

export { Alert, AlertTitle, AlertDescription, AlertAction }
