/**
 * Import/Export Utilities
 * 
 * Handles parsing and formatting of environment variables in multiple formats:
 * - .env (dotenv)
 * - JSON
 * - YAML
 */

import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import prisma from './db';
import { decryptFromStorage, encryptForStorage } from './encryption';
import { logger } from './logger';

export type ImportFormat = 'dotenv' | 'json' | 'yaml';
export type ConflictStrategy = 'overwrite' | 'skip' | 'merge';

export interface ParsedVariable {
  key: string;
  value: string;
  description?: string;
}

export interface ImportDiff {
  added: ParsedVariable[];
  updated: Array<{
    key: string;
    oldValue: string;
    newValue: string;
    description?: string;
  }>;
  unchanged: string[];
}

export interface ImportResult {
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
}

/**
 * Parse dotenv format (.env file)
 * Supports:
 * - KEY=value
 * - KEY="value with spaces"
 * - KEY='value with spaces'
 * - # comments
 * - Empty lines
 */
export function parseEnvFile(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines and comments
    if (!line || line.startsWith('#')) {
      continue;
    }

    // Match KEY=VALUE pattern
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) {
      continue;
    }

    const key = match[1];
    let value = match[2].trim();

    // Handle quoted values
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    // Handle escaped characters in double quotes
    if (match[2].trim().startsWith('"')) {
      value = value
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\\\/g, '\\')
        .replace(/\\"/g, '"');
    }

    result[key] = value;
  }

  return result;
}

/**
 * Parse JSON format
 * Supports:
 * - Flat object: { "KEY": "value" }
 * - Nested object (flattened with dot notation)
 */
export function parseJsonFile(content: string): Record<string, string> {
  try {
    const parsed = JSON.parse(content);
    
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      throw new Error('JSON must be an object');
    }

    return flattenObject(parsed);
  } catch (error) {
    throw new Error(`Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Parse YAML format
 * Supports:
 * - Flat structure: KEY: value
 * - Nested structure (flattened with dot notation)
 */
export function parseYamlFile(content: string): Record<string, string> {
  try {
    const parsed = parseYaml(content);
    
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      throw new Error('YAML must be an object');
    }

    return flattenObject(parsed);
  } catch (error) {
    throw new Error(`Invalid YAML: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Flatten nested object to dot notation
 * Example: { db: { host: "localhost" } } => { "db.host": "localhost" }
 */
function flattenObject(
  obj: Record<string, unknown>,
  prefix = '',
  result: Record<string, string> = {}
): Record<string, string> {
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (value === null || value === undefined) {
      result[newKey] = '';
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      flattenObject(value as Record<string, unknown>, newKey, result);
    } else {
      result[newKey] = String(value);
    }
  }

  return result;
}

/**
 * Unflatten dot notation to nested object
 * Example: { "db.host": "localhost" } => { db: { host: "localhost" } }
 */
function unflattenObject(flat: Record<string, string>): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(flat)) {
    const parts = key.split('.');
    let current = result;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!(part in current)) {
        current[part] = {};
      }
      current = current[part] as Record<string, unknown>;
    }

    current[parts[parts.length - 1]] = value;
  }

  return result;
}

/**
 * Format variables as dotenv
 */
export function formatAsDotenv(variables: Record<string, string>): string {
  const lines: string[] = [];

  for (const [key, value] of Object.entries(variables)) {
    // Quote values that contain spaces or special characters
    const needsQuotes = /[\s#"'$]/.test(value);
    const escapedValue = needsQuotes
      ? `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`
      : value;

    lines.push(`${key}=${escapedValue}`);
  }

  return lines.join('\n');
}

/**
 * Format variables as JSON
 */
export function formatAsJson(variables: Record<string, string>, pretty = true): string {
  // Attempt to unflatten for better structure
  const structured = unflattenObject(variables);
  return JSON.stringify(structured, null, pretty ? 2 : 0);
}

/**
 * Format variables as YAML
 */
export function formatAsYaml(variables: Record<string, string>): string {
  // Attempt to unflatten for better structure
  const structured = unflattenObject(variables);
  return stringifyYaml(structured);
}

/**
 * Generate diff between existing and imported variables
 */
export async function generateDiff(
  environmentId: string,
  imported: Record<string, string>
): Promise<ImportDiff> {
  // Fetch existing variables
  const existing = await prisma.variable.findMany({
    where: { environmentId },
    select: { key: true, value: true, description: true },
  });

  const existingMap = new Map<string, { value: string; description?: string }>();
  for (const v of existing) {
    const decrypted = decryptFromStorage(v.value);
    existingMap.set(v.key, { value: decrypted, description: v.description || undefined });
  }

  const added: ParsedVariable[] = [];
  const updated: ImportDiff['updated'] = [];
  const unchanged: string[] = [];

  for (const [key, newValue] of Object.entries(imported)) {
    const existingVar = existingMap.get(key);

    if (!existingVar) {
      added.push({ key, value: newValue });
    } else if (existingVar.value !== newValue) {
      updated.push({
        key,
        oldValue: existingVar.value,
        newValue,
        description: existingVar.description,
      });
    } else {
      unchanged.push(key);
    }
  }

  return { added, updated, unchanged };
}

/**
 * Apply import to database with conflict resolution
 */
export async function applyImport(
  environmentId: string,
  imported: Record<string, string>,
  strategy: ConflictStrategy,
  userId: string
): Promise<ImportResult> {
  const result: ImportResult = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  const diff = await generateDiff(environmentId, imported);

  try {
    // Handle new variables (always create)
    for (const { key, value } of diff.added) {
      try {
        const encrypted = encryptForStorage(value);
        await prisma.variable.create({
          data: {
            environmentId,
            key,
            value: encrypted,
          },
        });

        // Create history entry
        await prisma.variableHistory.create({
          data: {
            variableId: (await prisma.variable.findFirst({
              where: { environmentId, key },
              select: { id: true },
            }))!.id,
            key,
            value: encrypted,
            changedBy: userId,
          },
        });

        result.created++;
      } catch (error) {
        result.errors.push(`Failed to create ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Handle updates based on strategy
    for (const { key, newValue } of diff.updated) {
      if (strategy === 'skip') {
        result.skipped++;
        continue;
      }

      if (strategy === 'overwrite' || strategy === 'merge') {
        try {
          const encrypted = encryptForStorage(newValue);
          const variable = await prisma.variable.findFirst({
            where: { environmentId, key },
            select: { id: true },
          });

          if (!variable) {
            result.errors.push(`Variable ${key} not found for update`);
            continue;
          }

          await prisma.variable.update({
            where: { id: variable.id },
            data: { value: encrypted, updatedAt: new Date() },
          });

          // Create history entry
          await prisma.variableHistory.create({
            data: {
              variableId: variable.id,
              key,
              value: encrypted,
              changedBy: userId,
            },
          });

          result.updated++;
        } catch (error) {
          result.errors.push(`Failed to update ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }
  } catch (error) {
    logger.error({ error, environmentId }, 'Import failed');
    throw error;
  }

  return result;
}

/**
 * Export variables from environment
 */
export async function exportVariables(
  environmentId: string,
  format: ImportFormat
): Promise<string> {
  const variables = await prisma.variable.findMany({
    where: { environmentId },
    select: { key: true, value: true },
    orderBy: { key: 'asc' },
  });

  const decrypted: Record<string, string> = {};
  for (const v of variables) {
    decrypted[v.key] = decryptFromStorage(v.value);
  }

  switch (format) {
    case 'dotenv':
      return formatAsDotenv(decrypted);
    case 'json':
      return formatAsJson(decrypted);
    case 'yaml':
      return formatAsYaml(decrypted);
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

/**
 * Parse file content based on format
 */
export function parseFile(content: string, format: ImportFormat): Record<string, string> {
  switch (format) {
    case 'dotenv':
      return parseEnvFile(content);
    case 'json':
      return parseJsonFile(content);
    case 'yaml':
      return parseYamlFile(content);
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}
