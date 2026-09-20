import * as React from "react"
import { isWorkbenchElementOfTypes } from "@/components/ui/workbench-runtime"
import { Collapsible as CollapsiblePrimitive } from "@base-ui/react/collapsible"

type CollapsibleProps = CollapsiblePrimitive.Root.Props & {
  contentClassName?: string
  trigger?: React.ReactNode
  triggerClassName?: string
}

function Collapsible({
  children,
  contentClassName,
  trigger = "Advanced details",
  triggerClassName,
  ...props
}: CollapsibleProps) {
  const simpleModeChildren = getCollapsibleSimpleModeChildren(children)
  const useSimpleMode = simpleModeChildren !== null || children == null

  return (
    <CollapsiblePrimitive.Root data-slot="collapsible" {...props}>
      {useSimpleMode ? (
        <>
          <CollapsibleTrigger className={triggerClassName}>
            {trigger}
          </CollapsibleTrigger>
          <CollapsibleContent className={contentClassName}>
            {simpleModeChildren}
          </CollapsibleContent>
        </>
      ) : children}
    </CollapsiblePrimitive.Root>
  )
}

function CollapsibleTrigger({ ...props }: CollapsiblePrimitive.Trigger.Props) {
  return (
    <CollapsiblePrimitive.Trigger data-slot="collapsible-trigger" {...props} />
  )
}

function CollapsibleContent({ ...props }: CollapsiblePrimitive.Panel.Props) {
  return (
    <CollapsiblePrimitive.Panel data-slot="collapsible-content" {...props} />
  )
}

const COLLAPSIBLE_COMPOUND_CHILD_TYPES = new Set<React.ElementType>([
  CollapsibleTrigger,
  CollapsibleContent,
])

function getCollapsibleSimpleModeChildren(children: React.ReactNode): React.ReactNode[] | null {
  const childArray = React.Children.toArray(children).filter(isMeaningfulCollapsibleChild)
  if (childArray.length === 0) return null
  if (childArray.some(isCollapsibleCompoundModeElement)) return null
  return childArray
}

function isMeaningfulCollapsibleChild(child: React.ReactNode): boolean {
  return !(typeof child === "string" && child.trim() === "")
}

function isCollapsibleCompoundModeElement(child: React.ReactNode): boolean {
  return isWorkbenchElementOfTypes(child, COLLAPSIBLE_COMPOUND_CHILD_TYPES)
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
