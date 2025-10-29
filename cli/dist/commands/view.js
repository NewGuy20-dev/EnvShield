"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.viewCommand = viewCommand;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const api_1 = require("../utils/api");
const config_1 = require("../utils/config");
const spinner_1 = require("../utils/spinner");
async function viewCommand(options) {
    try {
        (0, config_1.requireAuth)();
        let projectSlug;
        let environment;
        // Try to read from .envshield file if env not provided
        if (!options.env) {
            const configPath = path_1.default.join(process.cwd(), '.envshield');
            if (!fs_1.default.existsSync(configPath)) {
                (0, spinner_1.error)('.envshield file not found');
                console.log('Run "envshield init" first or use --env flag');
                process.exit(1);
            }
            const config = JSON.parse(fs_1.default.readFileSync(configPath, 'utf8'));
            projectSlug = config.projectSlug;
            environment = config.environment;
        }
        else {
            // Parse env flag: format is "project-slug/environment"
            const parts = options.env.split('/');
            if (parts.length !== 2) {
                (0, spinner_1.error)('Invalid --env format');
                console.log('Use format: --env project-slug/environment');
                process.exit(1);
            }
            projectSlug = parts[0];
            environment = parts[1];
        }
        const spinner = (0, spinner_1.startSpinner)(`Fetching variables from ${projectSlug}/${environment}...`);
        const api = (0, api_1.createApiClient)();
        try {
            const response = await api.post('/cli/pull', {
                projectSlug,
                environment,
            });
            let variables = response.data.variables || [];
            spinner.succeed(`Fetched ${variables.length} variable(s)`);
            if (variables.length === 0) {
                console.log('');
                console.log('No variables found in this environment');
                return;
            }
            // Apply filter if provided
            if (options.filter) {
                const filterLower = options.filter.toLowerCase();
                variables = variables.filter((v) => v.key.toLowerCase().includes(filterLower) ||
                    v.description?.toLowerCase().includes(filterLower));
                if (variables.length === 0) {
                    console.log('');
                    console.log(`No variables matching filter: ${options.filter}`);
                    return;
                }
            }
            console.log('');
            (0, spinner_1.header)(`${projectSlug}/${environment} (${variables.length} variables)`);
            // Prepare table data
            const rows = variables.map((v) => {
                let value = v.value;
                // Mask value unless --reveal flag is used
                if (!options.reveal) {
                    if (value.length <= 4) {
                        value = '••••';
                    }
                    else {
                        // Show first 2 and last 2 characters
                        value = `${value.substring(0, 2)}${'•'.repeat(Math.min(8, value.length - 4))}${value.substring(value.length - 2)}`;
                    }
                }
                return [
                    v.key,
                    value,
                    v.description || '',
                    v.error ? '⚠️  Error' : '✓',
                ];
            });
            (0, spinner_1.table)(['Key', 'Value', 'Description', 'Status'], rows);
            if (!options.reveal) {
                console.log('');
                console.log('💡 Tip: Use --reveal flag to show full values');
            }
            if (variables.some((v) => v.error)) {
                console.log('');
                (0, spinner_1.warning)('Some variables failed to decrypt');
            }
        }
        catch (error) {
            spinner.fail('Failed to fetch variables');
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
//# sourceMappingURL=view.js.map