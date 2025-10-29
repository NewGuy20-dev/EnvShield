import clsx from "clsx";

export interface LoadingSpinnerProps {
  variant?: "default" | "dots" | "shimmer";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({
  variant = "default",
  size = "md",
  className,
}: LoadingSpinnerProps) {
  if (variant === "dots") {
    return (
      <div className={clsx("flex items-center gap-2", className)}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={clsx(
              "rounded-full bg-primary animate-bounce",
              {
                "w-2 h-2": size === "sm",
                "w-3 h-3": size === "md",
                "w-4 h-4": size === "lg",
              }
            )}
            style={{
              animationDelay: `${i * 150}ms`,
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === "shimmer") {
    return (
      <div
        className={clsx(
          "rounded-xl glass animate-shimmer",
          {
            "h-8 w-24": size === "sm",
            "h-12 w-32": size === "md",
            "h-16 w-48": size === "lg",
          },
          className
        )}
      />
    );
  }

  return (
    <svg
      className={clsx(
        "animate-spin text-primary",
        {
          "w-5 h-5": size === "sm",
          "w-8 h-8": size === "md",
          "w-12 h-12": size === "lg",
        },
        className
      )}
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
  );
}
