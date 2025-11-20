"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import clsx from "clsx";

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
}

interface ToastContextType {
    toasts: Toast[];
    addToast: (toast: Omit<Toast, 'id'>) => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
        const id = Math.random().toString(36).substring(2, 9);
        const newToast = { ...toast, id };

        setToasts((prev) => [...prev, newToast]);

        const duration = toast.duration ?? 5000;
        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
            {children}
            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
}

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
    return (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 max-w-md w-full pointer-events-none">
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
            ))}
        </div>
    );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
    const icons = {
        success: CheckCircle,
        error: AlertCircle,
        info: Info,
        warning: AlertTriangle,
    };

    const Icon = icons[toast.type];

    return (
        <div
            className={clsx(
                "glass-card pointer-events-auto animate-slide-in",
                "flex items-start gap-3 p-4 pr-12 relative",
                "border-l-4",
                {
                    "border-l-success": toast.type === 'success',
                    "border-l-error": toast.type === 'error',
                    "border-l-blue-500": toast.type === 'info',
                    "border-l-warning": toast.type === 'warning',
                }
            )}
        >
            <Icon className={clsx(
                "w-5 h-5 shrink-0 mt-0.5",
                {
                    "text-success": toast.type === 'success',
                    "text-error": toast.type === 'error',
                    "text-blue-500": toast.type === 'info',
                    "text-warning": toast.type === 'warning',
                }
            )} />

            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">
                    {toast.title}
                </p>
                {toast.message && (
                    <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1">
                        {toast.message}
                    </p>
                )}
            </div>

            <button
                onClick={() => onRemove(toast.id)}
                className="absolute top-3 right-3 text-text-muted-light dark:text-text-muted-dark hover:text-text-primary-light dark:hover:text-text-primary-dark transition-colors"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}
