"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginCommand = loginCommand;
const inquirer_1 = __importDefault(require("inquirer"));
const api_1 = require("../utils/api");
const config_1 = require("../utils/config");
const spinner_1 = require("../utils/spinner");
async function loginCommand() {
    try {
        // Prompt for credentials
        const answers = await inquirer_1.default.prompt([
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
        const apiUrlAnswer = await inquirer_1.default.prompt([
            {
                type: 'input',
                name: 'apiUrl',
                message: 'API URL (press Enter for default):',
                default: (0, config_1.getDefaultApiUrl)(),
            },
        ]);
        const spinner = (0, spinner_1.startSpinner)('Authenticating...');
        try {
            const api = (0, api_1.createApiClient)();
            api.defaults.baseURL = apiUrlAnswer.apiUrl;
            // Call CLI auth endpoint
            const response = await api.post('/cli/auth', {
                email: answers.email,
                password: answers.password,
                tokenName: `CLI - ${new Date().toLocaleDateString()}`,
            });
            spinner.succeed('Authenticated successfully');
            // Save config
            (0, config_1.saveConfig)({
                apiUrl: apiUrlAnswer.apiUrl,
                token: response.data.token,
                email: answers.email,
            });
            (0, spinner_1.success)(`Logged in as ${answers.email}`);
            console.log(`Token saved to ~/.envshield/config.json`);
            console.log(`Token expires: ${new Date(response.data.expiresAt).toLocaleDateString()}`);
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
//# sourceMappingURL=login.js.map