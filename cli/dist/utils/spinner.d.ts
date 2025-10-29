import { Ora } from 'ora';
/**
 * Create and start a spinner with the given message
 */
export declare function startSpinner(message: string): Ora;
/**
 * Success message with checkmark
 */
export declare function success(message: string): void;
/**
 * Error message with X mark
 */
export declare function error(message: string): void;
/**
 * Info message with info icon
 */
export declare function info(message: string): void;
/**
 * Warning message
 */
export declare function warning(message: string): void;
/**
 * Format key-value pairs
 */
export declare function formatKeyValue(key: string, value: string): void;
/**
 * Print a section header
 */
export declare function header(title: string): void;
/**
 * Print a table
 */
export declare function table(headers: string[], rows: string[][]): void;
//# sourceMappingURL=spinner.d.ts.map