/**
 * Search command - Search for variables across projects
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { apiRequest } from '../utils/api';
import { getConfig } from '../utils/config';

interface SearchOptions {
  project?: string;
  env?: string;
  decrypt?: boolean;
  json?: boolean;
}

interface SearchResult {
  id: string;
  key: string;
  value: string;
  description?: string;
  environment: { name: string; slug: string };
  project: { name: string; slug: string };
  updatedAt: string;
  canDecrypt: boolean;
}

export const searchCommand = new Command('search')
  .description('Search for variables across projects')
  .argument('<query>', 'Search query')
  .option('-p, --project <slug>', 'Filter by project slug')
  .option('-e, --env <name>', 'Filter by environment name')
  .option('--decrypt', 'Show full decrypted values (requires DEVELOPER+ role)')
  .option('--json', 'Output results in JSON format')
  .action(async (query: string, options: SearchOptions) => {
    try {
      const config = getConfig();
      if (!config || !config.token) {
        console.error(chalk.red('✖ Not logged in. Run `envshield login` first.'));
        process.exit(1);
      }

      if (!query || query.trim().length === 0) {
        console.error(chalk.red('✖ Search query is required'));
        process.exit(1);
      }

      const spinner = ora('Searching...').start();

      try {
        // Build query params
        const params = new URLSearchParams({
          q: query,
          limit: '50',
        });

        if (options.project) params.append('projectId', options.project);
        if (options.env) params.append('environmentId', options.env);
        if (options.decrypt) params.append('decrypt', 'true');

        const response = await apiRequest<{
          results: SearchResult[];
          pagination: { page: number; limit: number; total: number; totalPages: number };
        }>(`/api/v1/search/variables?${params.toString()}`, {
          method: 'GET',
        });

        spinner.succeed(`Found ${response.results.length} result${response.results.length !== 1 ? 's' : ''}`);

        if (options.json) {
          // JSON output
          console.log(JSON.stringify(response, null, 2));
          return;
        }

        if (response.results.length === 0) {
          console.log(chalk.gray(`\nNo variables found matching "${query}"\n`));
          return;
        }

        // Table output
        console.log(); // Empty line

        response.results.forEach((result: SearchResult, index: number) => {
          if (index > 0) {
            console.log(chalk.gray('─'.repeat(80)));
          }

          // Key
          console.log(chalk.bold.cyan(result.key));

          // Value
          const valueLabel = result.canDecrypt ? '' : chalk.yellow('(masked) ');
          console.log(`${valueLabel}${chalk.white(result.value)}`);

          // Description
          if (result.description) {
            console.log(chalk.gray(result.description));
          }

          // Metadata
          const metadata = [
            chalk.bold(result.project.name),
            result.environment.name,
            new Date(result.updatedAt).toLocaleDateString(),
          ].join(chalk.gray(' • '));
          console.log(chalk.gray(metadata));
        });

        console.log(); // Empty line

        // Pagination info
        if (response.pagination.total > response.pagination.limit) {
          console.log(
            chalk.gray(
              `Showing ${response.results.length} of ${response.pagination.total} results. Use API for pagination.`
            )
          );
          console.log();
        }

        // Decrypt hint
        if (!options.decrypt && response.results.some((r: SearchResult) => r.canDecrypt)) {
          console.log(chalk.blue('ℹ Use --decrypt to show full values\n'));
        }
      } catch (error: unknown) {
        spinner.fail('Search failed');
        console.error(chalk.red(`\n✖ ${error instanceof Error ? error.message : 'Unknown error'}\n`));
        process.exit(1);
      }
    } catch (error: unknown) {
      console.error(chalk.red(`\n✖ ${error instanceof Error ? error.message : 'Unknown error'}\n`));
      process.exit(1);
    }
  });
