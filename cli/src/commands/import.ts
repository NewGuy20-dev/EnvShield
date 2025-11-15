/**
 * Import command - Import variables from a file
 */

import { Command } from 'commander';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { apiRequest } from '../utils/api';
import { getConfig } from '../utils/config';

interface ImportOptions {
  file: string;
  format: 'dotenv' | 'json' | 'yaml';
  project?: string;
  env?: string;
  strategy: 'overwrite' | 'skip' | 'merge';
  dryRun?: boolean;
  yes?: boolean;
}

interface DiffResult {
  added: Array<{ key: string }>;
  updated: Array<{ key: string }>;
  unchanged: string[];
}

interface ImportResult {
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
}

export const importCommand = new Command('import')
  .description('Import variables from a file')
  .option('-f, --file <path>', 'Path to file to import')
  .option('--format <format>', 'File format (dotenv, json, yaml)', 'dotenv')
  .option('-p, --project <slug>', 'Project slug')
  .option('-e, --env <name>', 'Environment name')
  .option('--strategy <strategy>', 'Conflict strategy (overwrite, skip, merge)', 'merge')
  .option('--dry-run', 'Preview changes without applying them')
  .option('-y, --yes', 'Skip confirmation prompt')
  .action(async (options: ImportOptions) => {
    try {
      const config = getConfig();
      if (!config?.token) {
        console.error(chalk.red('✖ Not logged in. Run `envshield login` first.'));
        process.exit(1);
      }

      // Validate options
      if (!options.file) {
        console.error(chalk.red('✖ File path is required. Use --file <path>'));
        process.exit(1);
      }

      if (!options.project) {
        console.error(chalk.red('✖ Project is required. Use --project <slug>'));
        process.exit(1);
      }

      if (!options.env) {
        console.error(chalk.red('✖ Environment is required. Use --env <name>'));
        process.exit(1);
      }

      // Validate format
      const validFormats = ['dotenv', 'json', 'yaml'];
      if (!validFormats.includes(options.format)) {
        console.error(chalk.red(`✖ Invalid format. Must be one of: ${validFormats.join(', ')}`));
        process.exit(1);
      }

      // Validate strategy
      const validStrategies = ['overwrite', 'skip', 'merge'];
      if (!validStrategies.includes(options.strategy)) {
        console.error(chalk.red(`✖ Invalid strategy. Must be one of: ${validStrategies.join(', ')}`));
        process.exit(1);
      }

      // Read file
      let content: string;
      try {
        const filePath = resolve(process.cwd(), options.file);
        content = readFileSync(filePath, 'utf-8');
      } catch (error) {
        console.error(chalk.red(`✖ Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`));
        process.exit(1);
      }

      console.log(chalk.cyan(`\n📦 Importing variables from ${options.file}\n`));
      console.log(`Project: ${chalk.bold(options.project)}`);
      console.log(`Environment: ${chalk.bold(options.env)}`);
      console.log(`Format: ${chalk.bold(options.format)}`);
      console.log(`Strategy: ${chalk.bold(options.strategy)}\n`);

      // Dry run first to show preview
      const spinner = ora('Analyzing import...').start();

      try {
        const dryRunResponse = await apiRequest<{ diff: DiffResult; summary: any }>(
          `/api/v1/projects/${options.project}/environments/${options.env}/variables/import`,
          {
            method: 'POST',
            body: JSON.stringify({
              format: options.format,
              content,
              strategy: options.strategy,
              dryRun: true,
            }),
          }
        );

        spinner.succeed('Analysis complete');

        const { diff, summary } = dryRunResponse;

        // Display summary
        console.log(chalk.bold('\n📊 Import Summary:\n'));
        console.log(`${chalk.green('+')} To add: ${chalk.bold(summary.toAdd)}`);
        console.log(`${chalk.yellow('~')} To update: ${chalk.bold(summary.toUpdate)}`);
        console.log(`${chalk.gray('=')} Unchanged: ${chalk.bold(summary.unchanged)}\n`);

        // Show detailed changes
        if (diff.added.length > 0) {
          console.log(chalk.green('New variables:'));
          diff.added.slice(0, 10).forEach((item: { key: string }) => {
            console.log(chalk.green(`  + ${item.key}`));
          });
          if (diff.added.length > 10) {
            console.log(chalk.gray(`  ... and ${diff.added.length - 10} more`));
          }
          console.log();
        }

        if (diff.updated.length > 0) {
          console.log(chalk.yellow('Updated variables:'));
          diff.updated.slice(0, 10).forEach((item: { key: string }) => {
            console.log(chalk.yellow(`  ~ ${item.key}`));
          });
          if (diff.updated.length > 10) {
            console.log(chalk.gray(`  ... and ${diff.updated.length - 10} more`));
          }
          console.log();
        }

        // If dry-run only, exit here
        if (options.dryRun) {
          console.log(chalk.blue('ℹ Dry run complete. No changes were made.'));
          console.log(chalk.gray('Run without --dry-run to apply these changes.\n'));
          process.exit(0);
        }

        // Confirm before applying
        if (!options.yes && (diff.added.length > 0 || diff.updated.length > 0)) {
          const inquirer = (await import('inquirer')).default;
          const { confirm } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'confirm',
              message: 'Apply these changes?',
              default: false,
            },
          ]);

          if (!confirm) {
            console.log(chalk.gray('\n✖ Import cancelled\n'));
            process.exit(0);
          }
        }

        // Apply import
        const importSpinner = ora('Importing variables...').start();

        const importResponse = await apiRequest<{ result: ImportResult; message: string }>(
          `/api/v1/projects/${options.project}/environments/${options.env}/variables/import`,
          {
            method: 'POST',
            body: JSON.stringify({
              format: options.format,
              content,
              strategy: options.strategy,
              dryRun: false,
            }),
          }
        );

        importSpinner.succeed('Import complete');

        const { result } = importResponse;

        console.log(chalk.bold('\n✅ Import Results:\n'));
        console.log(`${chalk.green('Created:')} ${result.created}`);
        console.log(`${chalk.yellow('Updated:')} ${result.updated}`);
        console.log(`${chalk.gray('Skipped:')} ${result.skipped}`);

        if (result.errors.length > 0) {
          console.log(chalk.red(`\n⚠ Errors: ${result.errors.length}`));
          result.errors.forEach((error: string) => {
            console.log(chalk.red(`  • ${error}`));
          });
        }

        console.log();
      } catch (error: unknown) {
        spinner.fail('Import failed');
        console.error(chalk.red(`\n✖ ${error instanceof Error ? error.message : 'Unknown error'}\n`));
        process.exit(1);
      }
    } catch (error: unknown) {
      console.error(chalk.red(`\n✖ ${error instanceof Error ? error.message : 'Unknown error'}\n`));
      process.exit(1);
    }
  });
