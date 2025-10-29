import { HTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "hover" | "bordered" | "interactive";
  children: React.ReactNode;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = "default", children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          "glass-card p-6 relative group",
          "before:absolute before:inset-0 before:rounded-[16px] before:p-[1px]",
          "before:bg-gradient-to-br before:from-white/10 before:to-transparent",
          "before:-z-10 before:opacity-0 before:transition-opacity before:duration-300",
          {
            "": variant === "default",
            "hover-lift cursor-pointer hover:before:opacity-100": variant === "hover",
            "border-2 border-primary/30 shadow-glow-primary/10": variant === "bordered",
            "glass-card-hover hover:before:opacity-100": variant === "interactive",
          },
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

export const CardHeader = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ children, className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={clsx("mb-4", className)}
      {...props}
    >
      {children}
    </div>
  );
});

CardHeader.displayName = "CardHeader";

export const CardTitle = forwardRef<
  HTMLHeadingElement,
  HTMLAttributes<HTMLHeadingElement>
>(({ children, className, ...props }, ref) => {
  return (
    <h3
      ref={ref}
      className={clsx(
        "text-xl font-bold text-text-primary-light dark:text-text-primary-dark tracking-tight",
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
});

CardTitle.displayName = "CardTitle";

export const CardDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ children, className, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={clsx(
        "text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1.5 leading-relaxed",
        className
      )}
      {...props}
    >
      {children}
    </p>
  );
});

CardDescription.displayName = "CardDescription";

export const CardContent = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ children, className, ...props }, ref) => {
  return (
    <div ref={ref} className={className} {...props}>
      {children}
    </div>
  );
});

CardContent.displayName = "CardContent";

export const CardFooter = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ children, className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={clsx("mt-4 flex items-center gap-2", className)}
      {...props}
    >
      {children}
    </div>
  );
});

CardFooter.displayName = "CardFooter";
