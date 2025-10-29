"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pullCommand = pullCommand;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const api_1 = require("../utils/api");
const config_1 = require("../utils/config");
const env_parser_1 = require("../utils/env-parser");
const spinner_1 = require("../utils/spinner");
async function pullCommand(options) {
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
        const outputFile = options.output || '.env';
        // Check if output file exists
        if (fs_1.default.existsSync(outputFile)) {
            (0, spinner_1.warning)(`${outputFile} already exists and will be overwritten`);
        }
        const spinner = (0, spinner_1.startSpinner)(`Pulling variables from ${projectSlug} (${environment})...`);
        const api = (0, api_1.createApiClient)();
        try {
            const response = await api.post('/cli/pull', {
                projectSlug,
                environment,
            });
            const variables = response.data.variables || [];
            spinner.text = `Pull progress: ${variables.length} variables`;
            // Write to file
            (0, env_parser_1.writeEnvFile)(outputFile, variables);
            spinner.succeed(`Pulled ${variables.length} variable(s) to ${outputFile}`);
            if (variables.some((v) => v.error)) {
                (0, spinner_1.warning)('Some variables failed to decrypt');
            }
            (0, spinner_1.success)(`Successfully synced with ${projectSlug}/${environment}`);
        }
        catch (error) {
            spinner.fail('Pull failed');
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
//# sourceMappingURL=pull.js.map