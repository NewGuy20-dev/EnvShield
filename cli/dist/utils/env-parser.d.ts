export interface EnvVariable {
    key: string;
    value: string;
    description?: string;
}
/**
 * Parse .env file into key-value pairs
 * Handles quotes, multiline values, and comments
 */
export declare function parseEnvFile(filepath: string): EnvVariable[];
/**
 * Write variables to .env file format
 */
export declare function writeEnvFile(filepath: string, variables: EnvVariable[]): void;
/**
 * Validate variable key format
 */
export declare function isValidKey(key: string): boolean;
/**
 * Convert key to valid format (uppercase, replace invalid chars with _)
 */
export declare function normalizeKey(key: string): string;
//# sourceMappingURL=env-parser.d.ts.map