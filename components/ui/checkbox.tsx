"use client";

import { InputHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";
import { Check } from "lucide-react";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
    label?: string;
    description?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
    (
        {
            label,
            description,
            className,
            disabled,
            checked,
            ...props
        },
        ref
    ) => {
        return (
            <div className="flex items-start gap-3">
                <div className="relative flex items-center justify-center h-5 w-5 mt-0.5">
                    <input
                        ref={ref}
                        type="checkbox"
                        disabled={disabled}
                        checked={checked}
                        className={clsx(
                            "peer appearance-none h-5 w-5 rounded-lg cursor-pointer",
                            "glass-input bg-glass-light-input dark:bg-glass-dark-input",
                            "border border-glass-light-border dark:border-glass-dark-border",
                            "transition-all duration-300 ease-out",
                            "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary",
                            "hover:border-primary/40",
                            "disabled:opacity-50 disabled:cursor-not-allowed",
                            "checked:bg-gradient-to-br checked:from-primary checked:to-primary/90",
                            "checked:border-primary checked:shadow-glow-primary/30",
                            className
                        )}
                        {...props}
                    />
                    <Check className="absolute w-3.5 h-3.5 text-white pointer-events-none opacity-0 peer-checked:opacity-100 peer-checked:animate-scale-in" />
                </div>

                {(label || description) && (
                    <div className="flex flex-col gap-0.5">
                        {label && (
                            <label className={clsx(
                                "text-sm font-medium text-text-primary-light dark:text-text-primary-dark cursor-pointer",
                                disabled && "opacity-50 cursor-not-allowed"
                            )}>
                                {label}
                            </label>
                        )}
                        {description && (
                            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                                {description}
                            </p>
                        )}
                    </div>
                )}
            </div>
        );
    }
);

Checkbox.displayName = "Checkbox";
