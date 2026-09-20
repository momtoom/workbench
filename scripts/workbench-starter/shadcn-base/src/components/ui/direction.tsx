import * as React from "react"
import {
  DirectionProvider as BaseDirectionProvider,
  useDirection,
} from "@base-ui/react/direction-provider"

type DirectionProviderProps = Omit<React.ComponentProps<"div">, "dir"> & {
  direction?: "ltr" | "rtl"
}

function DirectionProvider({
  children,
  className,
  direction = "ltr",
  ...props
}: DirectionProviderProps) {
  return (
    <BaseDirectionProvider direction={direction}>
      <div
        {...props}
        data-slot="direction-provider"
        className={className}
        dir={direction}
      >
        {children}
      </div>
    </BaseDirectionProvider>
  )
}

export {
  DirectionProvider,
  useDirection,
  type DirectionProviderProps,
}
