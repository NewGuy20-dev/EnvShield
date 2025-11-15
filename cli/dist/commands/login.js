"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginCommand = loginCommand;
exports.registerLoginCommand = registerLoginCommand;
const inquirer_1 = __importDefault(require("inquirer"));
const api_1 = require("../utils/api");
const config_1 = require("../utils/config");
const spinner_1 = require("../utils/spinner");
async function loginCommand(options = {}) {
    try {
        // If token provided, use token-based authentication (non-interactive)
        if (options.token) {
            return await tokenBasedLogin(options.token, options.profile, options.apiUrl);
        }
        // Interactive email/password/2FA authentication
        const apiUrl = options.apiUrl || (0, config_1.getDefaultApiUrl)();
        const api = (0, api_1.createApiClient)();
        api.defaults.baseURL = apiUrl;
        // Prompt for credentials
        const { email, password } = await inquirer_1.default.prompt([
            {
                type: 'input',
                name: 'email',
                message: 'Email:',
                validate: (input) => {
                    if (!input)
                        return 'Email is required';
                    if (!/\S+@\S+\.\S+/.test(input))
                        return 'Invalid email format';
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
        const { tokenName } = await inquirer_1.default.prompt([
            {
                type: 'input',
                name: 'tokenName',
                message: 'Token name (optional):',
                default: `CLI Token - ${new Date().toLocaleDateString()}`,
            },
        ]);
        const spinner = (0, spinner_1.startSpinner)('Authenticating...');
        try {
            let response = await api.post('/cli/auth', {
                email,
                password,
                tokenName,
            }, {
                validateStatus: (status) => (status >= 200 && status < 300) || status === 428,
            });
            // Check if 2FA is required
            if (response.status === 428 && response.data.twoFactorRequired) {
                spinner.stop();
                console.log('\n🔐 Two-factor authentication required');
                const { code, method } = await inquirer_1.default.prompt([
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
                        message: (answers) => answers.method === 'totp'
                            ? '6-digit code from authenticator app:'
                            : 'Backup code:',
                        validate: (input) => (input ? true : 'Code is required'),
                    },
                ]);
                // Retry with 2FA code
                spinner.start('Verifying 2FA code...');
                const payload = { email, password, tokenName };
                if (method === 'totp') {
                    payload.twoFactorToken = code;
                }
                else {
                    payload.backupCode = code;
                }
                response = await api.post('/cli/auth', payload, {
                    validateStatus: (status) => (status >= 200 && status < 300) || status === 428,
                });
            }
            if (response.data.token) {
                spinner.succeed('Authentication successful');
                // Save config
                (0, config_1.saveConfig)({
                    apiUrl,
                    token: response.data.token,
                    tokenId: response.data.tokenId,
                    tokenName: response.data.tokenName,
                    expiresAt: response.data.expiresAt,
                }, options.profile);
                (0, spinner_1.success)(`Logged in successfully as ${email}${options.profile ? ` (profile: ${options.profile})` : ''}`);
                console.log(`Token saved to ~/.envshield/config.json`);
                if (response.data.expiresAt) {
                    const expiresDate = new Date(response.data.expiresAt);
                    console.log(`Token expires: ${expiresDate.toLocaleDateString()}`);
                }
            }
            else {
                spinner.fail('Authentication failed');
                console.error('No token received from server');
                process.exit(1);
            }
        }
        catch (error) {
            spinner.fail('Authentication failed');
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
//# sourceMappingURL=login.js.map