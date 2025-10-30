/**
 * Import/Export Utilities
 * 
 * Handles importing and exporting variables in multiple formats:
 * - .env (KEY=VALUE)
 * - JSON ({"KEY": "VALUE"})
 * - YAML (KEY: VALUE)
 * - CSV (key,value,description)
 * - TOML (KEY = "value")
 */

import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { parse as parseCsv, unparse as unparseCsv } from 'papaparse';

export interface Variable {
  key: string;
  value: string;
  description?: string;
}

export type ExportFormat = 'env' | 'json' | 'yaml' | 'csv' | 'toml';

/**
 * Parse .env format
 */
export function parseEnvFormat(content: string): Variable[] {
  const variables: Variable[] = [];
  const lines = content.split('\n');

  let currentComment = '';

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) {
      currentComment = '';
      continue;
    }

    // Collect comments as descriptions
    if (trimmed.startsWith('#')) {
      currentComment = trimmed.slice(1).trim();
      continue;
    }

    // Parse KEY=VALUE
    const match = trimmed.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (match) {
      const [, key, rawValue] = match;
      
      // Remove quotes if present
      let value = rawValue.trim();
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      variables.push({
        key,
        value,
        description: currentComment || undefined,
      });

      currentComment = '';
    }
  }

  return variables;
}

/**
 * Parse JSON format
 */
export function parseJsonFormat(content: string): Variable[] {
  const data = JSON.parse(content);
  
  if (Array.isArray(data)) {
    return data.map(item => ({
      key: item.key,
      value: item.value,
      description: item.description,
    }));
  }

  return Object.entries(data).map(([key, value]) => ({
    key,
    value: String(value),
  }));
}

/**
 * Parse YAML format
 */
export function parseYamlFormat(content: string): Variable[] {
  const data = parseYaml(content);
  
  return Object.entries(data).map(([key, value]) => ({
    key,
    value: String(value),
  }));
}

/**
 * Parse CSV format
 */
export function parseCsvFormat(content: string): Variable[] {
  const { data } = parseCsv<string[]>(content, {
    header: false,
    skipEmptyLines: true,
  });

  // Skip header row if present
  const startIndex = data[0][0].toLowerCase() === 'key' ? 1 : 0;

  return data.slice(startIndex).map(row => ({
    key: row[0],
    value: row[1] || '',
    description: row[2] || undefined,
  }));
}

/**
 * Parse TOML format
 */
export function parseTomlFormat(content: string): Variable[] {
  const variables: Variable[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    // Parse KEY = "value"
    const match = trimmed.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*["'](.*)["']$/);
    if (match) {
      const [, key, value] = match;
      variables.push({ key, value });
    }
  }

  return variables;
}

/**
 * Export to .env format
 */
export function exportToEnvFormat(variables: Variable[]): string {
  return variables
    .map(v => {
      const lines: string[] = [];
      
      if (v.description) {
        lines.push(`# ${v.description}`);
      }
      
      // Quote value if it contains spaces or special characters
      const needsQuotes = /[\s#$]/.test(v.value);
      const value = needsQuotes ? `"${v.value}"` : v.value;
      lines.push(`${v.key}=${value}`);
      
      return lines.join('\n');
    })
    .join('\n\n');
}

/**
 * Export to JSON format
 */
export function exportToJsonFormat(variables: Variable[], pretty: boolean = true): string {
  const data = variables.reduce((acc, v) => {
    acc[v.key] = v.value;
    return acc;
  }, {} as Record<string, string>);

  return JSON.stringify(data, null, pretty ? 2 : 0);
}

/**
 * Export to YAML format
 */
export function exportToYamlFormat(variables: Variable[]): string {
  const data = variables.reduce((acc, v) => {
    acc[v.key] = v.value;
    return acc;
  }, {} as Record<string, string>);

  return stringifyYaml(data);
}

/**
 * Export to CSV format
 */
export function exportToCsvFormat(variables: Variable[]): string {
  const data = variables.map(v => ({
    key: v.key,
    value: v.value,
    description: v.description || '',
  }));

  return unparseCsv(data, {
    header: true,
  });
}

/**
 * Export to TOML format
 */
export function exportToTomlFormat(variables: Variable[]): string {
  return variables
    .map(v => {
      const lines: string[] = [];
      
      if (v.description) {
        lines.push(`# ${v.description}`);
      }
      
      lines.push(`${v.key} = "${v.value}"`);
      
      return lines.join('\n');
    })
    .join('\n\n');
}

/**
 * Auto-detect format from content
 */
export function detectFormat(content: string): ExportFormat | null {
  const trimmed = content.trim();

  // JSON
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      JSON.parse(content);
      return 'json';
    } catch {
      // Not valid JSON
    }
  }

  // YAML (starts with key:)
  if (/^[a-zA-Z_][a-zA-Z0-9_]*:\s*.+/m.test(trimmed)) {
    return 'yaml';
  }

  // CSV (has header row)
  if (trimmed.startsWith('key,value') || trimmed.includes(',')) {
    return 'csv';
  }

  // TOML (has KEY = "value")
  if (/^[A-Z_][A-Z0-9_]*\s*=\s*["'].+["']/m.test(trimmed)) {
    return 'toml';
  }

  // .env (has KEY=VALUE)
  if (/^[A-Z_][A-Z0-9_]*=.+/m.test(trimmed)) {
    return 'env';
  }

  return null;
}

/**
 * Import variables from any format
 */
export function importVariables(content: string, format?: ExportFormat): Variable[] {
  const detectedFormat = format || detectFormat(content);

  if (!detectedFormat) {
    throw new Error('Could not detect format. Please specify format explicitly.');
  }

  switch (detectedFormat) {
    case 'env':
      return parseEnvFormat(content);
    case 'json':
      return parseJsonFormat(content);
    case 'yaml':
      return parseYamlFormat(content);
    case 'csv':
      return parseCsvFormat(content);
    case 'toml':
      return parseTomlFormat(content);
    default:
      throw new Error(`Unsupported format: ${detectedFormat}`);
  }
}

/**
 * Export variables to any format
 */
export function exportVariables(variables: Variable[], format: ExportFormat): string {
  switch (format) {
    case 'env':
      return exportToEnvFormat(variables);
    case 'json':
      return exportToJsonFormat(variables);
    case 'yaml':
      return exportToYamlFormat(variables);
    case 'csv':
      return exportToCsvFormat(variables);
    case 'toml':
      return exportToTomlFormat(variables);
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

/**
 * Detect conflicts between imported and existing variables
 */
export function detectConflicts(
  imported: Variable[],
  existing: Variable[]
): {
  toCreate: Variable[];
  toUpdate: Variable[];
  conflicts: Array<{
    key: string;
    importedValue: string;
    existingValue: string;
  }>;
} {
  const existingMap = new Map(existing.map(v => [v.key, v]));
  const toCreate: Variable[] = [];
  const toUpdate: Variable[] = [];
  const conflicts: Array<{
    key: string;
    importedValue: string;
    existingValue: string;
  }> = [];

  for (const variable of imported) {
    const existingVar = existingMap.get(variable.key);

    if (!existingVar) {
      toCreate.push(variable);
    } else if (existingVar.value !== variable.value) {
      toUpdate.push(variable);
      conflicts.push({
        key: variable.key,
        importedValue: variable.value,
        existingValue: existingVar.value,
      });
    }
  }

  return { toCreate, toUpdate, conflicts };
}
