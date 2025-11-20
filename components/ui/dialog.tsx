"use client";

import { useEffect, useRef, ReactNode } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";
import { X } from "lucide-react";

export interface DialogProps {
    open: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
    children: ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    showClose?: boolean;
}

export function Dialog({
    open,
    onClose,
    title,
    description,
    children,
    size = 'md',
    showClose = true,
}: DialogProps) {
    const overlayRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [open]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && open) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [open, onClose]);

    if (!open) return null;

    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
    };

    const content = (
        <div
            ref={overlayRef}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={(e) => {
                if (e.target === overlayRef.current) {
                    onClose();
                }
            }}
        >
            <div
                className={clsx(
                    "glass-card w-full animate-scale-in relative",
                    sizeClasses[size]
                )}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? "dialog-title" : undefined}
                aria-describedby={description ? "dialog-description" : undefined}
            >
                {(title || showClose) && (
                    <div className="flex items-start justify-between mb-4 pb-4 border-b border-glass-light-border dark:border-glass-dark-border">
                        <div className="flex-1">
                            {title && (
                                <h2
                                    id="dialog-title"
                                    className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark"
                                >
                                    {title}
                                </h2>
                            )}
                            {description && (
                                <p
                                    id="dialog-description"
                                    className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1"
                                >
                                    {description}
                                </p>
                            )}
                        </div>
                        {showClose && (
                            <button
                                onClick={onClose}
                                className="ml-4 text-text-muted-light dark:text-text-muted-dark hover:text-text-primary-light dark:hover:text-text-primary-dark transition-colors"
                                aria-label="Close dialog"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                )}

                <div className="text-text-primary-light dark:text-text-primary-dark">
                    {children}
                </div>
            </div>
        </div>
    );

    return createPortal(content, document.body);
}

export function DialogFooter({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <div className={clsx("flex items-center justify-end gap-3 mt-6 pt-4 border-t border-glass-light-border dark:border-glass-dark-border", className)}>
            {children}
        </div>
    );
}
