/**
 * Variable Resolution Utilities for CLI
 *
 * Mirrors the functionality of lib/variables.ts from the web app
 * to enable variable interpolation in the CLI
 */
export interface ResolutionError {
    variable: string;
    message: string;
    type: 'circular' | 'missing' | 'invalid';
}
export interface ResolutionResult {
    resolved: Record<string, string>;
    errors: ResolutionError[];
    warnings: string[];
}
/**
 * Resolve variables with interpolation support
 */
export declare function resolveVariables(variables: Record<string, string>, maxIterations?: number): ResolutionResult;
/**
 * Check if a value contains variable references
 */
export declare function hasReferences(value: string): boolean;
//# sourceMappingURL=resolution.d.ts.map