import { ButtonHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "tertiary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      icon,
      children,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={clsx(
          "inline-flex items-center justify-center gap-2 font-semibold",
          "transition-all duration-200 ease-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
          "relative overflow-hidden group",
          
          // Variants
          {
            // Primary - Blue gradient with glow and shine effect
            "bg-gradient-to-r from-primary via-primary to-primary/90 text-white shadow-glass-light dark:shadow-glass-dark hover:shadow-glow-primary hover:-translate-y-1 hover:scale-[1.02] active:translate-y-0 active:scale-100":
              variant === "primary",
            
            // Secondary - Glass with cyan accent
            "glass border border-secondary/30 text-primary dark:text-primary-400 hover:border-secondary/60 hover:shadow-glow-secondary hover:-translate-y-1 hover:scale-[1.02] hover:bg-secondary/5 active:translate-y-0 active:scale-100":
              variant === "secondary",
            
            // Tertiary - Text only with smooth transition
            "text-primary dark:text-primary-400 hover:bg-primary/10 hover:scale-105 active:bg-primary/20 active:scale-100":
              variant === "tertiary",
            
            // Danger - Red accent with warning glow
            "glass border border-error/30 text-error hover:border-error/60 hover:shadow-glow-error hover:-translate-y-1 hover:scale-[1.02] hover:bg-error/5 active:translate-y-0 active:scale-100":
              variant === "danger",
            
            // Ghost - Transparent with subtle hover
            "text-text-secondary-light dark:text-text-secondary-dark hover:bg-glass-light dark:hover:bg-glass-dark hover:text-text-primary-light dark:hover:text-text-primary-dark":
              variant === "ghost",
          },
          
          // Sizes
          {
            "h-8 px-4 text-xs rounded-lg": size === "sm",
            "h-10 px-6 text-sm rounded-xl": size === "md",
            "h-12 px-8 text-base rounded-xl": size === "lg",
          },
          
          className
        )}
        {...props}
      >
        {/* Shine effect for primary button */}
        {variant === "primary" && !disabled && !loading && (
          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
        )}
        <span className="relative z-10 inline-flex items-center justify-center gap-2">
          {loading ? (
            <>
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>Loading...</span>
            </>
          ) : (
            <>
              {icon && <span className="shrink-0">{icon}</span>}
              {children}
            </>
          )}
        </span>
      </button>
    );
  }
);

Button.displayName = "Button";
