"use client";

import { InputHTMLAttributes, forwardRef, useState } from "react";
import clsx from "clsx";
import { Eye, EyeOff, X } from "lucide-react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  onClear?: () => void;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      icon,
      onClear,
      type = "text",
      className,
      disabled,
      value,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";
    const inputType = isPassword && showPassword ? "text" : type;

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-semibold text-text-primary-light dark:text-text-primary-dark mb-2.5 tracking-tight">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted-light dark:text-text-muted-dark">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            type={inputType}
            disabled={disabled}
            value={value}
            className={clsx(
              "w-full h-11 px-4 rounded-xl",
              "glass-input bg-glass-light-input dark:bg-glass-dark-input",
              "border border-glass-light-border dark:border-glass-dark-border",
              "text-text-primary-light dark:text-text-primary-dark text-sm",
              "placeholder:text-text-muted-light dark:placeholder:text-text-muted-dark",
              "backdrop-blur-glass",
              "transition-all duration-300 ease-out",
              "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary focus:shadow-glow-primary/20",
              "hover:border-primary/40",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              {
                "pl-11": icon,
                "pr-11": isPassword || onClear,
                "border-error focus:ring-error/30 focus:border-error focus:shadow-glow-error/20 hover:border-error/50": error,
                "animate-shake": error,
                "border-success focus:ring-success/30 focus:border-success": !error && value,
              },
              className
            )}
            {...props}
          />
          
          {/* Password toggle */}
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted-light dark:text-text-muted-dark hover:text-text-primary-light dark:hover:text-text-primary-dark transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          )}
          
          {/* Clear button */}
          {onClear && value && !isPassword && (
            <button
              type="button"
              onClick={onClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted-light dark:text-text-muted-dark hover:text-text-primary-light dark:hover:text-text-primary-dark transition-colors"
              tabIndex={-1}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {error && (
          <p className="mt-2 text-xs font-medium text-error animate-slide-up flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
