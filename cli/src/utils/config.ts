import os from 'os';
import path from 'path';
import fs from 'fs';
import { spawnSync } from 'child_process';

const HOME = os.homedir();
const CONFIG_DIR = path.join(HOME, '.envshield');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

export interface ProfileConfig {
  apiUrl: string;
  token: string;
  tokenId?: string;
  tokenName?: string;
  expiresAt?: string;
  email?: string;
}

export interface MultiProfileConfig {
  activeProfile: string;
  profiles: Record<string, ProfileConfig>;
}

export interface Config extends ProfileConfig {} // Legacy compatibility

/**
 * Get the full multi-profile configuration from ~/.envshield/config.json
 */
export function getFullConfig(): MultiProfileConfig | null {
  try {
    if (!fs.existsSync(CONFIG_FILE)) {
      return null;
    }
    const content = fs.readFileSync(CONFIG_FILE, 'utf8');
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

    return parsed as MultiProfileConfig;
  } catch (error) {
    console.error('Failed to read config:', error);
    return null;
  }
}

/**
 * Get the active profile configuration (or legacy single config)
 */
export function getConfig(profileName?: string): ProfileConfig | null {
  try {
    const fullConfig = getFullConfig();
    if (!fullConfig) {
      return null;
    }

    const profile = profileName || fullConfig.activeProfile;
    return fullConfig.profiles[profile] || null;
  } catch (error) {
    console.error('Failed to read config:', error);
    return null;
  }
}

/**
 * Get the active profile name
 */
export function getActiveProfile(): string | null {
  const fullConfig = getFullConfig();
  return fullConfig?.activeProfile || null;
}

/**
 * List all available profiles
 */
export function listProfiles(): string[] {
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
export function saveConfig(config: ProfileConfig, profileName?: string): void {
  try {
    // Create directory if it doesn't exist
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
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
    } else {
      // Update existing config
      fullConfig.profiles[profile] = config;
      fullConfig.activeProfile = profile;
    }

    // Write config file
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(fullConfig, null, 2), {
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
 * Switch to a different profile
 */
export function switchProfile(profileName: string): void {
  const fullConfig = getFullConfig();
  if (!fullConfig) {
    throw new Error('No configuration found. Please login first.');
  }

  if (!fullConfig.profiles[profileName]) {
    throw new Error(`Profile "${profileName}" not found.`);
  }

  fullConfig.activeProfile = profileName;

  fs.writeFileSync(CONFIG_FILE, JSON.stringify(fullConfig, null, 2), {
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
export function removeProfile(profileName: string): void {
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
    } else {
      // No profiles left, clear config
      clearConfig();
      return;
    }
  }

  fs.writeFileSync(CONFIG_FILE, JSON.stringify(fullConfig, null, 2), {
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
export function requireAuth(profileName?: string): ProfileConfig {
  const config = getConfig(profileName);
  if (!config || !config.token) {
    const profileMsg = profileName ? ` for profile "${profileName}"` : '';
    throw new Error(`Not authenticated${profileMsg}. Please run "envshield login" first.`);
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
