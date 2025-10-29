import fs from 'fs';

export interface EnvVariable {
  key: string;
  value: string;
  description?: string;
}

/**
 * Parse .env file into key-value pairs
 * Handles quotes, multiline values, and comments
 */
export function parseEnvFile(filepath: string): EnvVariable[] {
  try {
    const content = fs.readFileSync(filepath, 'utf8');
    const lines = content.split('\n');
    const variables: EnvVariable[] = [];
    
    let currentKey: string | null = null;
    let currentValue: string = '';
    let inMultiline = false;

    for (let line of lines) {
      line = line.trim();

      // Skip empty lines and comments (unless in multiline)
      if (!inMultiline && (line === '' || line.startsWith('#'))) {
        continue;
      }

      // Check for key=value pattern
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
      
      if (match && !inMultiline) {
        if (currentKey) {
          // Save previous variable
          variables.push({
            key: currentKey,
            value: unquote(currentValue.trim()),
          });
        }

        currentKey = match[1];
        currentValue = match[2];

        // Check if value starts with quote but doesn't end with it (multiline)
        if ((currentValue.startsWith('"') && !currentValue.endsWith('"')) ||
            (currentValue.startsWith("'") && !currentValue.endsWith("'"))) {
          inMultiline = true;
        }
      } else if (inMultiline) {
        // Continue multiline value
        currentValue += '\n' + line;
        
        // Check if multiline ends
        if ((currentValue.includes('"') && line.endsWith('"')) ||
            (currentValue.includes("'") && line.endsWith("'"))) {
          inMultiline = false;
        }
      }
    }

    // Don't forget the last variable
    if (currentKey) {
      variables.push({
        key: currentKey,
        value: unquote(currentValue.trim()),
      });
    }

    return variables;
  } catch (error) {
    throw new Error(`Failed to parse .env file: ${error}`);
  }
}

/**
 * Write variables to .env file format
 */
export function writeEnvFile(filepath: string, variables: EnvVariable[]): void {
  try {
    const lines: string[] = [];

    // Add header comment
    lines.push('# Environment variables managed by EnvShield');
    lines.push('# Last synced: ' + new Date().toISOString());
    lines.push('');

    // Add each variable
    for (const variable of variables) {
      if (variable.description) {
        lines.push(`# ${variable.description}`);
      }
      
      // Quote value if it contains spaces or special characters
      const value = needsQuotes(variable.value) 
        ? `"${escapeQuotes(variable.value)}"` 
        : variable.value;
      
      lines.push(`${variable.key}=${value}`);
      lines.push('');
    }

    fs.writeFileSync(filepath, lines.join('\n'), 'utf8');
  } catch (error) {
    throw new Error(`Failed to write .env file: ${error}`);
  }
}

/**
 * Remove quotes from value if present
 */
function unquote(value: string): string {
  if ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  return value;
}

/**
 * Check if value needs to be quoted
 */
function needsQuotes(value: string): boolean {
  return value.includes(' ') || 
         value.includes('\n') || 
         value.includes('#') ||
         value.includes('$') ||
         value.includes('\\');
}

/**
 * Escape quotes in value
 */
function escapeQuotes(value: string): string {
  return value.replace(/"/g, '\\"');
}

/**
 * Validate variable key format
 */
export function isValidKey(key: string): boolean {
  return /^[A-Z0-9_]+$/.test(key);
}

/**
 * Convert key to valid format (uppercase, replace invalid chars with _)
 */
export function normalizeKey(key: string): string {
  return key.toUpperCase().replace(/[^A-Z0-9_]/g, '_');
}
