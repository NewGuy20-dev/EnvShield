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
        // Prompt for API token
        const answers = await inquirer_1.default.prompt([
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
        const apiUrlAnswer = await inquirer_1.default.prompt([
            {
                type: 'input',
                name: 'apiUrl',
                message: 'API URL (press Enter for default):',
                default: (0, config_1.getDefaultApiUrl)(),
            },
        ]);
        const spinner = (0, spinner_1.startSpinner)('Validating token...');
        try {
            const api = (0, api_1.createApiClient)();
            api.defaults.baseURL = apiUrlAnswer.apiUrl;
            api.defaults.headers.common['Authorization'] = `Bearer ${answers.token}`;
            // Validate token by calling whoami endpoint
            await api.get('/cli/whoami');
            spinner.succeed('Token validated successfully');
            // Save config
            (0, config_1.saveConfig)({
                apiUrl: apiUrlAnswer.apiUrl,
                token: answers.token,
            });
            (0, spinner_1.success)('Logged in successfully');
            console.log(`Token saved to ~/.envshield/config.json`);
        }
        catch (error) {
            spinner.fail('Token validation failed');
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