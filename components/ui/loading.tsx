"use client";

import clsx from "clsx";

export interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
    const sizeClasses = {
        sm: 'w-4 h-4 border-2',
        md: 'w-8 h-8 border-3',
        lg: 'w-12 h-12 border-4',
    };

    return (
        <div
            className={clsx(
                "inline-block rounded-full border-primary/30 border-t-primary animate-spin",
                sizeClasses[size],
                className
            )}
            role="status"
            aria-label="Loading"
        />
    );
}

export interface LoadingDotsProps {
    className?: string;
}

export function LoadingDots({ className }: LoadingDotsProps) {
    return (
        <div className={clsx("flex items-center gap-1.5", className)}>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
    );
}

export function LoadingOverlay({ message }: { message?: string }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="glass-card p-8 flex flex-col items-center gap-4">
                <LoadingSpinner size="lg" />
                {message && (
                    <p className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark">
                        {message}
                    </p>
                )}
            </div>
        </div>
    );
}

export function LoadingCard() {
    return (
        <div className="glass-card animate-pulse">
            <div className="h-6 w-1/3 bg-glass-light-input dark:bg-glass-dark-input rounded-lg mb-4" />
            <div className="space-y-3">
                <div className="h-4 w-full bg-glass-light-input dark:bg-glass-dark-input rounded-lg" />
                <div className="h-4 w-5/6 bg-glass-light-input dark:bg-glass-dark-input rounded-lg" />
                <div className="h-4 w-4/6 bg-glass-light-input dark:bg-glass-dark-input rounded-lg" />
            </div>
        </div>
    );
}
