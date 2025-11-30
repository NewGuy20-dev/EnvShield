"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import clsx from "clsx";

export interface TooltipProps {
    content: string | ReactNode;
    children: ReactNode;
    position?: 'top' | 'bottom' | 'left' | 'right';
    delay?: number;
    className?: string;
}

export function Tooltip({
    content,
    children,
    position = 'top',
    delay = 300,
    className
}: TooltipProps) {
    const [visible, setVisible] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const calculatePosition = () => {
        if (!triggerRef.current || !tooltipRef.current) return;

        const triggerRect = triggerRef.current.getBoundingClientRect();
        const tooltipRect = tooltipRef.current.getBoundingClientRect();
        let top = 0;
        let left = 0;

        switch (position) {
            case 'top':
                top = -tooltipRect.height - 8;
                left = (triggerRect.width - tooltipRect.width) / 2;
                break;
            case 'bottom':
                top = triggerRect.height + 8;
                left = (triggerRect.width - tooltipRect.width) / 2;
                break;
            case 'left':
                top = (triggerRect.height - tooltipRect.height) / 2;
                left = -tooltipRect.width - 8;
                break;
            case 'right':
                top = (triggerRect.height - tooltipRect.height) / 2;
                left = triggerRect.width + 8;
                break;
        }

        setCoords({ top, left });
    };

    const handleMouseEnter = () => {
        timeoutRef.current = setTimeout(() => {
            setVisible(true);
            // Use requestAnimationFrame or a small timeout to ensure element is rendered before calculating position
            setTimeout(calculatePosition, 10);
        }, delay);
    };

    const handleMouseLeave = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        setVisible(false);
    };

    return (
        <div
            ref={triggerRef}
            className="relative inline-block"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onFocus={handleMouseEnter}
            onBlur={handleMouseLeave}
        >
            {children}
            {visible && (
                <div
                    ref={tooltipRef}
                    className={clsx(
                        "absolute z-50 px-3 py-2 text-xs font-medium rounded-lg whitespace-nowrap pointer-events-none",
                        "glass-card border border-glass-light-border dark:border-glass-dark-border",
                        "text-text-primary-light dark:text-text-primary-dark",
                        "animate-scale-in",
                        className
                    )}
                    style={{
                        top: `${coords.top}px`,
                        left: `${coords.left}px`,
                    }}
                    role="tooltip"
                >
                    {content}
                </div>
            )}
        </div>
    );
}
