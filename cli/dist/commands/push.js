"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pushCommand = pushCommand;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const inquirer_1 = __importDefault(require("inquirer"));
const api_1 = require("../utils/api");
const config_1 = require("../utils/config");
const env_parser_1 = require("../utils/env-parser");
const spinner_1 = require("../utils/spinner");
async function pushCommand(options) {
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
        const sourceFile = options.file || '.env';
        // Check if source file exists
        if (!fs_1.default.existsSync(sourceFile)) {
            (0, spinner_1.error)(`File not found: ${sourceFile}`);
            process.exit(1);
        }
        (0, spinner_1.info)(`Reading ${sourceFile}...`);
        const localVariables = (0, env_parser_1.parseEnvFile)(sourceFile);
        if (localVariables.length === 0) {
            (0, spinner_1.warning)('No variables found in file');
            process.exit(0);
        }
        const spinner = (0, spinner_1.startSpinner)('Fetching remote variables...');
        const api = (0, api_1.createApiClient)();
        try {
            // Fetch remote variables to compare
            const remoteResponse = await api.post('/cli/pull', {
                projectSlug,
                environment,
            });
            const remoteVariables = remoteResponse.data.variables || [];
            spinner.succeed('Remote variables fetched');
            // Calculate diff
            const remoteKeys = new Set(remoteVariables.map((v) => v.key));
            const localKeys = new Set(localVariables.map((v) => v.key));
            const toCreate = localVariables.filter((v) => !remoteKeys.has(v.key));
            const toUpdate = localVariables.filter((v) => {
                if (!remoteKeys.has(v.key))
                    return false;
                const remote = remoteVariables.find((r) => r.key === v.key);
                return remote && remote.value !== v.value;
            });
            const totalChanges = toCreate.length + toUpdate.length;
            if (totalChanges === 0) {
                (0, spinner_1.info)('No changes to push');
                console.log('Local and remote variables are in sync');
                return;
            }
            // Display diff summary
            console.log('');
            console.log('Changes to be pushed:');
            if (toCreate.length > 0) {
                console.log(`  ${toCreate.length} new variable(s) to create`);
                toCreate.slice(0, 5).forEach((v) => console.log(`    + ${v.key}`));
                if (toCreate.length > 5) {
                    console.log(`    ... and ${toCreate.length - 5} more`);
                }
            }
            if (toUpdate.length > 0) {
                console.log(`  ${toUpdate.length} variable(s) to update`);
                toUpdate.slice(0, 5).forEach((v) => console.log(`    ~ ${v.key}`));
                if (toUpdate.length > 5) {
                    console.log(`    ... and ${toUpdate.length - 5} more`);
                }
            }
            console.log('');
            // Confirm
            const { confirm } = await inquirer_1.default.prompt([
                {
                    type: 'confirm',
                    name: 'confirm',
                    message: `This will push ${totalChanges} variable(s) to ${projectSlug}/${environment}. Continue?`,
                    default: true,
                },
            ]);
            if (!confirm) {
                console.log('Push cancelled');
                return;
            }
            // Push changes
            const pushSpinner = (0, spinner_1.startSpinner)(`Pushing ${totalChanges} variable(s)...`);
            const pushResponse = await api.post('/cli/push', {
                projectSlug,
                environment,
                variables: localVariables,
            });
            const changes = pushResponse.data.changes;
            pushSpinner.succeed(`Pushed ${changes.total} variable(s) (${changes.created} created, ${changes.updated} updated)`);
            if (pushResponse.data.errors && pushResponse.data.errors.length > 0) {
                (0, spinner_1.warning)('Some variables failed to push:');
                pushResponse.data.errors.forEach((err) => console.log(`  - ${err}`));
            }
            (0, spinner_1.success)('Push completed successfully');
        }
        catch (error) {
            spinner.fail('Push failed');
            (0, api_1.handleApiError)(error);
        }
    }
    catch (error) {
        if (error instanceof Error) {
            if (error.message.includes('User force closed')) {
                console.log('\nPush cancelled');
                process.exit(0);
            }
            console.error('❌', error.message);
            process.exit(1);
        }
        throw error;
    }
}
//# sourceMappingURL=push.js.map