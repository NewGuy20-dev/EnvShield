"use client";

import { HTMLAttributes } from "react";
import clsx from "clsx";

export interface PageHeaderProps extends HTMLAttributes<HTMLDivElement> {
    title: string;
    description?: string;
    actions?: React.ReactNode;
    breadcrumbs?: React.ReactNode;
}

export function PageHeader({
    title,
    description,
    actions,
    breadcrumbs,
    className,
    ...props
}: PageHeaderProps) {
    return (
        <div className={clsx("mb-8", className)} {...props}>
            {breadcrumbs && (
                <div className="mb-4 animate-slide-in">{breadcrumbs}</div>
            )}

            <div className="flex items-start justify-between gap-4 animate-slide-in animation-delay-100">
                <div className="flex-1 min-w-0">
                    <h1 className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark tracking-tight mb-2">
                        {title}
                    </h1>
                    {description && (
                        <p className="text-text-secondary-light dark:text-text-secondary-dark max-w-3xl">
                            {description}
                        </p>
                    )}
                </div>

                {actions && (
                    <div className="flex items-center gap-3 shrink-0">
                        {actions}
                    </div>
                )}
            </div>
        </div>
    );
}

export function Breadcrumbs({ items }: { items: Array<{ label: string; href?: string }> }) {
    return (
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
            {items.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                    {index > 0 && (
                        <span className="text-text-muted-light dark:text-text-muted-dark">/</span>
                    )}
                    {item.href ? (
                        <a
                            href={item.href}
                            className="text-text-secondary-light dark:text-text-secondary-dark hover:text-primary transition-colors"
                        >
                            {item.label}
                        </a>
                    ) : (
                        <span className="text-text-primary-light dark:text-text-primary-dark font-medium">
                            {item.label}
                        </span>
                    )}
                </div>
            ))}
        </nav>
    );
}
