import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import { createApiClient, handleApiError } from '../utils/api';
import { requireAuth } from '../utils/config';
import { parseEnvFile } from '../utils/env-parser';
import { startSpinner, success, error as errorMsg, warning, info } from '../utils/spinner';

interface EnvShieldConfig {
  projectSlug: string;
  environment: string;
}

export async function pushCommand(options: { env?: string; file?: string }) {
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

    // Determine source file: prioritize .env.local, then .env
    let sourceFile = options.file;
    if (!sourceFile) {
      if (fs.existsSync('.env.local')) {
        sourceFile = '.env.local';
      } else if (fs.existsSync('.env')) {
        sourceFile = '.env';
      } else {
        errorMsg('No .env or .env.local file found');
        console.log('Create a .env or .env.local file with your environment variables');
        process.exit(1);
      }
    }

    // Check if source file exists
    if (!fs.existsSync(sourceFile)) {
      errorMsg(`File not found: ${sourceFile}`);
      process.exit(1);
    }

    info(`Reading ${sourceFile}...`);
    const localVariables = parseEnvFile(sourceFile);

    if (localVariables.length === 0) {
      warning('No variables found in file');
      process.exit(0);
    }

    const spinner = startSpinner('Fetching remote variables...');
    const api = createApiClient();

    try {
      // Fetch remote variables to compare
      const remoteResponse = await api.post('/cli/pull', {
        projectSlug,
        environment,
      });

      const remoteVariables = remoteResponse.data.variables || [];
      spinner.succeed('Remote variables fetched');

      // Calculate diff
      const remoteKeys = new Set(remoteVariables.map((v: any) => v.key));
      const localKeys = new Set(localVariables.map((v) => v.key));

      const toCreate = localVariables.filter((v) => !remoteKeys.has(v.key));
      const toUpdate = localVariables.filter((v) => {
        if (!remoteKeys.has(v.key)) return false;
        const remote = remoteVariables.find((r: any) => r.key === v.key);
        return remote && remote.value !== v.value;
      });

      const totalChanges = toCreate.length + toUpdate.length;

      if (totalChanges === 0) {
        info('No changes to push');
        console.log('Local and remote variables are in sync');
        return;
      }

        // Display diff summary
        console.log('');
        console.log('Changes to be pushed:');
        if (toCreate.length > 0) {
          console.log(`  ${toCreate.length} new variable(s) to create`);
          toCreate.slice(0, 5).forEach((v) => console.log(`    + ${v.key}`));
          if (toCreate.length > 5) {
            console.log(`    ... and ${toCreate.length - 5} more`);
          }
        }
        if (toUpdate.length > 0) {
          console.log(`  ${toUpdate.length} variable(s) to update`);
          toUpdate.slice(0, 5).forEach((v) => console.log(`    ~ ${v.key}`));
          if (toUpdate.length > 5) {
            console.log(`    ... and ${toUpdate.length - 5} more`);
          }
        }
        console.log('');

        // Confirm
        const { confirm } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: `This will push ${totalChanges} variable(s) to ${projectSlug}/${environment}. Continue?`,
            default: true,
          },
        ]);

        if (!confirm) {
          console.log('Push cancelled');
          return;
        }

        // Push changes
        const pushSpinner = startSpinner(`Pushing ${totalChanges} variable(s)...`);

        const pushResponse = await api.post('/cli/push', {
          projectSlug,
          environment,
          variables: localVariables,
        });

        const changes = pushResponse.data.changes;
        pushSpinner.succeed(
          `Pushed ${changes.total} variable(s) (${changes.created} created, ${changes.updated} updated)`
        );

        if (pushResponse.data.errors && pushResponse.data.errors.length > 0) {
          warning('Some variables failed to push:');
          pushResponse.data.errors.forEach((err: string) => console.log(`  - ${err}`));
        }

        success('Push completed successfully');
    } catch (error) {
      spinner.fail('Push failed');
      handleApiError(error);
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('User force closed')) {
        console.log('\nPush cancelled');
        process.exit(0);
      }
      console.error('❌', error.message);
      process.exit(1);
    }
    throw error;
  }
}
