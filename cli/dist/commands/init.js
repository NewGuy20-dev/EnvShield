"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initCommand = initCommand;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const inquirer_1 = __importDefault(require("inquirer"));
const api_1 = require("../utils/api");
const config_1 = require("../utils/config");
const spinner_1 = require("../utils/spinner");
async function initCommand() {
    try {
        (0, config_1.requireAuth)();
        const configPath = path_1.default.join(process.cwd(), '.envshield');
        // Check if .envshield already exists
        if (fs_1.default.existsSync(configPath)) {
            const existing = JSON.parse(fs_1.default.readFileSync(configPath, 'utf8'));
            (0, spinner_1.warning)(`.envshield file already exists`);
            console.log(`Current configuration:`);
            console.log(`  Project: ${existing.projectSlug}`);
            console.log(`  Environment: ${existing.environment}`);
            console.log('');
            const { overwrite } = await inquirer_1.default.prompt([
                {
                    type: 'confirm',
                    name: 'overwrite',
                    message: 'Do you want to overwrite it?',
                    default: false,
                },
            ]);
            if (!overwrite) {
                console.log('Initialization cancelled');
                return;
            }
        }
        // Fetch projects
        const spinner = (0, spinner_1.startSpinner)('Fetching projects...');
        const api = (0, api_1.createApiClient)();
        try {
            const projectsResponse = await api.get('/projects');
            const projects = projectsResponse.data.projects || [];
            if (projects.length === 0) {
                spinner.fail('No projects found');
                (0, spinner_1.error)('You have no projects yet');
                console.log('Create a project in the web dashboard first.');
                process.exit(1);
            }
            spinner.succeed(`Found ${projects.length} project(s)`);
            // Prompt for project selection
            const { projectSlug } = await inquirer_1.default.prompt([
                {
                    type: 'list',
                    name: 'projectSlug',
                    message: 'Select a project:',
                    choices: projects.map((p) => ({
                        name: `${p.name} (${p.slug}) - ${p.role}`,
                        value: p.slug,
                    })),
                },
            ]);
            // Fetch environments for selected project
            const envSpinner = (0, spinner_1.startSpinner)('Fetching environments...');
            const envResponse = await api.get(`/projects/${projectSlug}/environments`);
            const environments = envResponse.data.environments || [];
            if (environments.length === 0) {
                envSpinner.fail('No environments found');
                (0, spinner_1.error)('This project has no environments yet');
                console.log('Create an environment in the web dashboard first.');
                process.exit(1);
            }
            envSpinner.succeed(`Found ${environments.length} environment(s)`);
            // Prompt for environment selection
            const { environment } = await inquirer_1.default.prompt([
                {
                    type: 'list',
                    name: 'environment',
                    message: 'Select an environment:',
                    choices: environments.map((e) => ({
                        name: `${e.name} (${e.slug}) - ${e.variablesCount || 0} variables`,
                        value: e.slug,
                    })),
                },
            ]);
            // Save .envshield file
            const config = {
                projectSlug,
                environment,
            };
            fs_1.default.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
            (0, spinner_1.success)('Initialized successfully');
            console.log('Configuration saved to .envshield');
            console.log(`  Project: ${projectSlug}`);
            console.log(`  Environment: ${environment}`);
            console.log('');
            console.log('You can now run "envshield pull" to fetch variables');
        }
        catch (error) {
            spinner.fail('Failed to initialize');
            (0, api_1.handleApiError)(error);
        }
    }
    catch (error) {
        if (error instanceof Error) {
            if (error.message.includes('User force closed')) {
                console.log('\nInitialization cancelled');
                process.exit(0);
            }
            console.error('❌', error.message);
            process.exit(1);
        }
        throw error;
    }
}
//# sourceMappingURL=init.js.map