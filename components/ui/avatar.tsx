import { HTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  initials?: string;
  size?: "sm" | "md" | "lg";
  status?: "online" | "offline" | "away";
}

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  (
    { src, alt, initials, size = "md", status, className, ...props },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={clsx(
          "relative inline-flex items-center justify-center rounded-full glass border border-glass-light-border dark:border-glass-dark-border overflow-hidden",
          {
            "w-8 h-8 text-xs": size === "sm",
            "w-10 h-10 text-sm": size === "md",
            "w-12 h-12 text-base": size === "lg",
          },
          className
        )}
        {...props}
      >
        {src ? (
          <img src={src} alt={alt} className="w-full h-full object-cover" />
        ) : (
          <span className="font-medium text-text-primary-light dark:text-text-primary-dark">
            {initials || "?"}
          </span>
        )}
        
        {status && (
          <span
            className={clsx(
              "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background-light dark:border-background-dark",
              {
                "bg-success": status === "online",
                "bg-text-muted-light": status === "offline",
                "bg-warning": status === "away",
              }
            )}
          />
        )}
      </div>
    );
  }
);

Avatar.displayName = "Avatar";
