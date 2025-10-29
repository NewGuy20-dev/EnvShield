import fs from 'fs';
import path from 'path';
import { createApiClient, handleApiError } from '../utils/api';
import { requireAuth } from '../utils/config';
import { startSpinner, header, table, warning, error as errorMsg } from '../utils/spinner';

interface EnvShieldConfig {
  projectSlug: string;
  environment: string;
}

export async function viewCommand(options: { env?: string; reveal?: boolean; filter?: string }) {
  try {
    requireAuth();

    let projectSlug: string;
    let environment: string;

    // Try to read from .envshield file if env not provided
    if (!options.env) {
      const configPath = path.join(process.cwd(), '.envshield');
      if (!fs.existsSync(configPath)) {
        errorMsg('.envshield file not found');
        console.log('Run "envshield init" first or use --env flag');
        process.exit(1);
      }

      const config = JSON.parse(fs.readFileSync(configPath, 'utf8')) as EnvShieldConfig;
      projectSlug = config.projectSlug;
      environment = config.environment;
    } else {
      // Parse env flag: format is "project-slug/environment"
      const parts = options.env.split('/');
      if (parts.length !== 2) {
        errorMsg('Invalid --env format');
        console.log('Use format: --env project-slug/environment');
        process.exit(1);
      }
      projectSlug = parts[0];
      environment = parts[1];
    }

    const spinner = startSpinner(`Fetching variables from ${projectSlug}/${environment}...`);
    const api = createApiClient();

    try {
      const response = await api.post('/cli/pull', {
        projectSlug,
        environment,
      });

      let variables = response.data.variables || [];
      spinner.succeed(`Fetched ${variables.length} variable(s)`);

      if (variables.length === 0) {
        console.log('');
        console.log('No variables found in this environment');
        return;
      }

      // Apply filter if provided
      if (options.filter) {
        const filterLower = options.filter.toLowerCase();
        variables = variables.filter((v: any) => 
          v.key.toLowerCase().includes(filterLower) ||
          v.description?.toLowerCase().includes(filterLower)
        );
        
        if (variables.length === 0) {
          console.log('');
          console.log(`No variables matching filter: ${options.filter}`);
          return;
        }
      }

      console.log('');
      header(`${projectSlug}/${environment} (${variables.length} variables)`);

      // Prepare table data
      const rows = variables.map((v: any) => {
        let value = v.value;
        
        // Mask value unless --reveal flag is used
        if (!options.reveal) {
          if (value.length <= 4) {
            value = '••••';
          } else {
            // Show first 2 and last 2 characters
            value = `${value.substring(0, 2)}${'•'.repeat(Math.min(8, value.length - 4))}${value.substring(value.length - 2)}`;
          }
        }

        return [
          v.key,
          value,
          v.description || '',
          v.error ? '⚠️  Error' : '✓',
        ];
      });

      table(
        ['Key', 'Value', 'Description', 'Status'],
        rows
      );

      if (!options.reveal) {
        console.log('');
        console.log('💡 Tip: Use --reveal flag to show full values');
      }

      if (variables.some((v: any) => v.error)) {
        console.log('');
        warning('Some variables failed to decrypt');
      }
    } catch (error) {
      spinner.fail('Failed to fetch variables');
      handleApiError(error);
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error('❌', error.message);
      process.exit(1);
    }
    throw error;
  }
}
