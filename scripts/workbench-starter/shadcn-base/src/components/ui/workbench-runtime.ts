import * as React from "react"

const WORKBENCH_SOURCE_COMPONENT_NAME_PROP = "data-wb-source-component-name"

type WorkbenchSourceComponentProps = {
  [WORKBENCH_SOURCE_COMPONENT_NAME_PROP]?: unknown
}

export function splitWorkbenchRuntimeRootProps<T extends Record<string, unknown>>(props: T): {
  componentProps: Omit<T, `data-wb-${string}`>
  runtimeRootProps: Record<`data-wb-${string}`, unknown>
} {
  const componentProps: Record<string, unknown> = {}
  const runtimeRootProps: Record<string, unknown> = {}

  for (const [name, value] of Object.entries(props)) {
    if (name.startsWith("data-wb-")) runtimeRootProps[name] = value
    else componentProps[name] = value
  }

  return {
    componentProps: componentProps as Omit<T, `data-wb-${string}`>,
    runtimeRootProps: runtimeRootProps as Record<`data-wb-${string}`, unknown>,
  }
}

type NamedElementType = React.ElementType & {
  displayName?: string
  name?: string
}

export function isWorkbenchElementOfType<P>(
  child: React.ReactNode,
  componentType: React.ElementType<P>,
  componentName?: string
): child is React.ReactElement<P> {
  if (!React.isValidElement(child)) return false
  if (child.type === componentType) return true

  const sourceName = getWorkbenchElementSourceComponentName(child)
  if (!sourceName) return false

  return sourceName === (componentName ?? getWorkbenchComponentTypeName(componentType))
}

export function isWorkbenchElementOfTypes(
  child: React.ReactNode,
  componentTypes: ReadonlySet<React.ElementType>,
  componentNames?: ReadonlySet<string>
): child is React.ReactElement {
  if (!React.isValidElement(child)) return false
  if (componentTypes.has(child.type as React.ElementType)) return true

  const sourceName = getWorkbenchElementSourceComponentName(child)
  if (!sourceName) return false
  if (componentNames?.has(sourceName)) return true

  for (const componentType of componentTypes) {
    if (sourceName === getWorkbenchComponentTypeName(componentType)) return true
  }

  return false
}

function getWorkbenchElementSourceComponentName(child: React.ReactElement): string | null {
  const props = child.props as WorkbenchSourceComponentProps
  const sourceName = props[WORKBENCH_SOURCE_COMPONENT_NAME_PROP]
  if (typeof sourceName === "string" && sourceName.trim()) return sourceName

  return getWorkbenchComponentTypeName(child.type as React.ElementType)
}

function getWorkbenchComponentTypeName(componentType: React.ElementType): string | null {
  if (typeof componentType === "string") return componentType

  const namedType = componentType as NamedElementType
  if (typeof namedType.displayName === "string" && namedType.displayName) {
    return namedType.displayName
  }
  if (typeof namedType.name === "string" && namedType.name) {
    return namedType.name
  }

  return null
}
