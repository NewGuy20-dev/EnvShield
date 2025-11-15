"use strict";
/**
 * Bulk command - Perform bulk operations on variables
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkCommand = void 0;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const inquirer_1 = __importDefault(require("inquirer"));
const api_1 = require("../utils/api");
const config_1 = require("../utils/config");
exports.bulkCommand = new commander_1.Command('bulk')
    .description('Perform bulk operations on variables');
// Bulk delete subcommand
exports.bulkCommand
    .command('delete')
    .description('Delete multiple variables at once')
    .argument('<keys...>', 'Variable keys to delete')
    .option('-p, --project <slug>', 'Project slug (required)')
    .option('-e, --env <name>', 'Environment name (required)')
    .option('-y, --yes', 'Skip confirmation')
    .action(async (keys, options) => {
    try {
        const config = (0, config_1.getConfig)();
        if (!config || !config.token) {
            console.error(chalk_1.default.red('✖ Not logged in. Run `envshield login` first.'));
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
        if (keys.length === 0) {
            console.error(chalk_1.default.red('✖ At least one key is required'));
            process.exit(1);
        }
        // Show summary
        console.log(chalk_1.default.cyan(`\n🗑️  Bulk Delete\n`));
        console.log(`Project: ${chalk_1.default.bold(options.project)}`);
        console.log(`Environment: ${chalk_1.default.bold(options.env)}`);
        console.log(`\nVariables to delete:`);
        keys.forEach(key => console.log(chalk_1.default.red(`  - ${key}`)));
        console.log();
        // Confirm
        if (!options.yes) {
            const { confirm } = await inquirer_1.default.prompt([
                {
                    type: 'confirm',
                    name: 'confirm',
                    message: `Delete ${keys.length} variable${keys.length !== 1 ? 's' : ''}?`,
                    default: false,
                },
            ]);
            if (!confirm) {
                console.log(chalk_1.default.gray('\n✖ Bulk delete cancelled\n'));
                process.exit(0);
            }
        }
        // Delete variables one by one (could be optimized with batch endpoint)
        const spinner = (0, ora_1.default)('Deleting variables...').start();
        let deleted = 0;
        let failed = 0;
        const errors = [];
        for (const key of keys) {
            try {
                // Find variable by key first
                const searchResponse = await (0, api_1.apiRequest)(`/api/v1/search/variables?q=${encodeURIComponent(key)}&projectId=${options.project}`, { method: 'GET' });
                const variable = searchResponse.results.find((r) => r.key === key);
                if (!variable) {
                    errors.push(`Variable "${key}" not found`);
                    failed++;
                    continue;
                }
                // Delete variable (assuming DELETE endpoint exists)
                await (0, api_1.apiRequest)(`/api/v1/projects/${options.project}/environments/${options.env}/variables/${variable.id}`, { method: 'DELETE' });
                deleted++;
            }
            catch (error) {
                errors.push(`Failed to delete "${key}": ${error instanceof Error ? error.message : 'Unknown error'}`);
                failed++;
            }
        }
        spinner.succeed('Bulk delete complete');
        // Results
        console.log(chalk_1.default.bold('\n✅ Bulk Delete Results:\n'));
        console.log(`${chalk_1.default.green('Deleted:')} ${deleted}`);
        console.log(`${chalk_1.default.red('Failed:')} ${failed}`);
        if (errors.length > 0) {
            console.log(chalk_1.default.red('\nErrors:'));
            errors.forEach(err => console.log(chalk_1.default.red(`  • ${err}`)));
        }
        console.log();
    }
    catch (error) {
        console.error(chalk_1.default.red(`\n✖ ${error instanceof Error ? error.message : 'Unknown error'}\n`));
        process.exit(1);
    }
});
// Bulk update subcommand (placeholder for future implementation)
exports.bulkCommand
    .command('update')
    .description('Update multiple variables at once (from file)')
    .option('-f, --file <path>', 'JSON file with updates')
    .option('-p, --project <slug>', 'Project slug (required)')
    .option('-e, --env <name>', 'Environment name (required)')
    .action(async () => {
    console.log(chalk_1.default.yellow('⚠️  Bulk update is not yet implemented'));
    console.log(chalk_1.default.gray('Use the import command for bulk updates instead:'));
    console.log(chalk_1.default.cyan('  envshield import --file updates.json --format json --strategy merge'));
});
//# sourceMappingURL=bulk.js.map