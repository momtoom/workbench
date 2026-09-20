import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ReactNode,
} from "react"

import { WorkbenchPortalScopeProvider } from "@/lib/workbench-portal"
import { cn } from "@/lib/utils"
import "./theme.css"

type ThemeResolvedMode = "light" | "dark"
type ThemeMode = "inherit" | "auto" | ThemeResolvedMode
type ThemeName = "inherit" | "neutral" | "slate" | "blue" | "rose" | "indigo" | "amber" | "violet"
type ThemeElement = "div" | "main" | "section" | "article" | "header" | "footer" | "aside"
type ThemeSurface = "inherit" | "none" | "background" | "card" | "muted"
type ThemeRadius = "inherit" | "base" | "compact" | "flat"
type ThemeSpacing = "inherit" | "base" | "compact"
type ThemeTypography = "inherit" | "base" | "compact"
type ThemeEffect = "inherit" | "auto" | "light" | "dark"
type ThemePopover = "inherit" | "default" | "inverted"
type ThemeResolvedName = Exclude<ThemeName, "inherit">
type ThemeResolvedPopover = Exclude<ThemePopover, "inherit">

type ThemeRootProps = Omit<ComponentPropsWithoutRef<"div">, "children" | "className" | "popover" | "style">

type ThemeContextValue = {
  mode?: ThemeResolvedMode
  popover: ThemeResolvedPopover
  theme?: ThemeResolvedName
}

type ThemeFloatingLayerProps = {
  "data-wb-floating-layer": "true"
  "data-wb-popover": ThemeResolvedPopover
}

const ThemeContext = createContext<ThemeContextValue>({
  popover: "default",
})

type ThemeProps = ThemeRootProps & {
  as?: ThemeElement
  children?: ReactNode
  className?: string
  effect?: ThemeEffect
  mode?: ThemeMode
  popover?: ThemePopover
  radius?: ThemeRadius
  spacing?: ThemeSpacing
  style?: CSSProperties
  surface?: ThemeSurface
  theme?: ThemeName
  typography?: ThemeTypography
}

const surfaceClasses: Record<ThemeSurface, string> = {
  inherit: "",
  none: "",
  background: "bg-background",
  card: "rounded-[var(--ds-token-workbench-semantic-radius-surface-md)] border bg-card shadow-xs",
  muted: "bg-muted",
}

function Theme({
  as: Component = "section",
  children,
  className,
  effect = "auto",
  mode = "auto",
  popover = "default",
  radius = "base",
  spacing = "base",
  style,
  surface = "none",
  theme = "neutral",
  typography = "base",
  ...props
}: ThemeProps) {
  const parentTheme = useContext(ThemeContext)
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(
    null
  )
  const [rootElement, setRootElement] = useState<HTMLElement | null>(null)
  const [autoMode, setAutoMode] = useState<ThemeResolvedMode>(() =>
    getAutoThemeMode()
  )
  const handleRootRef = useCallback((element: HTMLElement | null) => {
    setRootElement(element)
  }, [])
  const handlePortalContainerRef = useCallback((element: HTMLDivElement | null) => {
    setPortalContainer(element)
  }, [])
  useEffect(() => {
    const inheritsPreviewMode = mode === "inherit" && !parentTheme.mode
    if (mode !== "auto" && !inheritsPreviewMode) return

    const updateAutoMode = () => {
      setAutoMode(getAutoThemeMode(rootElement))
    }

    updateAutoMode()

    const mediaQuery = window.matchMedia?.("(prefers-color-scheme: dark)")
    mediaQuery?.addEventListener?.("change", updateAutoMode)

    const observer = new MutationObserver(updateAutoMode)
    const observedElements = new Set<Element>()
    const observeElement = (element: Element | null) => {
      if (!element || observedElements.has(element)) return
      observedElements.add(element)
      observer.observe(element, {
        attributeFilter: [
          "class",
          "data-preview-theme",
          "data-theme",
          "data-wb-preview-appearance",
        ],
        attributes: true,
      })
    }
    observeElement(rootElement)
    observeElement(getClosestPreviewAppearanceRoot(rootElement))
    observeElement(document.documentElement)
    observeElement(document.body)

    return () => {
      mediaQuery?.removeEventListener?.("change", updateAutoMode)
      observer.disconnect()
    }
  }, [mode, parentTheme.mode, rootElement])

  const resolvedMode = mode === "inherit"
    ? parentTheme.mode ?? autoMode
    : mode === "auto"
      ? autoMode
      : mode
  const resolvedTheme = theme === "inherit" ? parentTheme.theme : theme
  const resolvedPopover = popover === "inherit" ? parentTheme.popover : popover
  const shouldProjectTheme = Boolean(
    resolvedTheme && (theme !== "inherit" || mode !== "inherit")
  )
  const themeMode = resolvedTheme ? `${resolvedTheme}-${resolvedMode}` : undefined
  const effectMode = effect === "auto" ? resolvedMode : effect
  const tokenModes = [
    mode === "inherit" ? null : `workbench-semantic-color=${resolvedMode}`,
    radius === "inherit" ? null : `workbench-semantic-radius=${radius}`,
    spacing === "inherit" ? null : `workbench-semantic-spacing=${spacing}`,
    typography === "inherit" ? null : `workbench-semantic-typography=${typography}`,
    effect === "inherit" ? null : `workbench-semantic-effect=${effectMode}`,
    mode === "inherit" ? null : `tailwind-theme=${resolvedMode}`,
  ].filter((entry): entry is string => Boolean(entry)).join(";")
  const themeContextValue = useMemo(
    () => ({
      mode: resolvedMode,
      popover: resolvedPopover,
      theme: resolvedTheme,
    }),
    [resolvedMode, resolvedPopover, resolvedTheme]
  )
  const resolvedStyle = mode === "inherit"
    ? style
    : {
        ...style,
        colorScheme: resolvedMode,
      } satisfies CSSProperties

  return (
    <Component
      data-slot="theme"
      data-theme={mode !== "inherit" || shouldProjectTheme ? resolvedMode : undefined}
      data-shadcn-popover={popover === "inherit" ? undefined : popover}
      data-shadcn-radius={radius === "inherit" ? undefined : radius}
      data-shadcn-theme={shouldProjectTheme ? resolvedTheme : undefined}
      data-shadcn-theme-mode-source={mode}
      data-shadcn-theme-mode={shouldProjectTheme ? themeMode : undefined}
      data-wb-token-modes={tokenModes || undefined}
      ref={handleRootRef}
      className={cn(
        "min-w-0 text-foreground",
        mode !== "inherit" && resolvedMode === "dark" && "dark",
        surfaceClasses[surface],
        className
      )}
      style={resolvedStyle}
      {...props}
    >
      <ThemeContext.Provider value={themeContextValue}>
        <WorkbenchPortalScopeProvider container={portalContainer}>
          {children}
        </WorkbenchPortalScopeProvider>
        <div
          aria-hidden="true"
          data-workbench-theme-portal-root="true"
          ref={handlePortalContainerRef}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 2147483647,
            overflow: "visible",
            pointerEvents: "none",
          }}
        />
      </ThemeContext.Provider>
    </Component>
  )
}

function useThemeFloatingLayerProps(): ThemeFloatingLayerProps {
  const { popover } = useContext(ThemeContext)

  return {
    "data-wb-floating-layer": "true",
    "data-wb-popover": popover,
  }
}

function getAutoThemeMode(scopeElement?: Element | null): ThemeResolvedMode {
  if (typeof document !== "undefined") {
    const scopedPreviewRoot = getClosestPreviewAppearanceRoot(scopeElement)
    const scopedThemeMode = getPreviewRootThemeMode(scopedPreviewRoot)

    if (scopedThemeMode) {
      return scopedThemeMode
    }

    if (scopedPreviewRoot) {
      return getSystemThemeMode()
    }

    const previewThemeMode = getThemeModeValue(
      document.documentElement.getAttribute("data-preview-theme")
    )

    if (previewThemeMode) {
      return previewThemeMode
    }

    if (document.documentElement.getAttribute("data-preview-theme") === "system") {
      return getSystemThemeMode()
    }

    const documentTheme = getThemeModeValue(
      document.documentElement.getAttribute("data-theme")
    )
    const bodyTheme = getThemeModeValue(document.body?.getAttribute("data-theme"))
    if (documentTheme) return documentTheme
    if (bodyTheme) return bodyTheme
    if (
      document.documentElement.classList.contains("dark") ||
      document.body?.classList.contains("dark")
    ) {
      return "dark"
    }
  }

  return getSystemThemeMode()
}

function getClosestPreviewAppearanceRoot(element?: Element | null) {
  return (
    element?.closest<HTMLElement>("[data-wb-preview-appearance]") ?? null
  )
}

function getPreviewRootThemeMode(root: HTMLElement | null) {
  if (!root) return null

  const previewAppearance = getThemeModeValue(
    root.getAttribute("data-wb-preview-appearance")
  )

  if (previewAppearance) {
    return previewAppearance
  }

  return getThemeModeValue(root.getAttribute("data-theme"))
}

function getThemeModeValue(value: string | null | undefined) {
  return value === "dark" || value === "light" ? value : null
}

function getSystemThemeMode(): ThemeResolvedMode {
  if (typeof window !== "undefined") {
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light"
  }

  return "light"
}

export {
  Theme,
  type ThemeElement,
  type ThemeEffect,
  useThemeFloatingLayerProps,
  type ThemeMode,
  type ThemeName,
  type ThemePopover,
  type ThemeProps,
  type ThemeRadius,
  type ThemeSpacing,
  type ThemeSurface,
  type ThemeTypography,
}
