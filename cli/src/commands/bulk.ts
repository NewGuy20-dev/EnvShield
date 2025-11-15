/**
 * Bulk command - Perform bulk operations on variables
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { apiRequest } from '../utils/api';
import { getConfig } from '../utils/config';

interface BulkOptions {
  project?: string;
  env?: string;
  yes?: boolean;
}

export const bulkCommand = new Command('bulk')
  .description('Perform bulk operations on variables');

// Bulk delete subcommand
bulkCommand
  .command('delete')
  .description('Delete multiple variables at once')
  .argument('<keys...>', 'Variable keys to delete')
  .option('-p, --project <slug>', 'Project slug (required)')
  .option('-e, --env <name>', 'Environment name (required)')
  .option('-y, --yes', 'Skip confirmation')
  .action(async (keys: string[], options: BulkOptions) => {
    try {
      const config = getConfig();
      if (!config || !config.token) {
        console.error(chalk.red('✖ Not logged in. Run `envshield login` first.'));
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

      if (keys.length === 0) {
        console.error(chalk.red('✖ At least one key is required'));
        process.exit(1);
      }

      // Show summary
      console.log(chalk.cyan(`\n🗑️  Bulk Delete\n`));
      console.log(`Project: ${chalk.bold(options.project)}`);
      console.log(`Environment: ${chalk.bold(options.env)}`);
      console.log(`\nVariables to delete:`);
      keys.forEach(key => console.log(chalk.red(`  - ${key}`)));
      console.log();

      // Confirm
      if (!options.yes) {
        const { confirm } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: `Delete ${keys.length} variable${keys.length !== 1 ? 's' : ''}?`,
            default: false,
          },
        ]);

        if (!confirm) {
          console.log(chalk.gray('\n✖ Bulk delete cancelled\n'));
          process.exit(0);
        }
      }

      // Delete variables one by one (could be optimized with batch endpoint)
      const spinner = ora('Deleting variables...').start();
      
      let deleted = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const key of keys) {
        try {
          // Find variable by key first
          const searchResponse = await apiRequest<{ results: Array<{ id: string }> }>(
            `/api/v1/search/variables?q=${encodeURIComponent(key)}&projectId=${options.project}`,
            { method: 'GET' }
          );

          const variable = searchResponse.results.find((r: any) => r.key === key);
          if (!variable) {
            errors.push(`Variable "${key}" not found`);
            failed++;
            continue;
          }

          // Delete variable (assuming DELETE endpoint exists)
          await apiRequest(
            `/api/v1/projects/${options.project}/environments/${options.env}/variables/${variable.id}`,
            { method: 'DELETE' }
          );

          deleted++;
        } catch (error) {
          errors.push(`Failed to delete "${key}": ${error instanceof Error ? error.message : 'Unknown error'}`);
          failed++;
        }
      }

      spinner.succeed('Bulk delete complete');

      // Results
      console.log(chalk.bold('\n✅ Bulk Delete Results:\n'));
      console.log(`${chalk.green('Deleted:')} ${deleted}`);
      console.log(`${chalk.red('Failed:')} ${failed}`);

      if (errors.length > 0) {
        console.log(chalk.red('\nErrors:'));
        errors.forEach(err => console.log(chalk.red(`  • ${err}`)));
      }

      console.log();
    } catch (error: unknown) {
      console.error(chalk.red(`\n✖ ${error instanceof Error ? error.message : 'Unknown error'}\n`));
      process.exit(1);
    }
  });

// Bulk update subcommand (placeholder for future implementation)
bulkCommand
  .command('update')
  .description('Update multiple variables at once (from file)')
  .option('-f, --file <path>', 'JSON file with updates')
  .option('-p, --project <slug>', 'Project slug (required)')
  .option('-e, --env <name>', 'Environment name (required)')
  .action(async () => {
    console.log(chalk.yellow('⚠️  Bulk update is not yet implemented'));
    console.log(chalk.gray('Use the import command for bulk updates instead:'));
    console.log(chalk.cyan('  envshield import --file updates.json --format json --strategy merge'));
  });
