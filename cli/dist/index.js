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
const packageJson = JSON.parse((0, fs_1.readFileSync)((0, path_1.join)(__dirname, '../package.json'), 'utf-8'));
const program = new commander_1.Command();
program
    .name('envshield')
    .version(packageJson.version)
    .description('🛡️  EnvShield - Secure Environment Variable Manager');
// Login command
program
    .command('login')
    .description('Authenticate with EnvShield')
    .action(login_1.loginCommand);
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
    .option('--output <file>', 'Output file path (default: .env)')
    .action(pull_1.pullCommand);
// Push command
program
    .command('push')
    .description('Push environment variables to remote')
    .option('--env <project/environment>', 'Specify project and environment (e.g., my-app/production)')
    .option('--file <file>', 'Source file path (default: .env)')
    .action(push_1.pushCommand);
// Display help if no command is provided
if (!process.argv.slice(2).length) {
    program.outputHelp();
}
program.parse();
//# sourceMappingURL=index.js.map