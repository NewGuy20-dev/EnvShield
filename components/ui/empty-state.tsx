"use client";

import { HTMLAttributes } from "react";
import clsx from "clsx";

export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: React.ReactNode;
}

export function EmptyState({
    icon,
    title,
    description,
    action,
    className,
    ...props
}: EmptyStateProps) {
    return (
        <div
            className={clsx(
                "flex flex-col items-center justify-center py-16 px-6 text-center",
                className
            )}
            {...props}
        >
            {icon && (
                <div className="mb-6 text-text-muted-light dark:text-text-muted-dark opacity-60 animate-float">
                    {icon}
                </div>
            )}

            <h3 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark mb-2">
                {title}
            </h3>

            {description && (
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark max-w-md mb-6">
                    {description}
                </p>
            )}

            {action && <div className="animate-slide-up">{action}</div>}
        </div>
    );
}
