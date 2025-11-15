import inquirer from 'inquirer';
import { createApiClient, handleApiError } from '../utils/api';
import { saveConfig, getDefaultApiUrl } from '../utils/config';
import { startSpinner, success } from '../utils/spinner';
import { Command } from 'commander';

interface LoginOptions {
  token?: string;
  profile?: string;
  apiUrl?: string;
}

export async function loginCommand(options: LoginOptions = {}) {
  try {
    // If token provided, use token-based authentication (non-interactive)
    if (options.token) {
      return await tokenBasedLogin(options.token, options.profile, options.apiUrl);
    }

    // Interactive email/password/2FA authentication
    const apiUrl = options.apiUrl || getDefaultApiUrl();
    const api = createApiClient();
    api.defaults.baseURL = apiUrl;

    // Prompt for credentials
    const { email, password } = await inquirer.prompt([
      {
        type: 'input',
        name: 'email',
        message: 'Email:',
        validate: (input) => {
          if (!input) return 'Email is required';
          if (!/\S+@\S+\.\S+/.test(input)) return 'Invalid email format';
          return true;
        },
      },
      {
        type: 'password',
        name: 'password',
        message: 'Password:',
        mask: '*',
        validate: (input) => (input ? true : 'Password is required'),
      },
    ]);

    // Prompt for optional token name
    const { tokenName } = await inquirer.prompt([
      {
        type: 'input',
        name: 'tokenName',
        message: 'Token name (optional):',
        default: `CLI Token - ${new Date().toLocaleDateString()}`,
      },
    ]);

    const spinner = startSpinner('Authenticating...');

    try {
      let response = await api.post(
        '/cli/auth',
        {
          email,
          password,
          tokenName,
        },
        {
          validateStatus: (status) =>
            (status >= 200 && status < 300) || status === 428,
        }
      );

      // Check if 2FA is required
      if (response.status === 428 && response.data.twoFactorRequired) {
        spinner.stop();
        console.log('\n🔐 Two-factor authentication required');

        const { code, method } = await inquirer.prompt([
          {
            type: 'list',
            name: 'method',
            message: 'Select verification method:',
            choices: [
              { name: 'Authenticator App (TOTP)', value: 'totp' },
              { name: 'Backup Code', value: 'backup' },
            ],
          },
          {
            type: 'input',
            name: 'code',
            message: (answers: any) =>
              answers.method === 'totp'
                ? '6-digit code from authenticator app:'
                : 'Backup code:',
            validate: (input) => (input ? true : 'Code is required'),
          },
        ]);

        // Retry with 2FA code
        spinner.start('Verifying 2FA code...');
        const payload: any = { email, password, tokenName };
        if (method === 'totp') {
          payload.twoFactorToken = code;
        } else {
          payload.backupCode = code;
        }
        response = await api.post('/cli/auth', payload, {
          validateStatus: (status) =>
            (status >= 200 && status < 300) || status === 428,
        });
      }

      if (response.data.token) {
        spinner.succeed('Authentication successful');

        // Save config
        saveConfig(
          {
            apiUrl,
            token: response.data.token,
            tokenId: response.data.tokenId,
            tokenName: response.data.tokenName,
            expiresAt: response.data.expiresAt,
          },
          options.profile
        );

        success(
          `Logged in successfully as ${email}${
            options.profile ? ` (profile: ${options.profile})` : ''
          }`
        );
        console.log(`Token saved to ~/.envshield/config.json`);
        if (response.data.expiresAt) {
          const expiresDate = new Date(response.data.expiresAt);
          console.log(`Token expires: ${expiresDate.toLocaleDateString()}`);
        }
      } else {
        spinner.fail('Authentication failed');
        console.error('No token received from server');
        process.exit(1);
      }
    } catch (error: any) {
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

async function tokenBasedLogin(
  token: string,
  profile?: string,
  apiUrlOverride?: string
) {
  const apiUrl = apiUrlOverride || getDefaultApiUrl();
  const api = createApiClient();
  api.defaults.baseURL = apiUrl;
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

  const spinner = startSpinner('Validating token...');

  try {
    const response = await api.get('/cli/whoami');
    spinner.succeed('Token validated successfully');

    // Save config
    saveConfig(
      {
        apiUrl,
        token,
      },
      profile
    );

    success(
      `Logged in successfully${profile ? ` (profile: ${profile})` : ''}`
    );
    console.log(`Token saved to ~/.envshield/config.json`);
  } catch (error) {
    spinner.fail('Token validation failed');
    handleApiError(error);
  }
}

export function registerLoginCommand(program: Command) {
  program
    .command('login')
    .description('Authenticate with EnvShield')
    .option(
      '-t, --token <token>',
      'API token for non-interactive authentication (generated from dashboard)'
    )
    .option('-p, --profile <name>', 'Profile name for multi-profile support')
    .option('--api-url <url>', 'Custom API URL')
    .action(loginCommand);
}
