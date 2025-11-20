/**
 * Variable Resolution and Interpolation
 * 
 * Supports ${VAR_NAME} syntax for referencing other variables
 * within the same environment.
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
 * Matches ${VAR_NAME} patterns
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
 * Detect circular dependencies in variable references
 */
function detectCircularDependencies(
  variables: Record<string, string>
): ResolutionError[] {
  const errors: ResolutionError[] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function visit(varName: string, path: string[] = []): boolean {
    if (!variables[varName]) {
      return false; // Missing variable, handled separately
    }

    if (recursionStack.has(varName)) {
      // Circular dependency detected
      errors.push({
        variable: varName,
        message: `Circular dependency: ${[...path, varName].join(' -> ')}`,
        type: 'circular',
      });
      return true;
    }

    if (visited.has(varName)) {
      return false; // Already processed
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
 * Resolve a single variable value by replacing references
 */
function resolveValue(
  value: string,
  variables: Record<string, string>,
  resolvedCache: Map<string, string>
): string {
  return value.replace(/\$\{([A-Za-z0-9_]+)\}/g, (match, varName) => {
    // Check cache first
    if (resolvedCache.has(varName)) {
      return resolvedCache.get(varName)!;
    }

    // Variable doesn't exist, return the original placeholder
    if (!(varName in variables)) {
      return match;
    }

    return variables[varName];
  });
}

/**
 * Build dependency graph for topological sort
 */
function buildDependencyGraph(variables: Record<string, string>): Map<string, string[]> {
  const graph = new Map<string, string[]>();

  for (const [varName, value] of Object.entries(variables)) {
    const references = extractReferences(value);
    graph.set(varName, references);
  }

  return graph;
}

/**
 * Topological sort to determine resolution order
 */
function topologicalSort(graph: Map<string, string[]>): string[] {
  const sorted: string[] = [];
  const visited = new Set<string>();
  const temp = new Set<string>();

  function visit(node: string) {
    if (temp.has(node)) {
      // Circular dependency (should be caught earlier)
      return;
    }
    if (visited.has(node)) {
      return;
    }

    temp.add(node);

    const deps = graph.get(node) || [];
    for (const dep of deps) {
      visit(dep);
    }

    temp.delete(node);
    visited.add(node);
    sorted.push(node);
  }

  for (const node of graph.keys()) {
    if (!visited.has(node)) {
      visit(node);
    }
  }

  return sorted;
}

/**
 * Resolve all variable references
 * 
 * @param variables - Map of variable names to values
 * @param maxIterations - Maximum resolution passes (default: 10)
 * @returns Resolved variables and any errors/warnings
 */
export function resolveVariables(
  variables: Record<string, string>,
  maxIterations: number = 10
): ResolutionResult {
  const errors: ResolutionError[] = [];
  const warnings: string[] = [];

  // Step 1: Detect circular dependencies
  const circularErrors = detectCircularDependencies(variables);
  if (circularErrors.length > 0) {
    return {
      resolved: variables, // Return original on circular dependency
      errors: circularErrors,
      warnings: ['Resolution aborted due to circular dependencies'],
    };
  }

  // Step 2: Build dependency graph and sort
  const graph = buildDependencyGraph(variables);
  const sortedVars = topologicalSort(graph);

  // Step 3: Resolve in topological order
  const resolved: Record<string, string> = {};
  const resolvedCache = new Map<string, string>();

  for (const varName of sortedVars) {
    const value = variables[varName];
    const references = extractReferences(value);

    // Check for missing references
    for (const ref of references) {
      if (!(ref in variables)) {
        errors.push({
          variable: varName,
          message: `References undefined variable: ${ref}`,
          type: 'missing',
        });
      }
    }

    // Resolve the value
    let resolvedValue = value;
    let iteration = 0;

    while (extractReferences(resolvedValue).length > 0 && iteration < maxIterations) {
      const prevValue = resolvedValue;
      resolvedValue = resolveValue(resolvedValue, resolved, resolvedCache);

      // No progress made, break to avoid infinite loop
      if (prevValue === resolvedValue) {
        warnings.push(
          `Could not fully resolve ${varName}: ${resolvedValue}`
        );
        break;
      }

      iteration++;
    }

    if (iteration >= maxIterations) {
      warnings.push(
        `Max iterations reached for ${varName}, resolution may be incomplete`
      );
    }

    resolved[varName] = resolvedValue;
    resolvedCache.set(varName, resolvedValue);
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

/**
 * Validate variable name format
 */
export function isValidVariableName(name: string): boolean {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(name);
}

/**
 * Get all referenced variables in a value
 */
export function getReferencedVariables(value: string): string[] {
  return extractReferences(value);
}
