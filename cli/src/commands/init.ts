import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import { createApiClient, handleApiError } from '../utils/api';
import { requireAuth } from '../utils/config';
import { startSpinner, success, error as errorMsg, warning } from '../utils/spinner';

interface EnvShieldConfig {
  projectSlug: string;
  environment: string;
}

export async function initCommand() {
  try {
    requireAuth();

    const configPath = path.join(process.cwd(), '.envshield');

    // Check if .envshield already exists
    if (fs.existsSync(configPath)) {
      const existing = JSON.parse(fs.readFileSync(configPath, 'utf8')) as EnvShieldConfig;
      warning(`.envshield file already exists`);
      console.log(`Current configuration:`);
      console.log(`  Project: ${existing.projectSlug}`);
      console.log(`  Environment: ${existing.environment}`);
      console.log('');

      const { overwrite } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'overwrite',
          message: 'Do you want to overwrite it?',
          default: false,
        },
      ]);

      if (!overwrite) {
        console.log('Initialization cancelled');
        return;
      }
    }

    // Fetch projects
    const spinner = startSpinner('Fetching projects...');
    const api = createApiClient();

    try {
      const projectsResponse = await api.get('/projects');
      const projects = projectsResponse.data.projects || [];

      if (projects.length === 0) {
        spinner.fail('No projects found');
        errorMsg('You have no projects yet');
        console.log('Create a project in the web dashboard first.');
        process.exit(1);
      }

      spinner.succeed(`Found ${projects.length} project(s)`);

      // Prompt for project selection
      const { projectSlug } = await inquirer.prompt([
        {
          type: 'list',
          name: 'projectSlug',
          message: 'Select a project:',
          choices: projects.map((p: any) => ({
            name: `${p.name} (${p.slug}) - ${p.role}`,
            value: p.slug,
          })),
        },
      ]);

      // Fetch environments for selected project
      const envSpinner = startSpinner('Fetching environments...');
      const envResponse = await api.get(`/projects/${projectSlug}/environments`);
      const environments = envResponse.data.environments || [];

      if (environments.length === 0) {
        envSpinner.fail('No environments found');
        errorMsg('This project has no environments yet');
        console.log('Create an environment in the web dashboard first.');
        process.exit(1);
      }

      envSpinner.succeed(`Found ${environments.length} environment(s)`);

      // Prompt for environment selection
      const { environment } = await inquirer.prompt([
        {
          type: 'list',
          name: 'environment',
          message: 'Select an environment:',
          choices: environments.map((e: any) => ({
            name: `${e.name} (${e.slug}) - ${e.variablesCount || 0} variables`,
            value: e.slug,
          })),
        },
      ]);

      // Save .envshield file
      const config: EnvShieldConfig = {
        projectSlug,
        environment,
      };

      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');

      success('Initialized successfully');
      console.log('Configuration saved to .envshield');
      console.log(`  Project: ${projectSlug}`);
      console.log(`  Environment: ${environment}`);
      console.log('');
      console.log('You can now run "envshield pull" to fetch variables');
    } catch (error) {
      spinner.fail('Failed to initialize');
      handleApiError(error);
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('User force closed')) {
        console.log('\nInitialization cancelled');
        process.exit(0);
      }
      console.error('❌', error.message);
      process.exit(1);
    }
    throw error;
  }
}
