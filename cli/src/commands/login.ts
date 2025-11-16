import inquirer from 'inquirer';
import { spawn } from 'child_process';
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
    // Device flow (default)
    const apiUrl = options.apiUrl || getDefaultApiUrl();
    const api = createApiClient();
    api.defaults.baseURL = apiUrl;

    const { tokenName } = await inquirer.prompt([
      {
        type: 'input',
        name: 'tokenName',
        message: 'Token name (optional):',
        default: `CLI Token - ${new Date().toLocaleDateString()}`,
      },
    ]);

    const startSpinnerInst = startSpinner('Starting CLI login...');
    try {
      const { data: startData } = await api.post(
        '/cli/auth/device/start',
        { tokenName }
      );
      startSpinnerInst.succeed('Browser login started');

      console.log(`\nPlease complete login in your browser at:\n  ${startData.verificationUrl}\n`);
      try {
        await openInBrowser(startData.verificationUrl);
      } catch {
        console.log('Unable to open browser automatically. Please open the URL manually.');
      }

      const pollSpinner = startSpinner('Waiting for browser approval...');
      const maxDurationMs = 15 * 60 * 1000;
      const startTime = Date.now();
      const pollIntervalMs = ((startData.pollInterval ?? 5) as number) * 1000;

      while (true) {
        if (Date.now() - startTime > maxDurationMs) {
          pollSpinner.fail('CLI login timed out');
          process.exit(1);
        }

        try {
          const res = await api.get('/cli/auth/device/poll', {
            params: { deviceCode: startData.deviceCode },
            validateStatus: () => true,
          });
          let pollResponse = res.data as any;
          if (res.status === 410) {
            pollResponse = { status: 'expired', message: res.data?.message };
          }

          if (pollResponse.status === 'pending') {
            await new Promise((r) => setTimeout(r, pollIntervalMs));
            continue;
          }

          if (pollResponse.status === 'approved') {
            pollSpinner.succeed('CLI login approved');
            saveConfig(
              {
                apiUrl,
                token: pollResponse.token,
                tokenId: pollResponse.tokenId,
                tokenName: pollResponse.tokenName,
                expiresAt: pollResponse.expiresAt,
              },
              options.profile
            );
            success(
              `Logged in successfully${options.profile ? ` (profile: ${options.profile})` : ''}`
            );
            console.log('Token saved to ~/.envshield/config.json');
            return;
          }

          if (pollResponse.status === 'expired') {
            pollSpinner.fail(pollResponse.message || 'CLI login expired');
            process.exit(1);
          }
        } catch (err) {
          pollSpinner.fail('Error polling for CLI login status');
          handleApiError(err);
        }
      }
    } catch (error: any) {
      startSpinnerInst.fail('Failed to start CLI login');
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

function openInBrowser(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const platform = process.platform;
    let cmd: string;
    let args: string[];
    if (platform === 'win32') {
      cmd = 'cmd';
      args = ['/c', 'start', '', url];
    } else if (platform === 'darwin') {
      cmd = 'open';
      args = [url];
    } else {
      cmd = 'xdg-open';
      args = [url];
    }
    const child = spawn(cmd, args, { stdio: 'ignore' });
    child.on('error', reject);
    child.on('close', () => resolve());
  });
}
