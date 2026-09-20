"use client"

import * as React from "react"
import { AlertDialog as AlertDialogPrimitive } from "@base-ui/react/alert-dialog"

import { cn } from "@/lib/utils"
import {
  isWorkbenchElementOfType,
  isWorkbenchElementOfTypes,
  splitWorkbenchRuntimeRootProps,
} from "@/components/ui/workbench-runtime"
import { useWorkbenchPortalContainer } from "@/lib/workbench-portal"
import { Button } from "@/components/ui/button"

const AlertDialogRootContext = React.createContext(false)
type AlertDialogSize = "default" | "sm"
const AlertDialogContentSizeContext = React.createContext<AlertDialogSize>("default")
const AlertDialogHeaderMediaContext = React.createContext(false)

type AlertDialogProps = Omit<AlertDialogPrimitive.Root.Props, "children"> & {
  actionText?: React.ReactNode
  cancelText?: React.ReactNode
  children?: React.ReactNode
  contentClassName?: string
  description?: React.ReactNode
  footerClassName?: string
  media?: React.ReactNode
  showAction?: boolean
  showCancel?: boolean
  showMedia?: boolean
  showTrigger?: boolean
  size?: AlertDialogSize
  title?: React.ReactNode
  trigger?: React.ReactNode
  triggerClassName?: string
}

function AlertDialog({
  actionText = "Continue",
  cancelText = "Cancel",
  children,
  contentClassName,
  description = "This action cannot be undone. This will permanently delete your account from our servers.",
  footerClassName,
  media = "!",
  showAction = true,
  showCancel = true,
  showMedia = false,
  showTrigger = false,
  size = "default",
  title = "Are you absolutely sure?",
  trigger = "Open alert dialog",
  triggerClassName,
  ...props
}: AlertDialogProps) {
  const footerChildren = getAlertDialogFooterChildren(children)
  const compoundModeChildren = footerChildren.some(isAlertDialogCompoundModeElement)
  const { componentProps, runtimeRootProps } = splitWorkbenchRuntimeRootProps(
    props as Record<string, unknown>
  )

  return (
    <AlertDialogRootContext.Provider value={true}>
      <AlertDialogPrimitive.Root data-slot="alert-dialog" {...componentProps}>
        {compoundModeChildren ? children : (
          <>
            {showTrigger ? (
              <AlertDialogTrigger
                className={triggerClassName}
                variant="outline"
                {...runtimeRootProps}
              >
                {trigger}
              </AlertDialogTrigger>
            ) : null}
            <AlertDialogContent className={contentClassName} size={size}>
              <AlertDialogHeader>
                {showMedia ? <AlertDialogMedia>{media}</AlertDialogMedia> : null}
                <AlertDialogTitle>{title}</AlertDialogTitle>
                {description ? <AlertDialogDescription>{description}</AlertDialogDescription> : null}
              </AlertDialogHeader>
              {renderAlertDialogFooter({
                actionText,
                cancelText,
                children: footerChildren,
                className: footerClassName,
                showAction,
                showCancel,
              })}
            </AlertDialogContent>
          </>
        )}
      </AlertDialogPrimitive.Root>
    </AlertDialogRootContext.Provider>
  )
}

type AlertDialogTriggerProps = AlertDialogPrimitive.Trigger.Props &
  Pick<React.ComponentProps<typeof Button>, "variant" | "size">

function AlertDialogTrigger({
  render,
  variant = "outline",
  size = "default",
  ...props
}: AlertDialogTriggerProps) {
  return (
    <AlertDialogPrimitive.Trigger
      data-slot="alert-dialog-trigger"
      render={render ?? <Button variant={variant} size={size} />}
      {...props}
    />
  )
}

function AlertDialogPortal({ container, ...props }: AlertDialogPrimitive.Portal.Props) {
  const workbenchPortalContainer = useWorkbenchPortalContainer()
  return (
    <AlertDialogPrimitive.Portal
      data-slot="alert-dialog-portal"
      container={container === undefined ? workbenchPortalContainer : container}
      {...props}
    />
  )
}

function AlertDialogOverlay({
  className,
  ...props
}: AlertDialogPrimitive.Backdrop.Props) {
  return (
    <AlertDialogPrimitive.Backdrop
      data-slot="alert-dialog-overlay"
      className={cn(
        "fixed inset-0 isolate z-50 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props}
    />
  )
}

function AlertDialogContent({
  className,
  size = "default",
  style,
  ...props
}: AlertDialogPrimitive.Popup.Props & {
  size?: AlertDialogSize
}) {
  const contentStyle = {
    maxWidth: size === "sm" ? "min(calc(100% - 2rem), 20rem)" : "min(calc(100% - 2rem), 24rem)",
    ...style,
  }

  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogContentSizeContext.Provider value={size}>
        <AlertDialogPrimitive.Popup
          data-slot="alert-dialog-content"
          data-size={size}
          className={cn(
            "group/alert-dialog-content fixed top-1/2 left-1/2 z-50 grid w-full -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl bg-popover p-4 text-sm text-popover-foreground ring-1 ring-foreground/10 duration-100 outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className
          )}
          style={contentStyle}
          {...props}
        />
      </AlertDialogContentSizeContext.Provider>
    </AlertDialogPortal>
  )
}

function AlertDialogHeader({
  className,
  children,
  style,
  ...props
}: React.ComponentProps<"div">) {
  const contentSize = React.useContext(AlertDialogContentSizeContext)
  const hasMedia = React.Children.toArray(children).some(isAlertDialogMediaElement)
  const usesDefaultMediaGrid = contentSize === "default" && hasMedia
  const headerStyle = usesDefaultMediaGrid
    ? {
        gridTemplateColumns: "auto minmax(0, 1fr)",
        gridTemplateRows: "auto auto",
        justifyItems: "start",
        ...style,
      }
    : style

  return (
    <AlertDialogHeaderMediaContext.Provider value={hasMedia}>
      <div
        data-slot="alert-dialog-header"
        className={cn(
          "grid gap-1.5",
          contentSize === "sm"
            ? "place-items-center text-center"
            : usesDefaultMediaGrid
              ? "items-start gap-x-4 text-left"
              : "items-start text-left",
          className
        )}
        style={headerStyle}
        {...props}
      >
        {children}
      </div>
    </AlertDialogHeaderMediaContext.Provider>
  )
}

function AlertDialogFooter({
  className,
  style,
  ...props
}: React.ComponentProps<"div">) {
  const contentSize = React.useContext(AlertDialogContentSizeContext)

  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn(
        "-mx-4 -mb-4 flex gap-2 rounded-b-xl border-t bg-muted/50 p-4",
        contentSize === "sm"
          ? "flex-row justify-end"
          : "flex-col-reverse sm:flex-row sm:justify-end",
        "[&>*]:min-w-20",
        className
      )}
      style={style}
      {...props}
    />
  )
}

function AlertDialogMedia({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const contentSize = React.useContext(AlertDialogContentSizeContext)

  return (
    <div
      data-slot="alert-dialog-media"
      className={cn(
        "inline-flex size-10 items-center justify-center rounded-md bg-muted *:[svg:not([class*='size-'])]:size-6",
        contentSize === "sm" ? "mb-3" : "row-span-2 row-start-1",
        className
      )}
      {...props}
    />
  )
}

function AlertDialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Title>) {
  const hasAlertDialogRoot = React.useContext(AlertDialogRootContext)
  const hasHeaderMedia = React.useContext(AlertDialogHeaderMediaContext)
  const contentSize = React.useContext(AlertDialogContentSizeContext)
  const usesDefaultMediaGrid = hasHeaderMedia && contentSize === "default"
  if (!hasAlertDialogRoot) {
    return (
      <h2
        data-slot="alert-dialog-title"
        className={cn(
          "font-heading text-base leading-none font-medium",
          usesDefaultMediaGrid ? "col-start-2" : null,
          className
        )}
        {...(props as React.ComponentProps<"h2">)}
      />
    )
  }

  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      className={cn(
        "font-heading text-base leading-none font-medium",
        usesDefaultMediaGrid ? "col-start-2" : null,
        className
      )}
      {...props}
    />
  )
}

function AlertDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Description>) {
  const hasAlertDialogRoot = React.useContext(AlertDialogRootContext)
  const hasHeaderMedia = React.useContext(AlertDialogHeaderMediaContext)
  const contentSize = React.useContext(AlertDialogContentSizeContext)
  const usesDefaultMediaGrid = hasHeaderMedia && contentSize === "default"
  if (!hasAlertDialogRoot) {
    return (
      <p
        data-slot="alert-dialog-description"
        className={cn(
          "text-sm text-balance text-muted-foreground md:text-pretty *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
          usesDefaultMediaGrid ? "col-start-2" : null,
          className
        )}
        {...(props as React.ComponentProps<"p">)}
      />
    )
  }

  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      className={cn(
        "text-sm text-balance text-muted-foreground md:text-pretty *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
        usesDefaultMediaGrid ? "col-start-2" : null,
        className
      )}
      {...props}
    />
  )
}

function AlertDialogAction({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      data-slot="alert-dialog-action"
      className={cn(className)}
      {...props}
    />
  )
}

function AlertDialogCancel({
  className,
  variant = "outline",
  size = "default",
  ...props
}: AlertDialogPrimitive.Close.Props &
  Pick<React.ComponentProps<typeof Button>, "variant" | "size">) {
  return (
    <AlertDialogPrimitive.Close
      data-slot="alert-dialog-cancel"
      className={cn(className)}
      render={<Button variant={variant} size={size} />}
      {...props}
    />
  )
}

const ALERT_DIALOG_COMPOUND_CHILD_TYPES = new Set<React.ElementType>([
  AlertDialogTrigger,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogContent,
])

function getAlertDialogFooterChildren(children: React.ReactNode): React.ReactNode[] {
  const childArray = React.Children.toArray(children).filter(isMeaningfulAlertDialogChild)
  return childArray
}

function renderAlertDialogFooter({
  actionText,
  cancelText,
  children,
  className,
  showAction,
  showCancel,
}: {
  actionText: React.ReactNode
  cancelText: React.ReactNode
  children: React.ReactNode[]
  className?: string
  showAction: boolean
  showCancel: boolean
}) {
  if (children.length === 1 && isWorkbenchElementOfType(children[0], AlertDialogFooter, "AlertDialogFooter")) {
    return React.cloneElement(children[0], {
      className: cn(className, (children[0].props as { className?: string }).className),
    } as React.ComponentProps<typeof AlertDialogFooter>)
  }

  const footerChildren = children.length > 0 ? children : (
    <>
      {showCancel ? <AlertDialogCancel>{cancelText}</AlertDialogCancel> : null}
      {showAction ? <AlertDialogAction>{actionText}</AlertDialogAction> : null}
    </>
  )

  if (!footerChildren) return null
  return <AlertDialogFooter className={className}>{footerChildren}</AlertDialogFooter>
}

function isMeaningfulAlertDialogChild(child: React.ReactNode): boolean {
  return !(typeof child === "string" && child.trim() === "")
}

function isAlertDialogCompoundModeElement(child: React.ReactNode): boolean {
  return isWorkbenchElementOfTypes(child, ALERT_DIALOG_COMPOUND_CHILD_TYPES)
}

function isAlertDialogMediaElement(child: React.ReactNode): boolean {
  return isWorkbenchElementOfType(child, AlertDialogMedia, "AlertDialogMedia")
}

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
}
