import os from 'os';
import path from 'path';
import fs from 'fs';
import { spawnSync } from 'child_process';

const HOME = os.homedir();
const CONFIG_DIR = path.join(HOME, '.envshield');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

export interface Config {
  apiUrl: string;
  token: string;
  email?: string;
}

/**
 * Get the configuration from ~/.envshield/config.json
 */
export function getConfig(): Config | null {
  try {
    if (!fs.existsSync(CONFIG_FILE)) {
      return null;
    }
    const content = fs.readFileSync(CONFIG_FILE, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Failed to read config:', error);
    return null;
  }
}

/**
 * Save configuration to ~/.envshield/config.json
 * Sets file permissions to 0600 (owner read/write only)
 */
export function saveConfig(config: Config): void {
  try {
    // Create directory if it doesn't exist
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
      if (process.platform === 'win32') {
        secureWindowsPath(CONFIG_DIR);
      }
    }

    // Write config file
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), {
      encoding: 'utf8',
      mode: 0o600, // Owner read/write only
    });

    if (process.platform === 'win32') {
      secureWindowsPath(CONFIG_FILE);
    }
  } catch (error) {
    throw new Error(`Failed to save config: ${error}`);
  }
}

/**
 * Clear configuration file
 */
export function clearConfig(): void {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      fs.unlinkSync(CONFIG_FILE);
    }
  } catch (error) {
    throw new Error(`Failed to clear config: ${error}`);
  }
}

/**
 * Get the default API URL from environment or use default
 */
export function getDefaultApiUrl(): string {
  return process.env.ENVSHIELD_API_URL || 'https://env-shield.vercel.app/api/v1';
}

/**
 * Check if user is logged in (has valid token)
 */
export function isLoggedIn(): boolean {
  const config = getConfig();
  return config !== null && !!config.token;
}

/**
 * Require authentication - throws error if not logged in
 */
export function requireAuth(): Config {
  const config = getConfig();
  if (!config || !config.token) {
    throw new Error('Not authenticated. Please run "envshield login" first.');
  }
  return config;
}

function secureWindowsPath(targetPath: string) {
  try {
    const user = os.userInfo().username;

    // Remove inherited permissions
    spawnSync('icacls', [targetPath, '/inheritance:r'], { stdio: 'ignore' });

    // Reset permissions to current user only
    spawnSync('icacls', [targetPath, '/grant:r', `${user}:F`], { stdio: 'ignore' });

    // Remove access for well-known groups that might remain
    spawnSync('icacls', [targetPath, '/remove', 'Administrators', 'Users', 'Everyone'], {
      stdio: 'ignore',
    });
  } catch (error) {
    console.warn('Warning: Failed to tighten Windows permissions for EnvShield config:', error);
  }
}
