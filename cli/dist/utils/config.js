"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFullConfig = getFullConfig;
exports.getConfig = getConfig;
exports.getActiveProfile = getActiveProfile;
exports.listProfiles = listProfiles;
exports.saveConfig = saveConfig;
exports.switchProfile = switchProfile;
exports.removeProfile = removeProfile;
exports.clearConfig = clearConfig;
exports.getDefaultApiUrl = getDefaultApiUrl;
exports.isLoggedIn = isLoggedIn;
exports.requireAuth = requireAuth;
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const child_process_1 = require("child_process");
const HOME = os_1.default.homedir();
const CONFIG_DIR = path_1.default.join(HOME, '.envshield');
const CONFIG_FILE = path_1.default.join(CONFIG_DIR, 'config.json');
/**
 * Get the full multi-profile configuration from ~/.envshield/config.json
 */
function getFullConfig() {
    try {
        if (!fs_1.default.existsSync(CONFIG_FILE)) {
            return null;
        }
        const content = fs_1.default.readFileSync(CONFIG_FILE, 'utf8');
        const parsed = JSON.parse(content);
        // Handle legacy single-profile format
        if (parsed.apiUrl && parsed.token) {
            return {
                activeProfile: 'default',
                profiles: {
                    default: parsed,
                },
            };
        }
        return parsed;
    }
    catch (error) {
        console.error('Failed to read config:', error);
        return null;
    }
}
/**
 * Get the active profile configuration (or legacy single config)
 */
function getConfig(profileName) {
    try {
        const fullConfig = getFullConfig();
        if (!fullConfig) {
            return null;
        }
        const profile = profileName || fullConfig.activeProfile;
        return fullConfig.profiles[profile] || null;
    }
    catch (error) {
        console.error('Failed to read config:', error);
        return null;
    }
}
/**
 * Get the active profile name
 */
function getActiveProfile() {
    const fullConfig = getFullConfig();
    return fullConfig?.activeProfile || null;
}
/**
 * List all available profiles
 */
function listProfiles() {
    const fullConfig = getFullConfig();
    if (!fullConfig) {
        return [];
    }
    return Object.keys(fullConfig.profiles);
}
/**
 * Save configuration to ~/.envshield/config.json
 * Sets file permissions to 0600 (owner read/write only)
 * Supports multi-profile configuration
 */
function saveConfig(config, profileName) {
    try {
        // Create directory if it doesn't exist
        if (!fs_1.default.existsSync(CONFIG_DIR)) {
            fs_1.default.mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
            if (process.platform === 'win32') {
                secureWindowsPath(CONFIG_DIR);
            }
        }
        const profile = profileName || 'default';
        let fullConfig = getFullConfig();
        if (!fullConfig) {
            // Create new config
            fullConfig = {
                activeProfile: profile,
                profiles: {
                    [profile]: config,
                },
            };
        }
        else {
            // Update existing config
            fullConfig.profiles[profile] = config;
            fullConfig.activeProfile = profile;
        }
        // Write config file
        fs_1.default.writeFileSync(CONFIG_FILE, JSON.stringify(fullConfig, null, 2), {
            encoding: 'utf8',
            mode: 0o600, // Owner read/write only
        });
        if (process.platform === 'win32') {
            secureWindowsPath(CONFIG_FILE);
        }
    }
    catch (error) {
        throw new Error(`Failed to save config: ${error}`);
    }
}
/**
 * Switch to a different profile
 */
function switchProfile(profileName) {
    const fullConfig = getFullConfig();
    if (!fullConfig) {
        throw new Error('No configuration found. Please login first.');
    }
    if (!fullConfig.profiles[profileName]) {
        throw new Error(`Profile "${profileName}" not found.`);
    }
    fullConfig.activeProfile = profileName;
    fs_1.default.writeFileSync(CONFIG_FILE, JSON.stringify(fullConfig, null, 2), {
        encoding: 'utf8',
        mode: 0o600,
    });
    if (process.platform === 'win32') {
        secureWindowsPath(CONFIG_FILE);
    }
}
/**
 * Remove a profile
 */
function removeProfile(profileName) {
    const fullConfig = getFullConfig();
    if (!fullConfig) {
        throw new Error('No configuration found.');
    }
    if (!fullConfig.profiles[profileName]) {
        throw new Error(`Profile "${profileName}" not found.`);
    }
    delete fullConfig.profiles[profileName];
    // If removing active profile, switch to another profile or default
    if (fullConfig.activeProfile === profileName) {
        const remainingProfiles = Object.keys(fullConfig.profiles);
        if (remainingProfiles.length > 0) {
            fullConfig.activeProfile = remainingProfiles[0];
        }
        else {
            // No profiles left, clear config
            clearConfig();
            return;
        }
    }
    fs_1.default.writeFileSync(CONFIG_FILE, JSON.stringify(fullConfig, null, 2), {
        encoding: 'utf8',
        mode: 0o600,
    });
    if (process.platform === 'win32') {
        secureWindowsPath(CONFIG_FILE);
    }
}
/**
 * Clear configuration file
 */
function clearConfig() {
    try {
        if (fs_1.default.existsSync(CONFIG_FILE)) {
            fs_1.default.unlinkSync(CONFIG_FILE);
        }
    }
    catch (error) {
        throw new Error(`Failed to clear config: ${error}`);
    }
}
/**
 * Get the default API URL from environment or use default
 */
function getDefaultApiUrl() {
    return process.env.ENVSHIELD_API_URL || 'https://env-shield.vercel.app/api/v1';
}
/**
 * Check if user is logged in (has valid token)
 */
function isLoggedIn() {
    const config = getConfig();
    return config !== null && !!config.token;
}
/**
 * Require authentication - throws error if not logged in
 */
function requireAuth(profileName) {
    const config = getConfig(profileName);
    if (!config || !config.token) {
        const profileMsg = profileName ? ` for profile "${profileName}"` : '';
        throw new Error(`Not authenticated${profileMsg}. Please run "envshield login" first.`);
    }
    return config;
}
function secureWindowsPath(targetPath) {
    try {
        const user = os_1.default.userInfo().username;
        // Remove inherited permissions
        (0, child_process_1.spawnSync)('icacls', [targetPath, '/inheritance:r'], { stdio: 'ignore' });
        // Reset permissions to current user only
        (0, child_process_1.spawnSync)('icacls', [targetPath, '/grant:r', `${user}:F`], { stdio: 'ignore' });
        // Remove access for well-known groups that might remain
        (0, child_process_1.spawnSync)('icacls', [targetPath, '/remove', 'Administrators', 'Users', 'Everyone'], {
            stdio: 'ignore',
        });
    }
    catch (error) {
        console.warn('Warning: Failed to tighten Windows permissions for EnvShield config:', error);
    }
}
//# sourceMappingURL=config.js.map