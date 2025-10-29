#!/usr/bin/env node
import { Command } from 'commander';
import { readFileSync } from 'fs';
import { join } from 'path';
import { loginCommand } from './commands/login';
import { logoutCommand } from './commands/logout';
import { whoamiCommand } from './commands/whoami';
import { listCommand } from './commands/list';
import { initCommand } from './commands/init';
import { pullCommand } from './commands/pull';
import { pushCommand } from './commands/push';

const packageJson = JSON.parse(
  readFileSync(join(__dirname, '../package.json'), 'utf-8')
);

const program = new Command();

program
  .name('envshield')
  .version(packageJson.version)
  .description('🛡️  EnvShield - Secure Environment Variable Manager');

// Login command
program
  .command('login')
  .description('Authenticate with EnvShield')
  .action(loginCommand);

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
  .option('--output <file>', 'Output file path (default: .env)')
  .action(pullCommand);

// Push command
program
  .command('push')
  .description('Push environment variables to remote')
  .option('--env <project/environment>', 'Specify project and environment (e.g., my-app/production)')
  .option('--file <file>', 'Source file path (default: .env)')
  .action(pushCommand);

// Display help if no command is provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}

program.parse();
