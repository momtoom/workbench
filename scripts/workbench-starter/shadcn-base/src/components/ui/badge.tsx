import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import "./badge.css"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "wb-badge",
  {
    variants: {
      variant: {
        default: "wb-badge--default",
        secondary: "wb-badge--secondary",
        destructive: "wb-badge--destructive",
        outline: "wb-badge--outline",
        ghost: "wb-badge--ghost",
        link: "wb-badge--link",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function BadgeRoot({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  const resolvedVariant = variant ?? "default"

  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        "data-slot": "badge",
        "data-variant": resolvedVariant,
        className: cn(badgeVariants({ variant: resolvedVariant }), className),
      } as useRender.ComponentProps<"span">,
      props
    ),
    render,
    state: {
      slot: "badge",
      variant: resolvedVariant,
    },
  })
}

function Badge(props: React.ComponentProps<typeof BadgeRoot>) {
  return <BadgeRoot {...props} />
}

export { Badge, badgeVariants }
