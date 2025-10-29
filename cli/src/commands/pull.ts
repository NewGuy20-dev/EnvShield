import fs from 'fs';
import path from 'path';
import { Command } from 'commander';
import { createApiClient, handleApiError } from '../utils/api';
import { requireAuth } from '../utils/config';
import { writeEnvFile } from '../utils/env-parser';
import { startSpinner, success, error as errorMsg, warning } from '../utils/spinner';

interface EnvShieldConfig {
  projectSlug: string;
  environment: string;
}

export async function pullCommand(options: { env?: string; output?: string }) {
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

    const outputFile = options.output || '.env';

    // Check if output file exists
    if (fs.existsSync(outputFile)) {
      warning(`${outputFile} already exists and will be overwritten`);
    }

    const spinner = startSpinner(`Pulling variables from ${projectSlug} (${environment})...`);
    const api = createApiClient();

    try {
      const response = await api.post('/cli/pull', {
        projectSlug,
        environment,
      });

      const variables = response.data.variables || [];
      
      spinner.text = `Pull progress: ${variables.length} variables`;
      
      // Write to file
      writeEnvFile(outputFile, variables);

      spinner.succeed(`Pulled ${variables.length} variable(s) to ${outputFile}`);
      
      if (variables.some((v: any) => v.error)) {
        warning('Some variables failed to decrypt');
      }

      success(`Successfully synced with ${projectSlug}/${environment}`);
    } catch (error) {
      spinner.fail('Pull failed');
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
