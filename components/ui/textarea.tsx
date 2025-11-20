"use client";

import { TextareaHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    (
        {
            label,
            error,
            helperText,
            className,
            disabled,
            value,
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
                <textarea
                    ref={ref}
                    disabled={disabled}
                    value={value}
                    className={clsx(
                        "w-full min-h-[100px] px-4 py-3 rounded-xl resize-y",
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
                            "border-error focus:ring-error/30 focus:border-error focus:shadow-glow-error/20 hover:border-error/50": error,
                            "animate-shake": error,
                            "border-success focus:ring-success/30 focus:border-success": !error && value,
                        },
                        className
                    )}
                    {...props}
                />

                {helperText && !error && (
                    <p className="mt-2 text-xs text-text-muted-light dark:text-text-muted-dark">
                        {helperText}
                    </p>
                )}

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

Textarea.displayName = "Textarea";
