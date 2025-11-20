"use client";

import { HTMLAttributes } from "react";
import clsx from "clsx";

export interface ProgressBarProps extends HTMLAttributes<HTMLDivElement> {
    value: number;
    max?: number;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'primary' | 'success' | 'warning' | 'error';
    showLabel?: boolean;
}

export function ProgressBar({
    value,
    max = 100,
    size = 'md',
    variant = 'primary',
    showLabel = false,
    className,
    ...props
}: ProgressBarProps) {
    const percentage = Math.min((value / max) * 100, 100);

    const sizeClasses = {
        sm: 'h-1',
        md: 'h-2',
        lg: 'h-3',
    };

    const variantClasses = {
        primary: 'bg-gradient-to-r from-primary to-primary/80',
        success: 'bg-gradient-to-r from-success to-success/80',
        warning: 'bg-gradient-to-r from-warning to-warning/80',
        error: 'bg-gradient-to-r from-error to-error/80',
    };

    return (
        <div className={clsx("w-full", className)} {...props}>
            {showLabel && (
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark">
                        Progress
                    </span>
                    <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                        {Math.round(percentage)}%
                    </span>
                </div>
            )}
            <div
                className={clsx(
                    "w-full rounded-full overflow-hidden",
                    "bg-glass-light-input dark:bg-glass-dark-input",
                    sizeClasses[size]
                )}
                role="progressbar"
                aria-valuenow={value}
                aria-valuemin={0}
                aria-valuemax={max}
            >
                <div
                    className={clsx(
                        "h-full transition-all duration-500 ease-out rounded-full",
                        variantClasses[variant]
                    )}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}
