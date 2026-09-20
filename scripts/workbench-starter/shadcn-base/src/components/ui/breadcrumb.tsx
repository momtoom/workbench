import * as React from "react"
import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"

import "./breadcrumb.css"
import { cn } from "@/lib/utils"
import { isWorkbenchElementOfTypes } from "@/components/ui/workbench-runtime"

type BreadcrumbSeparatorKind = "chevron" | "slash" | "dot"

type BreadcrumbProps = React.ComponentProps<"nav"> & {
  ariaLabel?: string
  separator?: BreadcrumbSeparatorKind
  showEllipsis?: boolean
}

function Breadcrumb({
  ariaLabel = "Breadcrumb",
  children,
  className,
  separator = "chevron",
  showEllipsis = false,
  ...props
}: BreadcrumbProps) {
  const childCount = React.Children.count(children)
  const directChildren = childCount > 0 ? getBreadcrumbDirectChildren(children) : getDefaultBreadcrumbChildren()
  const navAriaLabel = props["aria-label"] ?? ariaLabel

  return (
    <nav
      aria-label={navAriaLabel}
      data-slot="breadcrumb"
      className={cn("wb-breadcrumb", className)}
      {...props}
    >
      {directChildren ? (
        <BreadcrumbList>
          {renderBreadcrumbDirectChildren(directChildren, { separator, showEllipsis })}
        </BreadcrumbList>
      ) : children}
    </nav>
  )
}

function BreadcrumbList({ className, ...props }: React.ComponentProps<"ol">) {
  return (
    <ol
      data-slot="breadcrumb-list"
      className={cn("wb-breadcrumb-list", className)}
      {...props}
    />
  )
}

function BreadcrumbItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-item"
      className={cn("wb-breadcrumb-item", className)}
      {...props}
    />
  )
}

function BreadcrumbLinkRoot({
  className,
  render,
  ...props
}: useRender.ComponentProps<"a">) {
  return useRender({
    defaultTagName: "a",
    props: mergeProps<"a">(
      {
        "data-slot": "breadcrumb-link",
        className: cn("wb-breadcrumb-link", className),
      } as useRender.ComponentProps<"a">,
      props
    ),
    render,
    state: {
      slot: "breadcrumb-link",
    },
  })
}

function BreadcrumbLink(props: React.ComponentProps<typeof BreadcrumbLinkRoot>) {
  return <BreadcrumbLinkRoot {...props} />
}

function BreadcrumbPage({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="breadcrumb-page"
      role="link"
      aria-disabled="true"
      aria-current="page"
      className={cn("wb-breadcrumb-page", className)}
      {...props}
    />
  )
}

function BreadcrumbSeparator({
  children,
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-separator"
      role="presentation"
      aria-hidden="true"
      className={cn("wb-breadcrumb-separator", className)}
      {...props}
    >
      {children ?? (
        <BreadcrumbSeparatorIcon />
      )}
    </li>
  )
}

function BreadcrumbEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="breadcrumb-ellipsis"
      role="presentation"
      aria-hidden="true"
      className={cn("wb-breadcrumb-ellipsis", className)}
      {...props}
    >
      <BreadcrumbEllipsisIcon />
      <span className="sr-only">More</span>
    </span>
  )
}

function BreadcrumbSeparatorIcon() {
  return (
    <svg
      aria-hidden="true"
      className="wb-breadcrumb-separator-icon"
      data-slot="breadcrumb-separator-icon"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

function BreadcrumbEllipsisIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="5" cy="12" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="19" cy="12" r="1.5" />
    </svg>
  )
}

type BreadcrumbRenderOptions = {
  separator: BreadcrumbSeparatorKind
  showEllipsis: boolean
}

function getDefaultBreadcrumbChildren(): React.ReactNode[] {
  return [
    <BreadcrumbLink key="home" href="#">Home</BreadcrumbLink>,
    <BreadcrumbLink key="parent" href="#">Parent</BreadcrumbLink>,
    <BreadcrumbPage key="current">Current page</BreadcrumbPage>,
  ]
}

function getBreadcrumbDirectChildren(children: React.ReactNode): React.ReactNode[] | null {
  const childArray = React.Children.toArray(children).filter(isMeaningfulBreadcrumbChild)
  if (childArray.length === 0) return null
  if (!childArray.every(isBreadcrumbDirectElement)) return null
  return childArray
}

function renderBreadcrumbDirectChildren(
  children: React.ReactNode[],
  {
    separator,
    showEllipsis,
  }: BreadcrumbRenderOptions,
): React.ReactNode[] {
  const renderedChildren = showEllipsis && children.length > 2
    ? [
        children[0],
        <BreadcrumbEllipsis key="breadcrumb-ellipsis" />,
        children[children.length - 1],
      ]
    : children
  const separatorNode = renderBreadcrumbSeparatorByKind(separator)

  return renderedChildren.flatMap((child, index) => {
    const item = <BreadcrumbItem key={`breadcrumb-item-${index}`}>{child}</BreadcrumbItem>
    if (index === 0) return [item]
    return [
      <BreadcrumbSeparator key={`breadcrumb-separator-${index}`}>{separatorNode}</BreadcrumbSeparator>,
      item,
    ]
  })
}

function renderBreadcrumbSeparatorByKind(separator: BreadcrumbSeparatorKind): React.ReactNode {
  if (separator === "slash") return <span className="wb-breadcrumb-separator-text">/</span>
  if (separator === "dot") return <span className="wb-breadcrumb-separator-dot" />
  return undefined
}

const BREADCRUMB_DIRECT_CHILD_TYPES = new Set<React.ElementType>([
  BreadcrumbLink,
  BreadcrumbPage,
])

function isMeaningfulBreadcrumbChild(child: React.ReactNode): boolean {
  return !(typeof child === "string" && child.trim() === "")
}

function isBreadcrumbDirectElement(child: React.ReactNode): child is React.ReactElement {
  return isWorkbenchElementOfTypes(child, BREADCRUMB_DIRECT_CHILD_TYPES)
}

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
}
