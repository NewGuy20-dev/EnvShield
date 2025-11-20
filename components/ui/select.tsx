"use client";

import { SelectHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";
import { ChevronDown } from "lucide-react";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    options: Array<{ value: string; label: string }>;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
    (
        {
            label,
            error,
            options,
            className,
            disabled,
            ...props
        },
        ref
    ) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-semibold text-text-primary-light dark:text-text-primary-dark mb-2.5 tracking-tight">
                        {label}
                    </label>
                )}
                <div className="relative">
                    <select
                        ref={ref}
                        disabled={disabled}
                        className={clsx(
                            "w-full h-11 px-4 pr-10 rounded-xl appearance-none",
                            "glass-input bg-glass-light-input dark:bg-glass-dark-input",
                            "border border-glass-light-border dark:border-glass-dark-border",
                            "text-text-primary-light dark:text-text-primary-dark text-sm",
                            "backdrop-blur-glass",
                            "transition-all duration-300 ease-out",
                            "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary focus:shadow-glow-primary/20",
                            "hover:border-primary/40",
                            "disabled:opacity-50 disabled:cursor-not-allowed",
                            "cursor-pointer",
                            {
                                "border-error focus:ring-error/30 focus:border-error focus:shadow-glow-error/20 hover:border-error/50": error,
                                "animate-shake": error,
                            },
                            className
                        )}
                        {...props}
                    >
                        {options.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>

                    {/* Dropdown icon */}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted-light dark:text-text-muted-dark">
                        <ChevronDown className="w-4 h-4" />
                    </div>
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

Select.displayName = "Select";
