"use client";

import { HTMLAttributes } from "react";
import clsx from "clsx";
import { X } from "lucide-react";

export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
    size?: 'sm' | 'md';
    removable?: boolean;
    onRemove?: () => void;
}

export function Tag({
    variant = 'default',
    size = 'md',
    removable = false,
    onRemove,
    children,
    className,
    ...props
}: TagProps) {
    const variantClasses = {
        default: 'glass border-glass-light-border dark:border-glass-dark-border text-text-primary-light dark:text-text-primary-dark',
        primary: 'bg-primary/10 border-primary/30 text-primary',
        success: 'bg-success/10 border-success/30 text-success',
        warning: 'bg-warning/10 border-warning/30 text-warning',
        error: 'bg-error/10 border-error/30 text-error',
        info: 'bg-blue-500/10 border-blue-500/30 text-blue-500',
    };

    const sizeClasses = {
        sm: 'text-xs px-2 py-1',
        md: 'text-sm px-3 py-1.5',
    };

    return (
        <span
            className={clsx(
                "inline-flex items-center gap-1.5 rounded-lg border font-medium transition-all",
                variantClasses[variant],
                sizeClasses[size],
                removable && 'pr-1',
                className
            )}
            {...props}
        >
            <span>{children}</span>
            {removable && onRemove && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove();
                    }}
                    className="ml-1 hover:bg-black/10 dark:hover:bg-white/10 rounded p-0.5 transition-colors"
                    aria-label="Remove tag"
                >
                    <X className="w-3 h-3" />
                </button>
            )}
        </span>
    );
}
