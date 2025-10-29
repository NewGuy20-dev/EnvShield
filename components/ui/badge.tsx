import { HTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "primary" | "success" | "warning" | "error";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    { variant = "default", size = "md", icon, children, className, ...props },
    ref
  ) => {
    return (
      <span
        ref={ref}
        className={clsx(
          "inline-flex items-center gap-1 font-medium rounded-full",
          "backdrop-blur-glass transition-colors",
          
          // Variants
          {
            "bg-glass-light dark:bg-glass-dark text-text-primary-light dark:text-text-primary-dark border border-glass-light-border dark:border-glass-dark-border":
              variant === "default",
            "bg-primary/10 text-primary border border-primary/20":
              variant === "primary",
            "bg-success/10 text-success border border-success/20":
              variant === "success",
            "bg-warning/10 text-warning border border-warning/20":
              variant === "warning",
            "bg-error/10 text-error border border-error/20":
              variant === "error",
          },
          
          // Sizes
          {
            "h-5 px-2 text-xs": size === "sm",
            "h-6 px-3 text-sm": size === "md",
            "h-8 px-4 text-base": size === "lg",
          },
          
          className
        )}
        {...props}
      >
        {icon && <span className="shrink-0">{icon}</span>}
        {children}
      </span>
    );
  }
);

Badge.displayName = "Badge";
