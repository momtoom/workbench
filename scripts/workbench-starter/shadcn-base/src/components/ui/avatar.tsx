import * as React from "react"
import { Avatar as AvatarPrimitive } from "@base-ui/react/avatar"

import "./avatar.css"
import { cn } from "@/lib/utils"

type AvatarSize = "default" | "sm" | "lg"
type AvatarBadgeKind = "none" | "dot" | "number" | "icon"

type WorkbenchIconRuntimeGlobal = typeof globalThis & {
  __WORKBENCH_DEFAULT_ICON_SOURCES__?: Record<string, string>
}

type AvatarProps = AvatarPrimitive.Root.Props & {
  alt?: string
  badge?: AvatarBadgeKind
  badgeIcon?: string
  badgeText?: string
  fallback?: string
  size?: AvatarSize
  src?: string
}

type AvatarBadgeProps = React.ComponentProps<"span"> & {
  badge?: Exclude<AvatarBadgeKind, "none">
}

type AvatarGroupProps = React.ComponentProps<"div"> & {
  avatar1Alt?: string
  avatar1Badge?: AvatarBadgeKind
  avatar1BadgeIcon?: string
  avatar1BadgeText?: string
  avatar1Fallback?: string
  avatar1Src?: string
  avatar2Alt?: string
  avatar2Badge?: AvatarBadgeKind
  avatar2BadgeIcon?: string
  avatar2BadgeText?: string
  avatar2Fallback?: string
  avatar2Src?: string
  avatar3Alt?: string
  avatar3Badge?: AvatarBadgeKind
  avatar3BadgeIcon?: string
  avatar3BadgeText?: string
  avatar3Fallback?: string
  avatar3Src?: string
  count?: number | string
  showCount?: boolean
  size?: AvatarSize
}

function Avatar({
  alt = "",
  badge = "none",
  badgeIcon = "check",
  badgeText = "1",
  children,
  className,
  fallback = "CN",
  size = "default",
  src = "",
  ...props
}: AvatarProps) {
  const hasAuthoredChildren = React.Children.count(children) > 0
  const badgeKind = normalizeAvatarBadge(badge)

  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      data-size={size}
      className={cn("wb-avatar", className)}
      {...props}
    >
      {src ? <AvatarImage src={src} alt={alt} /> : null}
      {hasAuthoredChildren ? children : <AvatarFallback>{fallback}</AvatarFallback>}
      {badgeKind === "none" ? null : (
        <AvatarBadge badge={badgeKind}>
          {renderAvatarBadgeContent({ badgeIcon, badgeKind, badgeText })}
        </AvatarBadge>
      )}
    </AvatarPrimitive.Root>
  )
}

function AvatarImage({ className, ...props }: AvatarPrimitive.Image.Props) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn("wb-avatar__image", className)}
      {...props}
    />
  )
}

function AvatarFallback({
  className,
  ...props
}: AvatarPrimitive.Fallback.Props) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn("wb-avatar__fallback", className)}
      {...props}
    />
  )
}

function AvatarBadge({ badge = "dot", className, ...props }: AvatarBadgeProps) {
  const badgeKind = normalizeAvatarBadge(badge)

  return (
    <span
      data-badge={badgeKind === "none" ? "dot" : badgeKind}
      data-slot="avatar-badge"
      className={cn("wb-avatar__badge", className)}
      {...props}
    />
  )
}

function AvatarGroup({
  avatar1Alt = "@shadcn",
  avatar1Badge = "none",
  avatar1BadgeIcon = "check",
  avatar1BadgeText = "1",
  avatar1Fallback = "CN",
  avatar1Src = "https://github.com/shadcn.png",
  avatar2Alt = "@leerob",
  avatar2Badge = "none",
  avatar2BadgeIcon = "check",
  avatar2BadgeText = "1",
  avatar2Fallback = "LR",
  avatar2Src = "https://github.com/leerob.png",
  avatar3Alt = "",
  avatar3Badge = "none",
  avatar3BadgeIcon = "check",
  avatar3BadgeText = "1",
  avatar3Fallback = "ER",
  avatar3Src = "",
  children,
  className,
  count = 3,
  showCount = true,
  size = "default",
  ...props
}: AvatarGroupProps) {
  const hasAuthoredChildren = React.Children.count(children) > 0

  return (
    <div
      data-slot="avatar-group"
      className={cn("wb-avatar-group", className)}
      {...props}
    >
      {hasAuthoredChildren ? children : (
        <>
          <Avatar alt={avatar1Alt} badge={avatar1Badge} badgeIcon={avatar1BadgeIcon} badgeText={avatar1BadgeText} fallback={avatar1Fallback} size={size} src={avatar1Src} />
          <Avatar alt={avatar2Alt} badge={avatar2Badge} badgeIcon={avatar2BadgeIcon} badgeText={avatar2BadgeText} fallback={avatar2Fallback} size={size} src={avatar2Src} />
          <Avatar alt={avatar3Alt} badge={avatar3Badge} badgeIcon={avatar3BadgeIcon} badgeText={avatar3BadgeText} fallback={avatar3Fallback} size={size} src={avatar3Src} />
          {showCount ? <AvatarGroupCount>{formatAvatarGroupCount(count)}</AvatarGroupCount> : null}
        </>
      )}
    </div>
  )
}

function AvatarGroupCount({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar-group-count"
      className={cn("wb-avatar-group__count", className)}
      {...props}
    />
  )
}

function renderAvatarBadgeContent({
  badgeIcon,
  badgeKind,
  badgeText,
}: {
  badgeIcon: string
  badgeKind: AvatarBadgeKind
  badgeText: string
}) {
  if (badgeKind === "number") return normalizeAvatarBadgeText(badgeText)
  if (badgeKind === "icon") return <AvatarBadgeIcon name={badgeIcon} />
  return null
}

function AvatarBadgeIcon({ name = "check" }: { name?: string }) {
  const iconSource = resolveWorkbenchAvatarIconSource(name)

  return (
    <span
      aria-hidden="true"
      className="wb-avatar__badge-icon"
      style={{
        WebkitMaskImage: iconSource ? `url(${iconSource})` : undefined,
        maskImage: iconSource ? `url(${iconSource})` : undefined,
      } as React.CSSProperties}
    />
  )
}

function normalizeAvatarBadge(value: AvatarBadgeKind | string | undefined): AvatarBadgeKind {
  return value === "dot" || value === "number" || value === "icon" || value === "none" ? value : "none"
}

function normalizeAvatarBadgeText(value: string | undefined): string {
  const trimmed = value?.trim()
  return trimmed || "1"
}

function formatAvatarGroupCount(value: number | string): string {
  if (typeof value === "number" && Number.isFinite(value)) return `+${Math.max(0, Math.round(value))}`
  const trimmed = String(value).trim()
  if (!trimmed) return "+3"
  return trimmed.startsWith("+") ? trimmed : `+${trimmed}`
}

function resolveWorkbenchAvatarIconSource(name: string | undefined): string | null {
  const rawName = name?.trim() ?? ""
  if (rawName && isWorkbenchAvatarIconAssetSource(rawName)) return rawName
  const normalizedName = normalizeWorkbenchAvatarIconName(name)
  if (!normalizedName) return null
  const sourceMap = (globalThis as WorkbenchIconRuntimeGlobal).__WORKBENCH_DEFAULT_ICON_SOURCES__
  if (sourceMap?.[normalizedName] || sourceMap?.[rawName]) return sourceMap?.[normalizedName] ?? sourceMap?.[rawName] ?? null
  if (normalizedName.startsWith("ri-")) return `/workbench-assets/icons/remixicon/${normalizedName}.svg`
  return `/workbench-assets/icons/lucide-preview/${normalizedName}.svg`
}

function isWorkbenchAvatarIconAssetSource(value: string): boolean {
  return value.startsWith("/workbench-assets/icons/") ||
    value.startsWith("workbench-assets/icons/") ||
    value.endsWith(".svg") ||
    value.startsWith("data:image/svg+xml")
}

function normalizeWorkbenchAvatarIconName(value: string | undefined): string {
  const normalized = String(value || "check")
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-zA-Z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
  return normalized || "check"
}

export {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarBadge,
}
