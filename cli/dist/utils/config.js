"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfig = getConfig;
exports.saveConfig = saveConfig;
exports.clearConfig = clearConfig;
exports.getDefaultApiUrl = getDefaultApiUrl;
exports.isLoggedIn = isLoggedIn;
exports.requireAuth = requireAuth;
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const HOME = os_1.default.homedir();
const CONFIG_DIR = path_1.default.join(HOME, '.envshield');
const CONFIG_FILE = path_1.default.join(CONFIG_DIR, 'config.json');
/**
 * Get the configuration from ~/.envshield/config.json
 */
function getConfig() {
    try {
        if (!fs_1.default.existsSync(CONFIG_FILE)) {
            return null;
        }
        const content = fs_1.default.readFileSync(CONFIG_FILE, 'utf8');
        return JSON.parse(content);
    }
    catch (error) {
        console.error('Failed to read config:', error);
        return null;
    }
}
/**
 * Save configuration to ~/.envshield/config.json
 * Sets file permissions to 0600 (owner read/write only)
 */
function saveConfig(config) {
    try {
        // Create directory if it doesn't exist
        if (!fs_1.default.existsSync(CONFIG_DIR)) {
            fs_1.default.mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
        }
        // Write config file
        fs_1.default.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), {
            encoding: 'utf8',
            mode: 0o600, // Owner read/write only
        });
    }
    catch (error) {
        throw new Error(`Failed to save config: ${error}`);
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
    return process.env.ENVSHIELD_API_URL || 'http://localhost:3000/api/v1';
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
function requireAuth() {
    const config = getConfig();
    if (!config || !config.token) {
        throw new Error('Not authenticated. Please run "envshield login" first.');
    }
    return config;
}
//# sourceMappingURL=config.js.map