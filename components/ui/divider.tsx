"use client";

import { HTMLAttributes } from "react";
import clsx from "clsx";

export interface DividerProps extends HTMLAttributes<HTMLDivElement> {
    orientation?: 'horizontal' | 'vertical';
    label?: string;
}

export function Divider({
    orientation = 'horizontal',
    label,
    className,
    ...props
}: DividerProps) {
    if (orientation === 'vertical') {
        return (
            <div
                className={clsx(
                    "w-px h-full bg-glass-light-border dark:bg-glass-dark-border",
                    className
                )}
                role="separator"
                aria-orientation="vertical"
                {...props}
            />
        );
    }

    if (label) {
        return (
            <div
                className={clsx("relative flex items-center my-6", className)}
                role="separator"
                aria-orientation="horizontal"
                {...props}
            >
                <div className="flex-1 h-px bg-glass-light-border dark:bg-glass-dark-border" />
                <span className="px-4 text-sm text-text-muted-light dark:text-text-muted-dark">
                    {label}
                </span>
                <div className="flex1 h-px bg-glass-light-border dark:bg-glass-dark-border" />
            </div>
        );
    }

    return (
        <div
            className={clsx(
                "h-px w-full bg-glass-light-border dark:bg-glass-dark-border my-6",
                className
            )}
            role="separator"
            aria-orientation="horizontal"
            {...props}
        />
    );
}
