import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"

import { cn } from "@/lib/utils"
import {
  isWorkbenchElementOfType,
  isWorkbenchElementOfTypes,
  splitWorkbenchRuntimeRootProps,
} from "@/components/ui/workbench-runtime"
import { useWorkbenchPortalContainer } from "@/lib/workbench-portal"
import { Button } from "@/components/ui/button"
import { RiCloseLine } from "@remixicon/react"

const DialogRootContext = React.createContext(false)
type DialogSize = "default" | "sm"
const DialogContentSizeContext = React.createContext<DialogSize>("default")
const DialogHeaderMediaContext = React.createContext(false)

type DialogProps = Omit<DialogPrimitive.Root.Props, "children"> & {
  actionText?: React.ReactNode
  cancelText?: React.ReactNode
  children?: React.ReactNode
  contentClassName?: string
  description?: React.ReactNode
  footerClassName?: string
  showAction?: boolean
  showCancel?: boolean
  showCloseButton?: boolean
  showFooter?: boolean
  showTrigger?: boolean
  size?: DialogSize
  title?: React.ReactNode
  trigger?: React.ReactNode
  triggerClassName?: string
}

function Dialog({
  actionText = "Save changes",
  cancelText = "Cancel",
  children,
  contentClassName,
  description = "Make changes to this dialog and confirm when you are ready.",
  footerClassName,
  modal,
  showAction = true,
  showCancel = true,
  showCloseButton = false,
  showFooter = true,
  showTrigger = false,
  size = "default",
  title = "Dialog title",
  trigger = "Open dialog",
  triggerClassName,
  ...props
}: DialogProps) {
  const workbenchPortalContainer = useWorkbenchPortalContainer()
  const footerChildren = getDialogFooterChildren(children)
  const compoundModeChildren = footerChildren.some(isDialogCompoundModeElement)
  const { componentProps, runtimeRootProps } = splitWorkbenchRuntimeRootProps(
    props as Record<string, unknown>
  )

  return (
    <DialogRootContext.Provider value={true}>
      <DialogPrimitive.Root
        data-slot="dialog"
        modal={modal === undefined && workbenchPortalContainer ? "trap-focus" : modal}
        {...componentProps}
      >
        {compoundModeChildren ? children : (
          <>
            {showTrigger ? (
              <DialogTrigger
                className={triggerClassName}
                variant="outline"
                {...runtimeRootProps}
              >
                {trigger}
              </DialogTrigger>
            ) : null}
            <DialogContent
              className={contentClassName}
              size={size}
              showCloseButton={showCloseButton}
            >
              <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
                {description ? <DialogDescription>{description}</DialogDescription> : null}
              </DialogHeader>
              {showFooter ? renderDialogFooter({
                actionText,
                cancelText,
                children: footerChildren,
                className: footerClassName,
                showAction,
                showCancel,
              }) : null}
            </DialogContent>
          </>
        )}
      </DialogPrimitive.Root>
    </DialogRootContext.Provider>
  )
}

type DialogTriggerProps = DialogPrimitive.Trigger.Props &
  Pick<React.ComponentProps<typeof Button>, "variant" | "size">

function DialogTrigger({
  render,
  variant = "outline",
  size = "default",
  ...props
}: DialogTriggerProps) {
  return (
    <DialogPrimitive.Trigger
      data-slot="dialog-trigger"
      render={render ?? <Button variant={variant} size={size} />}
      {...props}
    />
  )
}

function DialogPortal({ container, ...props }: DialogPrimitive.Portal.Props) {
  const workbenchPortalContainer = useWorkbenchPortalContainer()
  return (
    <DialogPrimitive.Portal
      data-slot="dialog-portal"
      container={container === undefined ? workbenchPortalContainer : container}
      {...props}
    />
  )
}

function DialogClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogAction({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      data-slot="dialog-action"
      className={cn(className)}
      {...props}
    />
  )
}

function DialogCancel({
  className,
  variant = "outline",
  size = "default",
  ...props
}: DialogPrimitive.Close.Props &
  Pick<React.ComponentProps<typeof Button>, "variant" | "size">) {
  return (
    <DialogPrimitive.Close
      data-slot="dialog-cancel"
      className={cn(className)}
      render={<Button variant={variant} size={size} />}
      {...props}
    />
  )
}

function DialogOverlay({
  className,
  ...props
}: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 isolate z-50 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  size = "default",
  style,
  ...props
}: DialogPrimitive.Popup.Props & {
  showCloseButton?: boolean
  size?: DialogSize
}) {
  const contentStyle = {
    maxWidth: size === "sm" ? "min(calc(100% - 2rem), 20rem)" : "min(calc(100% - 2rem), 24rem)",
    ...style,
  }

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogContentSizeContext.Provider value={size}>
        <DialogPrimitive.Popup
          data-slot="dialog-content"
          data-size={size}
          className={cn(
            "fixed top-1/2 left-1/2 z-50 grid w-full -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl bg-popover p-4 text-sm text-popover-foreground ring-1 ring-foreground/10 duration-100 outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className
          )}
          style={contentStyle}
          {...props}
        >
          {children}
          {showCloseButton && (
            <DialogPrimitive.Close
              data-slot="dialog-close"
              render={
                <Button
                  variant="ghost"
                  className="absolute top-2 right-2"
                  size="icon-sm"
                />
              }
            >
              <RiCloseLine />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          )}
        </DialogPrimitive.Popup>
      </DialogContentSizeContext.Provider>
    </DialogPortal>
  )
}

function DialogHeader({
  className,
  children,
  style,
  ...props
}: React.ComponentProps<"div">) {
  const contentSize = React.useContext(DialogContentSizeContext)
  const hasMedia = React.Children.toArray(children).some(isDialogMediaElement)
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
    <DialogHeaderMediaContext.Provider value={hasMedia}>
      <div
        data-slot="dialog-header"
        className={cn(
          "grid gap-2",
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
    </DialogHeaderMediaContext.Provider>
  )
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean
}) {
  const contentSize = React.useContext(DialogContentSizeContext)

  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "-mx-4 -mb-4 flex gap-2 rounded-b-xl border-t bg-muted/50 p-4",
        contentSize === "sm"
          ? "flex-row justify-end"
          : "flex-col-reverse sm:flex-row sm:justify-end",
        "[&>*]:min-w-20",
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogCancel>Close</DialogCancel>
      )}
    </div>
  )
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  const hasDialogRoot = React.useContext(DialogRootContext)
  const hasHeaderMedia = React.useContext(DialogHeaderMediaContext)
  const contentSize = React.useContext(DialogContentSizeContext)
  const usesDefaultMediaGrid = hasHeaderMedia && contentSize === "default"
  if (!hasDialogRoot) {
    return (
      <h2
        data-slot="dialog-title"
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
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        "font-heading text-base leading-none font-medium",
        usesDefaultMediaGrid ? "col-start-2" : null,
        className
      )}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  const hasDialogRoot = React.useContext(DialogRootContext)
  const hasHeaderMedia = React.useContext(DialogHeaderMediaContext)
  const contentSize = React.useContext(DialogContentSizeContext)
  const usesDefaultMediaGrid = hasHeaderMedia && contentSize === "default"
  if (!hasDialogRoot) {
    return (
      <p
        data-slot="dialog-description"
        className={cn(
          "text-sm text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
          usesDefaultMediaGrid ? "col-start-2" : null,
          className
        )}
        {...(props as React.ComponentProps<"p">)}
      />
    )
  }

  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        "text-sm text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
        usesDefaultMediaGrid ? "col-start-2" : null,
        className
      )}
      {...props}
    />
  )
}

function DialogMedia({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const contentSize = React.useContext(DialogContentSizeContext)

  return (
    <div
      data-slot="dialog-media"
      className={cn(
        "inline-flex size-10 items-center justify-center rounded-md bg-muted *:[svg:not([class*='size-'])]:size-6",
        contentSize === "sm" ? "mb-3" : "row-span-2 row-start-1",
        className
      )}
      {...props}
    />
  )
}

type DialogPresetProps = Omit<
  React.ComponentProps<typeof DialogContent>,
  "children"
> & {
  children?: React.ReactNode
  description?: React.ReactNode
  footerClassName?: string
  headerClassName?: string
  media?: React.ReactNode
  mediaClassName?: string
  title?: React.ReactNode
}

function DialogPreset({
  children,
  description = "Make changes to this dialog and confirm when you are ready.",
  footerClassName,
  headerClassName,
  media,
  mediaClassName,
  showCloseButton = false,
  size = "default",
  title = "Dialog title",
  ...props
}: DialogPresetProps) {
  return (
    <DialogContent
      showCloseButton={showCloseButton}
      size={size}
      {...props}
    >
      <DialogHeader className={headerClassName}>
        {media ? <DialogMedia className={mediaClassName}>{media}</DialogMedia> : null}
        <DialogTitle>{title}</DialogTitle>
        {description ? <DialogDescription>{description}</DialogDescription> : null}
      </DialogHeader>
      {children ? <DialogFooter className={footerClassName}>{children}</DialogFooter> : null}
    </DialogContent>
  )
}

const DIALOG_COMPOUND_CHILD_TYPES = new Set<React.ElementType>([
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogPreset,
])

function getDialogFooterChildren(children: React.ReactNode): React.ReactNode[] {
  const childArray = React.Children.toArray(children).filter(isMeaningfulDialogChild)
  return childArray
}

function renderDialogFooter({
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
  if (children.length === 1 && isWorkbenchElementOfType(children[0], DialogFooter, "DialogFooter")) {
    return React.cloneElement(children[0], {
      className: cn(className, (children[0].props as { className?: string }).className),
    } as React.ComponentProps<typeof DialogFooter>)
  }

  const footerChildren = children.length > 0 ? children : (
    <>
      {showCancel ? <DialogCancel>{cancelText}</DialogCancel> : null}
      {showAction ? <DialogAction>{actionText}</DialogAction> : null}
    </>
  )

  if (!footerChildren) return null
  return <DialogFooter className={className}>{footerChildren}</DialogFooter>
}

function isMeaningfulDialogChild(child: React.ReactNode): boolean {
  return !(typeof child === "string" && child.trim() === "")
}

function isDialogCompoundModeElement(child: React.ReactNode): boolean {
  return isWorkbenchElementOfTypes(child, DIALOG_COMPOUND_CHILD_TYPES)
}

function isDialogMediaElement(child: React.ReactNode): boolean {
  return isWorkbenchElementOfType(child, DialogMedia, "DialogMedia")
}

export {
  Dialog,
  DialogAction,
  DialogCancel,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogMedia,
  DialogOverlay,
  DialogPortal,
  DialogPreset,
  DialogTitle,
  DialogTrigger,
}
