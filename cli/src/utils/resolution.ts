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
 * Extract variable references from a value
 */
function extractReferences(value: string): string[] {
    const references: string[] = [];
    const regex = /\$\{([A-Za-z0-9_]+)\}/g;
    let match;

    while ((match = regex.exec(value)) !== null) {
        references.push(match[1]);
    }

    return references;
}

/**
 * Detect circular dependencies
 */
function detectCircularDependencies(
    variables: Record<string, string>
): ResolutionError[] {
    const errors: ResolutionError[] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    function visit(varName: string, path: string[] = []): boolean {
        if (!variables[varName]) {
            return false;
        }

        if (recursionStack.has(varName)) {
            errors.push({
                variable: varName,
                message: `Circular dependency: ${[...path, varName].join(' -> ')}`,
                type: 'circular',
            });
            return true;
        }

        if (visited.has(varName)) {
            return false;
        }

        visited.add(varName);
        recursionStack.add(varName);

        const references = extractReferences(variables[varName]);
        for (const ref of references) {
            if (visit(ref, [...path, varName])) {
                return true;
            }
        }

        recursionStack.delete(varName);
        return false;
    }

    for (const varName of Object.keys(variables)) {
        if (!visited.has(varName)) {
            visit(varName);
        }
    }

    return errors;
}

/**
 * Resolve variables with interpolation support
 */
export function resolveVariables(
    variables: Record<string, string>,
    maxIterations: number = 10
): ResolutionResult {
    const errors: ResolutionError[] = [];
    const warnings: string[] = [];

    // Detect circular dependencies
    const circularErrors = detectCircularDependencies(variables);
    if (circularErrors.length > 0) {
        return {
            resolved: variables,
            errors: circularErrors,
            warnings: ['Resolution aborted due to circular dependencies'],
        };
    }

    // Resolve variables
    const resolved: Record<string, string> = {};

    for (const [key, value] of Object.entries(variables)) {
        const references = extractReferences(value);

        // Check for missing references
        for (const ref of references) {
            if (!(ref in variables)) {
                errors.push({
                    variable: key,
                    message: `References undefined variable: ${ref}`,
                    type: 'missing',
                });
            }
        }

        // Resolve value
        let resolvedValue = value;
        let iteration = 0;

        while (extractReferences(resolvedValue).length > 0 && iteration < maxIterations) {
            const prevValue = resolvedValue;

            resolvedValue = resolvedValue.replace(/\$\{([A-Za-z0-9_]+)\}/g, (match, varName) => {
                if (resolved[varName] !== undefined) {
                    return resolved[varName];
                }
                if (variables[varName] !== undefined) {
                    return variables[varName];
                }
                return match; // Keep original if not found
            });

            if (prevValue === resolvedValue) {
                warnings.push(`Could not fully resolve ${key}: ${resolvedValue}`);
                break;
            }

            iteration++;
        }

        if (iteration >= maxIterations) {
            warnings.push(
                `Max iterations reached for ${key}, resolution may be incomplete`
            );
        }

        resolved[key] = resolvedValue;
    }

    return {
        resolved,
        errors,
        warnings,
    };
}

/**
 * Check if a value contains variable references
 */
export function hasReferences(value: string): boolean {
    return /\$\{[A-Za-z0-9_]+\}/.test(value);
}
