/**
 * Export command - Export variables to a file
 */

import { Command } from 'commander';
import { writeFileSync } from 'fs';
import { resolve } from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { apiRequest } from '../utils/api';
import { getConfig } from '../utils/config';

interface ExportOptions {
  output?: string;
  format: 'dotenv' | 'json' | 'yaml';
  project?: string;
  env?: string;
}

export const exportCommand = new Command('export')
  .description('Export variables to a file')
  .option('-o, --output <path>', 'Output file path (defaults to stdout)')
  .option('--format <format>', 'Output format (dotenv, json, yaml)', 'dotenv')
  .option('-p, --project <slug>', 'Project slug')
  .option('-e, --env <name>', 'Environment name')
  .action(async (options: ExportOptions) => {
    try {
      const config = getConfig();
      if (!config || !config.token) {
        console.error(chalk.red('✖ Not logged in. Run `envshield login` first.'));
        process.exit(1);
      }

      // Validate options
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

      const spinner = ora('Exporting variables...').start();

      try {
        // Make API request to export
        const response = await fetch(
          `${config.apiUrl}/api/v1/projects/${options.project}/environments/${options.env}/variables/export?format=${options.format}`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${config.token}`,
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Export failed');
        }

        const content = await response.text();

        spinner.succeed('Export complete');

        // Write to file or stdout
        if (options.output) {
          const outputPath = resolve(process.cwd(), options.output);
          writeFileSync(outputPath, content, 'utf-8');
          console.log(chalk.green(`\n✅ Variables exported to ${outputPath}\n`));
        } else {
          console.log('\n' + content);
        }
      } catch (error: unknown) {
        spinner.fail('Export failed');
        console.error(chalk.red(`\n✖ ${error instanceof Error ? error.message : 'Unknown error'}\n`));
        process.exit(1);
      }
    } catch (error: unknown) {
      console.error(chalk.red(`\n✖ ${error instanceof Error ? error.message : 'Unknown error'}\n`));
      process.exit(1);
    }
  });
