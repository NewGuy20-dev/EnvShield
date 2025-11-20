"use client";

import { HTMLAttributes, forwardRef, useState } from "react";
import clsx from "clsx";
import { ChevronUp, ChevronDown } from "lucide-react";

export interface TableProps extends HTMLAttributes<HTMLTableElement> {
    children: React.ReactNode;
}

export const Table = forwardRef<HTMLTableElement, TableProps>(
    ({ children, className, ...props }, ref) => {
        return (
            <div className="w-full overflow-x-auto rounded-xl border border-glass-light-border dark:border-glass-dark-border glass">
                <table
                    ref={ref}
                    className={clsx("w-full text-sm", className)}
                    {...props}
                >
                    {children}
                </table>
            </div>
        );
    }
);

Table.displayName = "Table";

export const TableHeader = forwardRef<
    HTMLTableSectionElement,
    HTMLAttributes<HTMLTableSectionElement>
>(({ children, className, ...props }, ref) => {
    return (
        <thead
            ref={ref}
            className={clsx(
                "bg-glass-light/50 dark:bg-glass-dark/50 border-b border-glass-light-border dark:border-glass-dark-border",
                className
            )}
            {...props}
        >
            {children}
        </thead>
    );
});

TableHeader.displayName = "TableHeader";

export interface TableHeadProps extends HTMLAttributes<HTMLTableCellElement> {
    sortable?: boolean;
    sorted?: 'asc' | 'desc' | null;
    onSort?: () => void;
}

export const TableHead = forwardRef<HTMLTableCellElement, TableHeadProps>(
    ({ children, className, sortable, sorted, onSort, ...props }, ref) => {
        return (
            <th
                ref={ref}
                className={clsx(
                    "px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider",
                    "text-text-secondary-light dark:text-text-secondary-dark",
                    sortable && "cursor-pointer hover:text-primary transition-colors select-none",
                    className
                )}
                onClick={sortable ? onSort : undefined}
                {...props}
            >
                <div className="flex items-center gap-2">
                    {children}
                    {sortable && (
                        <div className="flex flex-col">
                            <ChevronUp className={clsx("w-3 h-3 -mb-1", sorted === 'asc' ? 'text-primary' : 'text-text-muted-light dark:text-text-muted-dark')} />
                            <ChevronDown className={clsx("w-3 h-3", sorted === 'desc' ? 'text-primary' : 'text-text-muted-light dark:text-text-muted-dark')} />
                        </div>
                    )}
                </div>
            </th>
        );
    }
);

TableHead.displayName = "TableHead";

export const TableBody = forwardRef<
    HTMLTableSectionElement,
    HTMLAttributes<HTMLTableSectionElement>
>(({ children, className, ...props }, ref) => {
    return (
        <tbody ref={ref} className={className} {...props}>
            {children}
        </tbody>
    );
});

TableBody.displayName = "TableBody";

export const TableRow = forwardRef<
    HTMLTableRowElement,
    HTMLAttributes<HTMLTableRowElement> & { hoverable?: boolean }
>(({ children, className, hoverable = true, ...props }, ref) => {
    return (
        <tr
            ref={ref}
            className={clsx(
                "border-b border-glass-light-border dark:border-glass-dark-border last:border-0",
                "transition-colors duration-150",
                hoverable && "hover:bg-glass-light/30 dark:hover:bg-glass-dark/30",
                className
            )}
            {...props}
        >
            {children}
        </tr>
    );
});

TableRow.displayName = "TableRow";

export const TableCell = forwardRef<
    HTMLTableCellElement,
    HTMLAttributes<HTMLTableCellElement>
>(({ children, className, ...props }, ref) => {
    return (
        <td
            ref={ref}
            className={clsx(
                "px-6 py-4 text-text-primary-light dark:text-text-primary-dark",
                className
            )}
            {...props}
        >
            {children}
        </td>
    );
});

TableCell.displayName = "TableCell";
