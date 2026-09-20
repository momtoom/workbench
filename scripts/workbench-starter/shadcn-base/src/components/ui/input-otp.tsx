import * as React from "react"
import { OTPInput, OTPInputContext } from "input-otp"

import { cn } from "@/lib/utils"
import { isWorkbenchElementOfType } from "@/components/ui/workbench-runtime"
import { RiSubtractLine } from "@remixicon/react"

type InputOTPProps = Omit<
  React.ComponentProps<typeof OTPInput>,
  "children" | "maxLength" | "render"
> & {
  children?: React.ReactNode
  containerClassName?: string
  maxLength?: number
}

function InputOTP({
  children,
  className,
  containerClassName,
  defaultValue,
  maxLength,
  onChange,
  value,
  ...props
}: InputOTPProps) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(
    typeof defaultValue === "string" ? defaultValue : ""
  )
  const arrangedChildren = arrangeInputOTPDigitGroups(children)
  const inferredMaxLength = getInputOTPChildrenMaxLength(arrangedChildren)
  const effectiveMaxLength = inferredMaxLength ??
    getSafeInputOTPMaxLength(maxLength) ??
    6
  const resolvedValue = value ?? uncontrolledValue

  function handleValueChange(nextValue: string) {
    if (value === undefined) setUncontrolledValue(nextValue)
    onChange?.(nextValue)
  }

  return (
    <OTPInput
      data-slot="input-otp"
      maxLength={effectiveMaxLength}
      containerClassName={cn(
        "cn-input-otp flex items-center has-disabled:opacity-50",
        containerClassName
      )}
      spellCheck={false}
      className={cn("disabled:cursor-not-allowed", className)}
      value={resolvedValue}
      onChange={handleValueChange}
      {...props}
    >
      {arrangedChildren}
    </OTPInput>
  )
}

function InputOTPGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-otp-group"
      className={cn(
        "flex items-center overflow-hidden rounded-lg border border-input bg-background divide-x divide-input has-aria-invalid:border-destructive has-aria-invalid:ring-3 has-aria-invalid:ring-destructive/20 dark:has-aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

type InputOTPDigitGroupProps = React.ComponentProps<"div"> & {
  count?: number
  start?: number
}

function InputOTPDigitGroup({
  children,
  count = 3,
  start = 0,
  ...props
}: InputOTPDigitGroupProps) {
  const safeCount = getSafeInputOTPSlotCount(count)
  const safeStart = getSafeInputOTPSlotStart(start)
  const authoredChildren = React.Children.toArray(children).filter(isMeaningfulInputOTPChild)

  return (
    <InputOTPGroup {...props}>
      {authoredChildren.length > 0 ? authoredChildren :
        Array.from({ length: safeCount }, (_, index) => (
          <InputOTPSlot key={index} index={safeStart + index} />
        ))}
    </InputOTPGroup>
  )
}

function isInputOTPDigitGroupElement(
  child: React.ReactNode
): child is React.ReactElement<InputOTPDigitGroupProps> {
  return isWorkbenchElementOfType(child, InputOTPDigitGroup, "InputOTPDigitGroup")
}

function arrangeInputOTPDigitGroups(children: React.ReactNode) {
  let nextIndex = 0

  return React.Children.map(children, (child) => {
    if (!isInputOTPDigitGroupElement(child)) return child

    const count = getSafeInputOTPSlotCount(child.props.count)
    const start =
      child.props.start == null ? nextIndex : getSafeInputOTPSlotStart(child.props.start)

    nextIndex = start + count
    return React.cloneElement(child, { count, start })
  })
}

function getInputOTPChildrenMaxLength(children: React.ReactNode) {
  let maxLength = 0

  React.Children.forEach(children, (child) => {
    if (isInputOTPDigitGroupElement(child)) {
      const count = getSafeInputOTPSlotCount(child.props.count)
      const start = getSafeInputOTPSlotStart(child.props.start)
      maxLength = Math.max(maxLength, start + count)
    }
  })

  return maxLength > 0 ? maxLength : null
}

function isMeaningfulInputOTPChild(child: React.ReactNode): boolean {
  return !(typeof child === "string" && child.trim() === "")
}

function getSafeInputOTPMaxLength(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(1, Math.min(12, Math.floor(value)))
    : null
}

function getSafeInputOTPSlotCount(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(1, Math.min(12, Math.floor(value)))
    : 3
}

function getSafeInputOTPSlotStart(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.floor(value))
    : 0
}

function InputOTPSlot({
  index,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  index: number
}) {
  const inputOTPContext = React.useContext(OTPInputContext)
  const { char, hasFakeCaret, isActive } = inputOTPContext?.slots[index] ?? {}

  return (
    <div
      data-slot="input-otp-slot"
      data-active={isActive}
      className={cn(
        "relative flex size-8 items-center justify-center rounded-none bg-transparent text-sm transition-all outline-none aria-invalid:border-destructive data-[active=true]:z-10 data-[active=true]:border-ring data-[active=true]:ring-2 data-[active=true]:ring-inset data-[active=true]:ring-ring/50 data-[active=true]:aria-invalid:border-destructive data-[active=true]:aria-invalid:ring-destructive/20 dark:bg-input/30 dark:data-[active=true]:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-4 w-px animate-caret-blink bg-foreground duration-1000" />
        </div>
      )}
    </div>
  )
}

function InputOTPSeparator({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-otp-separator"
      className={cn(
        "flex h-8 w-5 shrink-0 items-center justify-center rounded-none bg-transparent text-muted-foreground [&_svg:not([class*='size-'])]:size-3.5",
        className
      )}
      role="separator"
      {...props}
    >
      <RiSubtractLine className="size-4" />
    </div>
  )
}

export { InputOTP, InputOTPGroup, InputOTPDigitGroup, InputOTPSlot, InputOTPSeparator }
