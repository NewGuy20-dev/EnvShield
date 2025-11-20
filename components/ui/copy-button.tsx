"use client";

import { useState } from "react";
import clsx from "clsx";
import { Check, Copy } from "lucide-react";

export interface CopyButtonProps {
    text: string;
    variant?: 'icon' | 'button';
    size?: 'sm' | 'md';
    className?: string;
}

export function CopyButton({
    text,
    variant = 'icon',
    size = 'md',
    className
}: CopyButtonProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    if (variant === 'icon') {
        return (
            <button
                onClick={handleCopy}
                className={clsx(
                    "inline-flex items-center justify-center rounded-lg transition-all duration-200",
                    "text-text-muted-light dark:text-text-muted-dark",
                    "hover:text-primary hover:bg-primary/10",
                    {
                        'w-7 h-7': size === 'sm',
                        'w-8 h-8': size === 'md',
                    },
                    copied && "text-success hover:text-success hover:bg-success/10",
                    className
                )}
                title={copied ? "Copied!" : "Copy"}
            >
                {copied ? (
                    <Check className={clsx(size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4', 'animate-scale-in')} />
                ) : (
                    <Copy className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
                )}
            </button>
        );
    }

    return (
        <button
            onClick={handleCopy}
            className={clsx(
                "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg",
                "glass-input border border-glass-light-border dark:border-glass-dark-border",
                "text-sm font-medium transition-all duration-200",
                "text-text-secondary-light dark:text-text-secondary-dark",
                "hover:border-primary/40 hover:text-primary",
                copied && "border-success/40 text-success",
                className
            )}
        >
            {copied ? (
                <>
                    <Check className="w-4 h-4 animate-scale-in" />
                    <span>Copied!</span>
                </>
            ) : (
                <>
                    <Copy className="w-4 h-4" />
                    <span>Copy</span>
                </>
            )}
        </button>
    );
}
