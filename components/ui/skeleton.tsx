import { HTMLAttributes } from "react";
import clsx from "clsx";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circle" | "rect";
  width?: string;
  height?: string;
  count?: number;
}

export function Skeleton({
  variant = "rect",
  width,
  height,
  count = 1,
  className,
  ...props
}: SkeletonProps) {
  const skeletons = Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      className={clsx(
        "animate-shimmer glass",
        {
          "h-4 rounded": variant === "text",
          "rounded-full aspect-square": variant === "circle",
          "rounded-xl": variant === "rect",
        },
        className
      )}
      style={{ width, height }}
      {...props}
    />
  ));

  return count > 1 ? <div className="space-y-2">{skeletons}</div> : skeletons[0];
}
