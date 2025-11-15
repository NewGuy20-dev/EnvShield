"use strict";
/**
 * Import command - Import variables from a file
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.importCommand = void 0;
const commander_1 = require("commander");
const fs_1 = require("fs");
const path_1 = require("path");
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const api_1 = require("../utils/api");
const config_1 = require("../utils/config");
exports.importCommand = new commander_1.Command('import')
    .description('Import variables from a file')
    .option('-f, --file <path>', 'Path to file to import')
    .option('--format <format>', 'File format (dotenv, json, yaml)', 'dotenv')
    .option('-p, --project <slug>', 'Project slug')
    .option('-e, --env <name>', 'Environment name')
    .option('--strategy <strategy>', 'Conflict strategy (overwrite, skip, merge)', 'merge')
    .option('--dry-run', 'Preview changes without applying them')
    .option('-y, --yes', 'Skip confirmation prompt')
    .action(async (options) => {
    try {
        const config = (0, config_1.getConfig)();
        if (!config?.token) {
            console.error(chalk_1.default.red('✖ Not logged in. Run `envshield login` first.'));
            process.exit(1);
        }
        // Validate options
        if (!options.file) {
            console.error(chalk_1.default.red('✖ File path is required. Use --file <path>'));
            process.exit(1);
        }
        if (!options.project) {
            console.error(chalk_1.default.red('✖ Project is required. Use --project <slug>'));
            process.exit(1);
        }
        if (!options.env) {
            console.error(chalk_1.default.red('✖ Environment is required. Use --env <name>'));
            process.exit(1);
        }
        // Validate format
        const validFormats = ['dotenv', 'json', 'yaml'];
        if (!validFormats.includes(options.format)) {
            console.error(chalk_1.default.red(`✖ Invalid format. Must be one of: ${validFormats.join(', ')}`));
            process.exit(1);
        }
        // Validate strategy
        const validStrategies = ['overwrite', 'skip', 'merge'];
        if (!validStrategies.includes(options.strategy)) {
            console.error(chalk_1.default.red(`✖ Invalid strategy. Must be one of: ${validStrategies.join(', ')}`));
            process.exit(1);
        }
        // Read file
        let content;
        try {
            const filePath = (0, path_1.resolve)(process.cwd(), options.file);
            content = (0, fs_1.readFileSync)(filePath, 'utf-8');
        }
        catch (error) {
            console.error(chalk_1.default.red(`✖ Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`));
            process.exit(1);
        }
        console.log(chalk_1.default.cyan(`\n📦 Importing variables from ${options.file}\n`));
        console.log(`Project: ${chalk_1.default.bold(options.project)}`);
        console.log(`Environment: ${chalk_1.default.bold(options.env)}`);
        console.log(`Format: ${chalk_1.default.bold(options.format)}`);
        console.log(`Strategy: ${chalk_1.default.bold(options.strategy)}\n`);
        // Dry run first to show preview
        const spinner = (0, ora_1.default)('Analyzing import...').start();
        try {
            const dryRunResponse = await (0, api_1.apiRequest)(`/api/v1/projects/${options.project}/environments/${options.env}/variables/import`, {
                method: 'POST',
                body: JSON.stringify({
                    format: options.format,
                    content,
                    strategy: options.strategy,
                    dryRun: true,
                }),
            });
            spinner.succeed('Analysis complete');
            const { diff, summary } = dryRunResponse;
            // Display summary
            console.log(chalk_1.default.bold('\n📊 Import Summary:\n'));
            console.log(`${chalk_1.default.green('+')} To add: ${chalk_1.default.bold(summary.toAdd)}`);
            console.log(`${chalk_1.default.yellow('~')} To update: ${chalk_1.default.bold(summary.toUpdate)}`);
            console.log(`${chalk_1.default.gray('=')} Unchanged: ${chalk_1.default.bold(summary.unchanged)}\n`);
            // Show detailed changes
            if (diff.added.length > 0) {
                console.log(chalk_1.default.green('New variables:'));
                diff.added.slice(0, 10).forEach((item) => {
                    console.log(chalk_1.default.green(`  + ${item.key}`));
                });
                if (diff.added.length > 10) {
                    console.log(chalk_1.default.gray(`  ... and ${diff.added.length - 10} more`));
                }
                console.log();
            }
            if (diff.updated.length > 0) {
                console.log(chalk_1.default.yellow('Updated variables:'));
                diff.updated.slice(0, 10).forEach((item) => {
                    console.log(chalk_1.default.yellow(`  ~ ${item.key}`));
                });
                if (diff.updated.length > 10) {
                    console.log(chalk_1.default.gray(`  ... and ${diff.updated.length - 10} more`));
                }
                console.log();
            }
            // If dry-run only, exit here
            if (options.dryRun) {
                console.log(chalk_1.default.blue('ℹ Dry run complete. No changes were made.'));
                console.log(chalk_1.default.gray('Run without --dry-run to apply these changes.\n'));
                process.exit(0);
            }
            // Confirm before applying
            if (!options.yes && (diff.added.length > 0 || diff.updated.length > 0)) {
                const inquirer = (await Promise.resolve().then(() => __importStar(require('inquirer')))).default;
                const { confirm } = await inquirer.prompt([
                    {
                        type: 'confirm',
                        name: 'confirm',
                        message: 'Apply these changes?',
                        default: false,
                    },
                ]);
                if (!confirm) {
                    console.log(chalk_1.default.gray('\n✖ Import cancelled\n'));
                    process.exit(0);
                }
            }
            // Apply import
            const importSpinner = (0, ora_1.default)('Importing variables...').start();
            const importResponse = await (0, api_1.apiRequest)(`/api/v1/projects/${options.project}/environments/${options.env}/variables/import`, {
                method: 'POST',
                body: JSON.stringify({
                    format: options.format,
                    content,
                    strategy: options.strategy,
                    dryRun: false,
                }),
            });
            importSpinner.succeed('Import complete');
            const { result } = importResponse;
            console.log(chalk_1.default.bold('\n✅ Import Results:\n'));
            console.log(`${chalk_1.default.green('Created:')} ${result.created}`);
            console.log(`${chalk_1.default.yellow('Updated:')} ${result.updated}`);
            console.log(`${chalk_1.default.gray('Skipped:')} ${result.skipped}`);
            if (result.errors.length > 0) {
                console.log(chalk_1.default.red(`\n⚠ Errors: ${result.errors.length}`));
                result.errors.forEach((error) => {
                    console.log(chalk_1.default.red(`  • ${error}`));
                });
            }
            console.log();
        }
        catch (error) {
            spinner.fail('Import failed');
            console.error(chalk_1.default.red(`\n✖ ${error instanceof Error ? error.message : 'Unknown error'}\n`));
            process.exit(1);
        }
    }
    catch (error) {
        console.error(chalk_1.default.red(`\n✖ ${error instanceof Error ? error.message : 'Unknown error'}\n`));
        process.exit(1);
    }
});
//# sourceMappingURL=import.js.map