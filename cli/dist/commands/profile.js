"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerProfileCommand = registerProfileCommand;
const chalk_1 = __importDefault(require("chalk"));
const config_1 = require("../utils/config");
function registerProfileCommand(program) {
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
    const fullConfig = (0, config_1.getFullConfig)();
    if (!fullConfig || Object.keys(fullConfig.profiles).length === 0) {
        console.log(chalk_1.default.yellow('No profiles found. Please run "envshield login" first.'));
        return;
    }
    const activeProfile = fullConfig.activeProfile;
    const profiles = Object.entries(fullConfig.profiles);
    console.log(chalk_1.default.bold('\nProfiles:\n'));
    profiles.forEach(([name, config]) => {
        const isActive = name === activeProfile;
        const prefix = isActive ? chalk_1.default.green('* ') : '  ';
        const tokenInfo = config.tokenName ? ` (${config.tokenName})` : '';
        const expiresInfo = config.expiresAt
            ? ` - expires ${new Date(config.expiresAt).toLocaleDateString()}`
            : '';
        console.log(`${prefix}${chalk_1.default.bold(name)}${tokenInfo}${expiresInfo}`);
        console.log(`  ${chalk_1.default.dim(`API: ${config.apiUrl}`)}`);
    });
    if (activeProfile) {
        console.log(chalk_1.default.dim(`\nActive profile: ${chalk_1.default.bold(activeProfile)}`));
    }
}
function switchProfileCommand(profileName) {
    try {
        (0, config_1.switchProfile)(profileName);
        console.log(chalk_1.default.green(`✓ Switched to profile: ${profileName}`));
    }
    catch (error) {
        console.error(chalk_1.default.red(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
        process.exit(1);
    }
}
function removeProfileCommand(profileName) {
    try {
        const activeProfile = (0, config_1.getActiveProfile)();
        if (profileName === activeProfile) {
            console.log(chalk_1.default.yellow(`Warning: Removing active profile "${profileName}"`));
        }
        (0, config_1.removeProfile)(profileName);
        console.log(chalk_1.default.green(`✓ Removed profile: ${profileName}`));
        const newActiveProfile = (0, config_1.getActiveProfile)();
        if (newActiveProfile && newActiveProfile !== profileName) {
            console.log(chalk_1.default.dim(`Switched to profile: ${newActiveProfile}`));
        }
    }
    catch (error) {
        console.error(chalk_1.default.red(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
        process.exit(1);
    }
}
//# sourceMappingURL=profile.js.map