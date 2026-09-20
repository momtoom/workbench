import * as React from "react"

import { cn } from "@/lib/utils"
import { isWorkbenchElementOfTypes } from "@/components/ui/workbench-runtime"
import { Button } from "@/components/ui/button"
import { RiArrowLeftSLine, RiArrowRightSLine, RiMoreLine } from "@remixicon/react"

function Pagination({
  children,
  className,
  ...props
}: React.ComponentProps<"nav">) {
  const simpleModeChildren = getPaginationSimpleModeChildren(children)

  return (
    <nav
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    >
      {simpleModeChildren ? (
        <PaginationContent>{renderPaginationSimpleModeChildren(simpleModeChildren)}</PaginationContent>
      ) : children}
    </nav>
  )
}

function PaginationContent({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("flex items-center gap-1.5", className)}
      {...props}
    />
  )
}

function PaginationItem({ ...props }: React.ComponentProps<"li">) {
  return <li data-slot="pagination-item" {...props} />
}

type PaginationLinkProps = {
  isActive?: boolean
} & Pick<React.ComponentProps<typeof Button>, "size"> &
  React.ComponentProps<"a">

function PaginationLink({
  className,
  isActive,
  size = "icon",
  ...props
}: PaginationLinkProps) {
  return (
    <Button
      variant={isActive ? "outline" : "ghost"}
      size={size}
      className={cn(className)}
      nativeButton={false}
      render={
        <a
          aria-current={isActive ? "page" : undefined}
          data-slot="pagination-link"
          data-active={isActive}
          {...props}
        />
      }
    />
  )
}

function PaginationPrevious({
  className,
  size = "default",
  text = "Previous",
  ...props
}: React.ComponentProps<typeof PaginationLink> & { text?: string }) {
  return (
    <PaginationLink
      aria-label="Go to previous page"
      size={size}
      className={cn("pl-1.5!", className)}
      {...props}
    >
      <RiArrowLeftSLine data-icon="inline-start" />
      <span className="hidden sm:block">{text}</span>
    </PaginationLink>
  )
}

function PaginationNext({
  className,
  size = "default",
  text = "Next",
  ...props
}: React.ComponentProps<typeof PaginationLink> & { text?: string }) {
  return (
    <PaginationLink
      aria-label="Go to next page"
      size={size}
      className={cn("pr-1.5!", className)}
      {...props}
    >
      <span className="hidden sm:block">{text}</span>
      <RiArrowRightSLine data-icon="inline-end" />
    </PaginationLink>
  )
}

function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn(
        "flex size-8 items-center justify-center [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <RiMoreLine
      />
      <span className="sr-only">More pages</span>
    </span>
  )
}

const PAGINATION_SIMPLE_MODE_CHILD_TYPES = new Set<React.ElementType>([
  PaginationItem,
  PaginationPrevious,
  PaginationLink,
  PaginationNext,
  PaginationEllipsis,
])

const PAGINATION_DIRECT_ITEM_CHILD_TYPES = new Set<React.ElementType>([
  PaginationPrevious,
  PaginationLink,
  PaginationNext,
  PaginationEllipsis,
])

function getPaginationSimpleModeChildren(children: React.ReactNode): React.ReactNode[] | null {
  const childArray = React.Children.toArray(children).filter(isMeaningfulPaginationChild)
  if (childArray.length === 0) return null
  if (!childArray.every(isPaginationSimpleModeElement)) return null
  return childArray
}

function renderPaginationSimpleModeChildren(children: React.ReactNode[]): React.ReactNode[] {
  return children.map((child, index) => {
    if (isPaginationDirectItemChild(child)) {
      return <PaginationItem key={`pagination-item-${index}`}>{child}</PaginationItem>
    }
    return child
  })
}

function isMeaningfulPaginationChild(child: React.ReactNode): boolean {
  return !(typeof child === "string" && child.trim() === "")
}

function isPaginationSimpleModeElement(child: React.ReactNode): child is React.ReactElement {
  return isWorkbenchElementOfTypes(child, PAGINATION_SIMPLE_MODE_CHILD_TYPES)
}

function isPaginationDirectItemChild(child: React.ReactNode): child is React.ReactElement {
  return isWorkbenchElementOfTypes(child, PAGINATION_DIRECT_ITEM_CHILD_TYPES)
}

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
}
