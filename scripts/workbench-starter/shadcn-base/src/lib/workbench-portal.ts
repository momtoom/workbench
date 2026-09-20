import * as React from "react"

const WORKBENCH_PORTAL_ROOT_SELECTOR = '[data-workbench-portal-root="true"]'

type WorkbenchPortalRuntimeGlobal = typeof globalThis & {
  __WORKBENCH_PORTAL_SCOPE_CONTEXT__?: React.Context<HTMLElement | null | undefined>
}

type WorkbenchPortalContainer = HTMLElement | null | undefined

const WorkbenchPortalScopeContext =
  (globalThis as WorkbenchPortalRuntimeGlobal).__WORKBENCH_PORTAL_SCOPE_CONTEXT__ ??
  React.createContext<HTMLElement | null | undefined>(undefined)

export function WorkbenchPortalScopeProvider({
  children,
  container,
}: {
  children: React.ReactNode
  container: HTMLElement | null
}) {
  return React.createElement(
    WorkbenchPortalScopeContext.Provider,
    { value: container },
    children
  )
}

export function useWorkbenchScopedPortalContainer(): WorkbenchPortalContainer {
  return React.useContext(WorkbenchPortalScopeContext)
}

export function useWorkbenchPortalContainer(): WorkbenchPortalContainer {
  const scopedPortalContainer = useWorkbenchScopedPortalContainer()
  const [portalContainer, setPortalContainer] =
    React.useState<WorkbenchPortalContainer>(() => resolveWorkbenchPortalContainer())

  React.useLayoutEffect(() => {
    if (scopedPortalContainer === undefined) {
      setPortalContainer(resolveWorkbenchPortalContainer())
    }
  }, [scopedPortalContainer])

  return scopedPortalContainer === undefined ? portalContainer : scopedPortalContainer
}

export function getWorkbenchPortalContainer(): HTMLElement | undefined {
  if (typeof document === "undefined") return undefined

  const localRoot = queryWorkbenchPortalRoot(document)
  if (localRoot) return localRoot

  if (isPagePreviewRuntimeDocument()) return undefined

  const activeFrameRoot = queryWorkbenchPortalRootInFrame(document.activeElement)
  if (activeFrameRoot) return activeFrameRoot

  const frameRoots = Array.from(document.querySelectorAll("iframe"))
    .map((frame) => ({
      frame,
      root: queryWorkbenchPortalRootInFrame(frame),
      area: getFrameArea(frame),
      hasFocusedContent: hasFocusedContent(frame),
    }))
    .filter((entry): entry is {
      frame: HTMLIFrameElement
      root: HTMLElement
      area: number
      hasFocusedContent: boolean
    } => Boolean(entry.root) && entry.area > 0)
    .sort((left, right) => {
      if (left.hasFocusedContent !== right.hasFocusedContent) {
        return left.hasFocusedContent ? -1 : 1
      }
      return right.area - left.area
    })

  return frameRoots[0]?.root
}

function resolveWorkbenchPortalContainer(): WorkbenchPortalContainer {
  const container = getWorkbenchPortalContainer()
  if (container) return container
  return isPagePreviewRuntimeDocument() ? null : undefined
}

function isPagePreviewRuntimeDocument(): boolean {
  return (
    typeof document !== "undefined" &&
    document.documentElement.hasAttribute("data-page-preview-runtime")
  )
}

function queryWorkbenchPortalRoot(targetDocument: Document | null | undefined): HTMLElement | undefined {
  return targetDocument?.querySelector<HTMLElement>(WORKBENCH_PORTAL_ROOT_SELECTOR) ?? undefined
}

function queryWorkbenchPortalRootInFrame(element: Element | null): HTMLElement | undefined {
  if (!(element instanceof HTMLIFrameElement)) return undefined
  try {
    return queryWorkbenchPortalRoot(element.contentDocument)
  } catch {
    return undefined
  }
}

function getFrameArea(frame: HTMLIFrameElement): number {
  const rect = frame.getBoundingClientRect()
  if (rect.width <= 0 || rect.height <= 0) return 0
  if (rect.bottom <= 0 || rect.right <= 0) return 0
  if (rect.top >= window.innerHeight || rect.left >= window.innerWidth) return 0
  return rect.width * rect.height
}

function hasFocusedContent(frame: HTMLIFrameElement): boolean {
  try {
    const frameDocument = frame.contentDocument
    const activeElement = frameDocument?.activeElement
    return Boolean(
      activeElement &&
        activeElement !== frameDocument?.body &&
        activeElement !== frameDocument?.documentElement,
    )
  } catch {
    return false
  }
}
