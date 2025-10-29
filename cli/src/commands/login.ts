import inquirer from 'inquirer';
import { createApiClient, handleApiError } from '../utils/api';
import { saveConfig, getDefaultApiUrl } from '../utils/config';
import { startSpinner, success } from '../utils/spinner';

export async function loginCommand() {
  try {
    // Prompt for credentials
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'email',
        message: 'Email:',
        validate: (input) => {
          if (!input || !input.includes('@')) {
            return 'Please enter a valid email address';
          }
          return true;
        },
      },
      {
        type: 'password',
        name: 'password',
        message: 'Password:',
        mask: '*',
        validate: (input) => {
          if (!input || input.length < 8) {
            return 'Password must be at least 8 characters';
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

    const spinner = startSpinner('Authenticating...');

    try {
      const api = createApiClient();
      api.defaults.baseURL = apiUrlAnswer.apiUrl;

      // Call CLI auth endpoint
      const response = await api.post('/cli/auth', {
        email: answers.email,
        password: answers.password,
        tokenName: `CLI - ${new Date().toLocaleDateString()}`,
      });

      spinner.succeed('Authenticated successfully');

      // Save config
      saveConfig({
        apiUrl: apiUrlAnswer.apiUrl,
        token: response.data.token,
        email: answers.email,
      });

      success(`Logged in as ${answers.email}`);
      console.log(`Token saved to ~/.envshield/config.json`);
      console.log(`Token expires: ${new Date(response.data.expiresAt).toLocaleDateString()}`);
    } catch (error) {
      spinner.fail('Authentication failed');
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
