#!/usr/bin/env node
import { Command } from 'commander';
import { readFileSync } from 'fs';
import { join } from 'path';
import { registerLoginCommand } from './commands/login';
import { logoutCommand } from './commands/logout';
import { whoamiCommand } from './commands/whoami';
import { listCommand } from './commands/list';
import { initCommand } from './commands/init';
import { pullCommand } from './commands/pull';
import { pushCommand } from './commands/push';
import { viewCommand } from './commands/view';
import { runCommand } from './commands/run';
import { registerProfileCommand } from './commands/profile';
import { importCommand } from './commands/import';
import { exportCommand } from './commands/export';
import { searchCommand } from './commands/search';
import { completionCommand } from './commands/completion';
import { bulkCommand } from './commands/bulk';

const packageJson = JSON.parse(
  readFileSync(join(__dirname, '../package.json'), 'utf-8')
);

const program = new Command();

program
  .name('envshield')
  .version(packageJson.version)
  .description('🛡️  EnvShield - Secure Environment Variable Manager');

// Login command
registerLoginCommand(program);

// Profile management command
registerProfileCommand(program);

// Logout command
program
  .command('logout')
  .description('Remove authentication token')
  .action(logoutCommand);

// Whoami command
program
  .command('whoami')
  .description('Display current user information')
  .action(whoamiCommand);

// List command
program
  .command('list')
  .description('List all projects')
  .action(listCommand);

// Init command
program
  .command('init')
  .description('Initialize EnvShield in current directory')
  .action(initCommand);

// Pull command
program
  .command('pull')
  .description('Pull environment variables from remote')
  .option('--env <project/environment>', 'Specify project and environment (e.g., my-app/production)')
  .option('--output <file>', 'Output file path (default: .env.local or .env)')
  .action(pullCommand);

// Push command
program
  .command('push')
  .description('Push environment variables to remote')
  .option('--env <project/environment>', 'Specify project and environment (e.g., my-app/production)')
  .option('--file <file>', 'Source file path (default: .env.local or .env)')
  .action(pushCommand);

// Run command
program
  .command('run')
  .description('Run command with environment variables injected (diskless)')
  .option('--env <project/environment>', 'Specify project and environment (e.g., my-app/production)')
  .option('--resolve', 'Resolve variable references (${VAR})')
  .allowUnknownOption()
  .action((options, cmd) => {
    // Get the command arguments after '--'
    const commandArgs = cmd.args;
    runCommand(commandArgs, options);
  });

// View command
program
  .command('view')
  .description('View environment variables in the terminal')
  .option('--env <project/environment>', 'Specify project and environment (e.g., my-app/production)')
  .option('--reveal', 'Show full values instead of masked')
  .option('--filter <text>', 'Filter variables by key or description')
  .action(viewCommand);

// Import/Export commands
program.addCommand(importCommand);
program.addCommand(exportCommand);

// Search command
program.addCommand(searchCommand);

// Bulk operations
program.addCommand(bulkCommand);

// Shell completion
program.addCommand(completionCommand);

// Display help if no command is provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}

program.parse();
