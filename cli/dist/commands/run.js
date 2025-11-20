"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCommand = runCommand;
const child_process_1 = require("child_process");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const api_1 = require("../utils/api");
const config_1 = require("../utils/config");
const spinner_1 = require("../utils/spinner");
const resolution_1 = require("../utils/resolution");
/**
 * Fetch variables from API
 */
async function fetchVariables(projectSlug, environment) {
    const api = (0, api_1.createApiClient)();
    const response = await api.post('/cli/pull', {
        projectSlug,
        environment,
    });
    return response.data.variables || [];
}
/**
 * Run command with environment variables injected
 */
async function runCommand(commandArgs, options) {
    try {
        (0, config_1.requireAuth)();
        // Validate command arguments
        if (commandArgs.length === 0) {
            (0, spinner_1.error)('No command specified');
            console.log('Usage: envshield run --env project/environment -- npm start');
            process.exit(1);
        }
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
        const spinner = (0, spinner_1.startSpinner)(`Loading variables from ${projectSlug}/${environment}...`);
        try {
            // Fetch variables
            const variables = await fetchVariables(projectSlug, environment);
            if (variables.length === 0) {
                spinner.warn('No variables found');
            }
            else {
                spinner.succeed(`Loaded ${variables.length} variable(s)`);
            }
            // Build environment object
            const env = { ...process.env };
            // Convert variables array to Record<string, string>
            const variablesMap = {};
            for (const variable of variables) {
                if (variable.key && variable.value) {
                    variablesMap[variable.key] = variable.value;
                }
            }
            // Resolve variable references if --resolve flag is set
            if (options.resolve) {
                const result = (0, resolution_1.resolveVariables)(variablesMap);
                if (result.errors.length > 0) {
                    console.log('\n⚠️  Resolution errors:');
                    result.errors.forEach((error) => {
                        console.log(`   • ${error.variable}: ${error.message}`);
                    });
                }
                if (result.warnings.length > 0) {
                    console.log('\n⚠️  Resolution warnings:');
                    result.warnings.forEach((warning) => {
                        console.log(`   • ${warning}`);
                    });
                }
                // Use resolved variables
                Object.assign(env, result.resolved);
                if (result.errors.length > 0) {
                    console.log('\n⚠️  Continuing with partially resolved variables...\n');
                }
            }
            else {
                // Use raw variables without resolution
                Object.assign(env, variablesMap);
            }
            // Show security warning
            console.log('🔒 Running with injected secrets (not written to disk)');
            console.log(`🚀 Executing: ${commandArgs.join(' ')}\n`);
            // Spawn the child process
            const [command, ...args] = commandArgs;
            const child = (0, child_process_1.spawn)(command, args, {
                env,
                stdio: 'inherit', // Pipe stdin/stdout/stderr to parent
                shell: true,
                cwd: process.cwd(),
            });
            // Handle process signals
            const signals = ['SIGINT', 'SIGTERM', 'SIGHUP'];
            signals.forEach((signal) => {
                process.on(signal, () => {
                    // Forward signal to child process
                    child.kill(signal);
                });
            });
            // Handle child process exit
            child.on('exit', (code, signal) => {
                if (signal) {
                    console.log(`\n⚠️  Process terminated by signal: ${signal}`);
                    process.exit(1);
                }
                else if (code !== null) {
                    process.exit(code);
                }
            });
            // Handle child process error
            child.on('error', (error) => {
                console.error('❌ Failed to start command:', error.message);
                process.exit(1);
            });
        }
        catch (error) {
            spinner.fail('Failed to load variables');
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
//# sourceMappingURL=run.js.map