import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { createApiClient, handleApiError } from '../utils/api';
import { requireAuth } from '../utils/config';
import { startSpinner, success, error as errorMsg, warning } from '../utils/spinner';
import { resolveVariables } from '../utils/resolution';

interface EnvShieldConfig {
    projectSlug: string;
    environment: string;
}

interface Variable {
    key: string;
    value: string;
    description?: string;
}

/**
 * Fetch variables from API
 */
async function fetchVariables(
    projectSlug: string,
    environment: string
): Promise<Variable[]> {
    const api = createApiClient();

    const response = await api.post('/cli/pull', {
        projectSlug,
        environment,
    });

    return response.data.variables || [];
}

/**
 * Run command with environment variables injected
 */
export async function runCommand(
    commandArgs: string[],
    options: { env?: string; resolve?: boolean }
) {
    try {
        requireAuth();

        // Validate command arguments
        if (commandArgs.length === 0) {
            errorMsg('No command specified');
            console.log('Usage: envshield run --env project/environment -- npm start');
            process.exit(1);
        }

        let projectSlug: string;
        let environment: string;

        // Try to read from .envshield file if env not provided
        if (!options.env) {
            const configPath = path.join(process.cwd(), '.envshield');
            if (!fs.existsSync(configPath)) {
                errorMsg('.envshield file not found');
                console.log('Run "envshield init" first or use --env flag');
                process.exit(1);
            }

            const config = JSON.parse(fs.readFileSync(configPath, 'utf8')) as EnvShieldConfig;
            projectSlug = config.projectSlug;
            environment = config.environment;
        } else {
            // Parse env flag: format is "project-slug/environment"
            const parts = options.env.split('/');
            if (parts.length !== 2) {
                errorMsg('Invalid --env format');
                console.log('Use format: --env project-slug/environment');
                process.exit(1);
            }
            projectSlug = parts[0];
            environment = parts[1];
        }

        const spinner = startSpinner(`Loading variables from ${projectSlug}/${environment}...`);

        try {
            // Fetch variables
            const variables = await fetchVariables(projectSlug, environment);

            if (variables.length === 0) {
                spinner.warn('No variables found');
            } else {
                spinner.succeed(`Loaded ${variables.length} variable(s)`);
            }

            // Build environment object
            const env = { ...process.env };

            // Convert variables array to Record<string, string>
            const variablesMap: Record<string, string> = {};
            for (const variable of variables) {
                if (variable.key && variable.value) {
                    variablesMap[variable.key] = variable.value;
                }
            }

            // Resolve variable references if --resolve flag is set
            if (options.resolve) {
                const result = resolveVariables(variablesMap);

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
            } else {
                // Use raw variables without resolution
                Object.assign(env, variablesMap);
            }

            // Show security warning
            console.log('🔒 Running with injected secrets (not written to disk)');
            console.log(`🚀 Executing: ${commandArgs.join(' ')}\n`);

            // Spawn the child process
            const [command, ...args] = commandArgs;
            const child = spawn(command, args, {
                env,
                stdio: 'inherit', // Pipe stdin/stdout/stderr to parent
                shell: true,
                cwd: process.cwd(),
            });

            // Handle process signals
            const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM', 'SIGHUP'];
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
                } else if (code !== null) {
                    process.exit(code);
                }
            });

            // Handle child process error
            child.on('error', (error) => {
                console.error('❌ Failed to start command:', error.message);
                process.exit(1);
            });

        } catch (error) {
            spinner.fail('Failed to load variables');
            handleApiError(error);
        }
    } catch (error) {
        if (error instanceof Error) {
            console.error('❌', error.message);
            process.exit(1);
        }
        throw error;
    }
}
