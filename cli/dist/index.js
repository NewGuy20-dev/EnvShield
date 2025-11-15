#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const fs_1 = require("fs");
const path_1 = require("path");
const login_1 = require("./commands/login");
const logout_1 = require("./commands/logout");
const whoami_1 = require("./commands/whoami");
const list_1 = require("./commands/list");
const init_1 = require("./commands/init");
const pull_1 = require("./commands/pull");
const push_1 = require("./commands/push");
const view_1 = require("./commands/view");
const profile_1 = require("./commands/profile");
const import_1 = require("./commands/import");
const export_1 = require("./commands/export");
const search_1 = require("./commands/search");
const completion_1 = require("./commands/completion");
const bulk_1 = require("./commands/bulk");
const packageJson = JSON.parse((0, fs_1.readFileSync)((0, path_1.join)(__dirname, '../package.json'), 'utf-8'));
const program = new commander_1.Command();
program
    .name('envshield')
    .version(packageJson.version)
    .description('🛡️  EnvShield - Secure Environment Variable Manager');
// Login command
(0, login_1.registerLoginCommand)(program);
// Profile management command
(0, profile_1.registerProfileCommand)(program);
// Logout command
program
    .command('logout')
    .description('Remove authentication token')
    .action(logout_1.logoutCommand);
// Whoami command
program
    .command('whoami')
    .description('Display current user information')
    .action(whoami_1.whoamiCommand);
// List command
program
    .command('list')
    .description('List all projects')
    .action(list_1.listCommand);
// Init command
program
    .command('init')
    .description('Initialize EnvShield in current directory')
    .action(init_1.initCommand);
// Pull command
program
    .command('pull')
    .description('Pull environment variables from remote')
    .option('--env <project/environment>', 'Specify project and environment (e.g., my-app/production)')
    .option('--output <file>', 'Output file path (default: .env.local or .env)')
    .action(pull_1.pullCommand);
// Push command
program
    .command('push')
    .description('Push environment variables to remote')
    .option('--env <project/environment>', 'Specify project and environment (e.g., my-app/production)')
    .option('--file <file>', 'Source file path (default: .env.local or .env)')
    .action(push_1.pushCommand);
// View command
program
    .command('view')
    .description('View environment variables in the terminal')
    .option('--env <project/environment>', 'Specify project and environment (e.g., my-app/production)')
    .option('--reveal', 'Show full values instead of masked')
    .option('--filter <text>', 'Filter variables by key or description')
    .action(view_1.viewCommand);
// Import/Export commands
program.addCommand(import_1.importCommand);
program.addCommand(export_1.exportCommand);
// Search command
program.addCommand(search_1.searchCommand);
// Bulk operations
program.addCommand(bulk_1.bulkCommand);
// Shell completion
program.addCommand(completion_1.completionCommand);
// Display help if no command is provided
if (!process.argv.slice(2).length) {
    program.outputHelp();
}
program.parse();
//# sourceMappingURL=index.js.map