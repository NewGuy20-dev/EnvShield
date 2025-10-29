"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.whoamiCommand = whoamiCommand;
const api_1 = require("../utils/api");
const config_1 = require("../utils/config");
const spinner_1 = require("../utils/spinner");
async function whoamiCommand() {
    try {
        (0, config_1.requireAuth)();
        const spinner = (0, spinner_1.startSpinner)('Fetching user info...');
        const api = (0, api_1.createApiClient)();
        try {
            const response = await api.get('/cli/whoami');
            spinner.succeed('User info retrieved');
            const { user, token } = response.data;
            (0, spinner_1.header)('User Information');
            (0, spinner_1.formatKeyValue)('Email', user.email);
            (0, spinner_1.formatKeyValue)('Name', user.name || '(not set)');
            (0, spinner_1.formatKeyValue)('ID', user.id);
            if (token) {
                console.log('');
                (0, spinner_1.header)('Token Information');
                (0, spinner_1.formatKeyValue)('Name', token.name || '(not set)');
                (0, spinner_1.formatKeyValue)('ID', token.id);
            }
        }
        catch (error) {
            spinner.fail('Failed to fetch user info');
            (0, api_1.handleApiError)(error);
        }
    }
    catch (error) {
        if (error instanceof Error) {
            console.error('❌', error.message);
            process.exit(1);
        }
        throw error;
    }
}
//# sourceMappingURL=whoami.js.map