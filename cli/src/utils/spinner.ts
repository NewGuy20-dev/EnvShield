import ora, { Ora } from 'ora';
import chalk from 'chalk';

/**
 * Create and start a spinner with the given message
 */
export function startSpinner(message: string): Ora {
  return ora(message).start();
}

/**
 * Success message with checkmark
 */
export function success(message: string): void {
  console.log(chalk.green('✅ ' + message));
}

/**
 * Error message with X mark
 */
export function error(message: string): void {
  console.log(chalk.red('❌ ' + message));
}

/**
 * Info message with info icon
 */
export function info(message: string): void {
  console.log(chalk.blue('ℹ ' + message));
}

/**
 * Warning message
 */
export function warning(message: string): void {
  console.log(chalk.yellow('⚠ ' + message));
}

/**
 * Format key-value pairs
 */
export function formatKeyValue(key: string, value: string): void {
  console.log(chalk.cyan(key + ':'), chalk.white(value));
}

/**
 * Print a section header
 */
export function header(title: string): void {
  console.log('');
  console.log(chalk.bold.white(title));
  console.log(chalk.gray('─'.repeat(title.length)));
}

/**
 * Print a table
 */
export function table(headers: string[], rows: string[][]): void {
  // Calculate column widths
  const colWidths = headers.map((h, i) => {
    const maxRowWidth = Math.max(...rows.map(r => (r[i] || '').length));
    return Math.max(h.length, maxRowWidth);
  });

  // Print header
  const headerRow = headers.map((h, i) => h.padEnd(colWidths[i])).join('  ');
  console.log(chalk.bold(headerRow));
  console.log(chalk.gray('─'.repeat(headerRow.length)));

  // Print rows
  rows.forEach(row => {
    const formattedRow = row.map((cell, i) => cell.padEnd(colWidths[i])).join('  ');
    console.log(formattedRow);
  });
}
