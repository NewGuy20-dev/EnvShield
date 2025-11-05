import inquirer from 'inquirer';
import { createApiClient, handleApiError } from '../utils/api';
import { saveConfig, getDefaultApiUrl } from '../utils/config';
import { startSpinner, success } from '../utils/spinner';

export async function loginCommand() {
  try {
    // Prompt for API token
    const answers = await inquirer.prompt([
      {
        type: 'password',
        name: 'token',
        message: 'API Token (generated from dashboard):',
        mask: '*',
        validate: (input) => {
          if (!input) {
            return 'Token is required';
          }
          if (!input.startsWith('esh_')) {
            return 'Invalid token format. Tokens should start with "esh_"';
          }
          if (input.length < 20) {
            return 'Token appears to be too short';
          }
          return true;
        },
      },
    ]);

    // Prompt for API URL (optional)
    const apiUrlAnswer = await inquirer.prompt([
      {
        type: 'input',
        name: 'apiUrl',
        message: 'API URL (press Enter for default):',
        default: getDefaultApiUrl(),
      },
    ]);

    const spinner = startSpinner('Validating token...');

    try {
      const api = createApiClient();
      api.defaults.baseURL = apiUrlAnswer.apiUrl;
      api.defaults.headers.common['Authorization'] = `Bearer ${answers.token}`;

      // Validate token by calling whoami endpoint
      await api.get('/cli/whoami');

      spinner.succeed('Token validated successfully');

      // Save config
      saveConfig({
        apiUrl: apiUrlAnswer.apiUrl,
        token: answers.token,
      });

      success('Logged in successfully');
      console.log(`Token saved to ~/.envshield/config.json`);
    } catch (error) {
      spinner.fail('Token validation failed');
      handleApiError(error);
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('User force closed')) {
      console.log('\nLogin cancelled');
      process.exit(0);
    }
    throw error;
  }
}
