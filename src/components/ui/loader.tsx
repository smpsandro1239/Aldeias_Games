import * as React from "react"
import { Skeleton } from "@/components/ui/skeleton"

type LoaderProps = {
  className?: string
}

export const Loader = React.forwardRef<HTMLDivElement, LoaderProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={[
          "flex h-4 w-4 items-center justify-center",
          className,
        ].filter(Boolean).join(" ")}
        {...props}
      >
        <Skeleton className="h-3 w-3" />
      </div>
    )
  }
)
Loader.displayName = "Loader"

export type { LoaderProps }
