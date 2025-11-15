import { Command } from 'commander';
import chalk from 'chalk';
import {
  getFullConfig,
  getActiveProfile,
  listProfiles,
  switchProfile,
  removeProfile,
} from '../utils/config';

export function registerProfileCommand(program: Command) {
  const profileCmd = program
    .command('profile')
    .description('Manage authentication profiles');

  profileCmd
    .command('list')
    .description('List all profiles')
    .action(listProfilesCommand);

  profileCmd
    .command('use <name>')
    .description('Switch to a different profile')
    .action(switchProfileCommand);

  profileCmd
    .command('remove <name>')
    .description('Remove a profile')
    .action(removeProfileCommand);
}

function listProfilesCommand() {
  const fullConfig = getFullConfig();
  if (!fullConfig || Object.keys(fullConfig.profiles).length === 0) {
    console.log(chalk.yellow('No profiles found. Please run "envshield login" first.'));
    return;
  }

  const activeProfile = fullConfig.activeProfile;
  const profiles = Object.entries(fullConfig.profiles);

  console.log(chalk.bold('\nProfiles:\n'));
  profiles.forEach(([name, config]) => {
    const isActive = name === activeProfile;
    const prefix = isActive ? chalk.green('* ') : '  ';
    const tokenInfo = config.tokenName ? ` (${config.tokenName})` : '';
    const expiresInfo = config.expiresAt
      ? ` - expires ${new Date(config.expiresAt).toLocaleDateString()}`
      : '';

    console.log(`${prefix}${chalk.bold(name)}${tokenInfo}${expiresInfo}`);
    console.log(`  ${chalk.dim(`API: ${config.apiUrl}`)}`);
  });

  if (activeProfile) {
    console.log(chalk.dim(`\nActive profile: ${chalk.bold(activeProfile)}`));
  }
}

function switchProfileCommand(profileName: string) {
  try {
    switchProfile(profileName);
    console.log(chalk.green(`✓ Switched to profile: ${profileName}`));
  } catch (error) {
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
    process.exit(1);
  }
}

function removeProfileCommand(profileName: string) {
  try {
    const activeProfile = getActiveProfile();
    if (profileName === activeProfile) {
      console.log(chalk.yellow(`Warning: Removing active profile "${profileName}"`));
    }

    removeProfile(profileName);
    console.log(chalk.green(`✓ Removed profile: ${profileName}`));

    const newActiveProfile = getActiveProfile();
    if (newActiveProfile && newActiveProfile !== profileName) {
      console.log(chalk.dim(`Switched to profile: ${newActiveProfile}`));
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
    process.exit(1);
  }
}
