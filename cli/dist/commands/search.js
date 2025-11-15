"use strict";
/**
 * Search command - Search for variables across projects
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchCommand = void 0;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const api_1 = require("../utils/api");
const config_1 = require("../utils/config");
exports.searchCommand = new commander_1.Command('search')
    .description('Search for variables across projects')
    .argument('<query>', 'Search query')
    .option('-p, --project <slug>', 'Filter by project slug')
    .option('-e, --env <name>', 'Filter by environment name')
    .option('--decrypt', 'Show full decrypted values (requires DEVELOPER+ role)')
    .option('--json', 'Output results in JSON format')
    .action(async (query, options) => {
    try {
        const config = (0, config_1.getConfig)();
        if (!config || !config.token) {
            console.error(chalk_1.default.red('✖ Not logged in. Run `envshield login` first.'));
            process.exit(1);
        }
        if (!query || query.trim().length === 0) {
            console.error(chalk_1.default.red('✖ Search query is required'));
            process.exit(1);
        }
        const spinner = (0, ora_1.default)('Searching...').start();
        try {
            // Build query params
            const params = new URLSearchParams({
                q: query,
                limit: '50',
            });
            if (options.project)
                params.append('projectId', options.project);
            if (options.env)
                params.append('environmentId', options.env);
            if (options.decrypt)
                params.append('decrypt', 'true');
            const response = await (0, api_1.apiRequest)(`/api/v1/search/variables?${params.toString()}`, {
                method: 'GET',
            });
            spinner.succeed(`Found ${response.results.length} result${response.results.length !== 1 ? 's' : ''}`);
            if (options.json) {
                // JSON output
                console.log(JSON.stringify(response, null, 2));
                return;
            }
            if (response.results.length === 0) {
                console.log(chalk_1.default.gray(`\nNo variables found matching "${query}"\n`));
                return;
            }
            // Table output
            console.log(); // Empty line
            response.results.forEach((result, index) => {
                if (index > 0) {
                    console.log(chalk_1.default.gray('─'.repeat(80)));
                }
                // Key
                console.log(chalk_1.default.bold.cyan(result.key));
                // Value
                const valueLabel = result.canDecrypt ? '' : chalk_1.default.yellow('(masked) ');
                console.log(`${valueLabel}${chalk_1.default.white(result.value)}`);
                // Description
                if (result.description) {
                    console.log(chalk_1.default.gray(result.description));
                }
                // Metadata
                const metadata = [
                    chalk_1.default.bold(result.project.name),
                    result.environment.name,
                    new Date(result.updatedAt).toLocaleDateString(),
                ].join(chalk_1.default.gray(' • '));
                console.log(chalk_1.default.gray(metadata));
            });
            console.log(); // Empty line
            // Pagination info
            if (response.pagination.total > response.pagination.limit) {
                console.log(chalk_1.default.gray(`Showing ${response.results.length} of ${response.pagination.total} results. Use API for pagination.`));
                console.log();
            }
            // Decrypt hint
            if (!options.decrypt && response.results.some((r) => r.canDecrypt)) {
                console.log(chalk_1.default.blue('ℹ Use --decrypt to show full values\n'));
            }
        }
        catch (error) {
            spinner.fail('Search failed');
            console.error(chalk_1.default.red(`\n✖ ${error instanceof Error ? error.message : 'Unknown error'}\n`));
            process.exit(1);
        }
    }
    catch (error) {
        console.error(chalk_1.default.red(`\n✖ ${error instanceof Error ? error.message : 'Unknown error'}\n`));
        process.exit(1);
    }
});
//# sourceMappingURL=search.js.map