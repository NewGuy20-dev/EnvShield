"use strict";
/**
 * Export command - Export variables to a file
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportCommand = void 0;
const commander_1 = require("commander");
const fs_1 = require("fs");
const path_1 = require("path");
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const config_1 = require("../utils/config");
exports.exportCommand = new commander_1.Command('export')
    .description('Export variables to a file')
    .option('-o, --output <path>', 'Output file path (defaults to stdout)')
    .option('--format <format>', 'Output format (dotenv, json, yaml)', 'dotenv')
    .option('-p, --project <slug>', 'Project slug')
    .option('-e, --env <name>', 'Environment name')
    .action(async (options) => {
    try {
        const config = (0, config_1.getConfig)();
        if (!config || !config.token) {
            console.error(chalk_1.default.red('✖ Not logged in. Run `envshield login` first.'));
            process.exit(1);
        }
        // Validate options
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
        const spinner = (0, ora_1.default)('Exporting variables...').start();
        try {
            // Make API request to export
            const response = await fetch(`${config.apiUrl}/api/v1/projects/${options.project}/environments/${options.env}/variables/export?format=${options.format}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${config.token}`,
                },
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Export failed');
            }
            const content = await response.text();
            spinner.succeed('Export complete');
            // Write to file or stdout
            if (options.output) {
                const outputPath = (0, path_1.resolve)(process.cwd(), options.output);
                (0, fs_1.writeFileSync)(outputPath, content, 'utf-8');
                console.log(chalk_1.default.green(`\n✅ Variables exported to ${outputPath}\n`));
            }
            else {
                console.log('\n' + content);
            }
        }
        catch (error) {
            spinner.fail('Export failed');
            console.error(chalk_1.default.red(`\n✖ ${error instanceof Error ? error.message : 'Unknown error'}\n`));
            process.exit(1);
        }
    }
    catch (error) {
        console.error(chalk_1.default.red(`\n✖ ${error instanceof Error ? error.message : 'Unknown error'}\n`));
        process.exit(1);
    }
});
//# sourceMappingURL=export.js.map