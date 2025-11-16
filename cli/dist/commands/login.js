"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginCommand = loginCommand;
exports.registerLoginCommand = registerLoginCommand;
const inquirer_1 = __importDefault(require("inquirer"));
const child_process_1 = require("child_process");
const api_1 = require("../utils/api");
const config_1 = require("../utils/config");
const spinner_1 = require("../utils/spinner");
async function loginCommand(options = {}) {
    try {
        // If token provided, use token-based authentication (non-interactive)
        if (options.token) {
            return await tokenBasedLogin(options.token, options.profile, options.apiUrl);
        }
        // Device flow (default)
        const apiUrl = options.apiUrl || (0, config_1.getDefaultApiUrl)();
        const api = (0, api_1.createApiClient)();
        api.defaults.baseURL = apiUrl;
        const { tokenName } = await inquirer_1.default.prompt([
            {
                type: 'input',
                name: 'tokenName',
                message: 'Token name (optional):',
                default: `CLI Token - ${new Date().toLocaleDateString()}`,
            },
        ]);
        const startSpinnerInst = (0, spinner_1.startSpinner)('Starting CLI login...');
        try {
            const { data: startData } = await api.post('/cli/auth/device/start', { tokenName });
            startSpinnerInst.succeed('Browser login started');
            console.log(`\nPlease complete login in your browser at:\n  ${startData.verificationUrl}\n`);
            try {
                await openInBrowser(startData.verificationUrl);
            }
            catch {
                console.log('Unable to open browser automatically. Please open the URL manually.');
            }
            const pollSpinner = (0, spinner_1.startSpinner)('Waiting for browser approval...');
            const maxDurationMs = 15 * 60 * 1000;
            const startTime = Date.now();
            const pollIntervalMs = (startData.pollInterval ?? 5) * 1000;
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
                    let pollResponse = res.data;
                    if (res.status === 410) {
                        pollResponse = { status: 'expired', message: res.data?.message };
                    }
                    if (pollResponse.status === 'pending') {
                        await new Promise((r) => setTimeout(r, pollIntervalMs));
                        continue;
                    }
                    if (pollResponse.status === 'approved') {
                        pollSpinner.succeed('CLI login approved');
                        (0, config_1.saveConfig)({
                            apiUrl,
                            token: pollResponse.token,
                            tokenId: pollResponse.tokenId,
                            tokenName: pollResponse.tokenName,
                            expiresAt: pollResponse.expiresAt,
                        }, options.profile);
                        (0, spinner_1.success)(`Logged in successfully${options.profile ? ` (profile: ${options.profile})` : ''}`);
                        console.log('Token saved to ~/.envshield/config.json');
                        return;
                    }
                    if (pollResponse.status === 'expired') {
                        pollSpinner.fail(pollResponse.message || 'CLI login expired');
                        process.exit(1);
                    }
                }
                catch (err) {
                    pollSpinner.fail('Error polling for CLI login status');
                    (0, api_1.handleApiError)(err);
                }
            }
        }
        catch (error) {
            startSpinnerInst.fail('Failed to start CLI login');
            (0, api_1.handleApiError)(error);
        }
    }
    catch (error) {
        if (error instanceof Error && error.message.includes('User force closed')) {
            console.log('\nLogin cancelled');
            process.exit(0);
        }
        throw error;
    }
}
async function tokenBasedLogin(token, profile, apiUrlOverride) {
    const apiUrl = apiUrlOverride || (0, config_1.getDefaultApiUrl)();
    const api = (0, api_1.createApiClient)();
    api.defaults.baseURL = apiUrl;
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    const spinner = (0, spinner_1.startSpinner)('Validating token...');
    try {
        const response = await api.get('/cli/whoami');
        spinner.succeed('Token validated successfully');
        // Save config
        (0, config_1.saveConfig)({
            apiUrl,
            token,
        }, profile);
        (0, spinner_1.success)(`Logged in successfully${profile ? ` (profile: ${profile})` : ''}`);
        console.log(`Token saved to ~/.envshield/config.json`);
    }
    catch (error) {
        spinner.fail('Token validation failed');
        (0, api_1.handleApiError)(error);
    }
}
function registerLoginCommand(program) {
    program
        .command('login')
        .description('Authenticate with EnvShield')
        .option('-t, --token <token>', 'API token for non-interactive authentication (generated from dashboard)')
        .option('-p, --profile <name>', 'Profile name for multi-profile support')
        .option('--api-url <url>', 'Custom API URL')
        .action(loginCommand);
}
function openInBrowser(url) {
    return new Promise((resolve, reject) => {
        const platform = process.platform;
        let cmd;
        let args;
        if (platform === 'win32') {
            cmd = 'cmd';
            args = ['/c', 'start', '', url];
        }
        else if (platform === 'darwin') {
            cmd = 'open';
            args = [url];
        }
        else {
            cmd = 'xdg-open';
            args = [url];
        }
        const child = (0, child_process_1.spawn)(cmd, args, { stdio: 'ignore' });
        child.on('error', reject);
        child.on('close', () => resolve());
    });
}
//# sourceMappingURL=login.js.map