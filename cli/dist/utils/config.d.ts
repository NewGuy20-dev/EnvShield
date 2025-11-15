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
export interface Config extends ProfileConfig {
}
/**
 * Get the full multi-profile configuration from ~/.envshield/config.json
 */
export declare function getFullConfig(): MultiProfileConfig | null;
/**
 * Get the active profile configuration (or legacy single config)
 */
export declare function getConfig(profileName?: string): ProfileConfig | null;
/**
 * Get the active profile name
 */
export declare function getActiveProfile(): string | null;
/**
 * List all available profiles
 */
export declare function listProfiles(): string[];
/**
 * Save configuration to ~/.envshield/config.json
 * Sets file permissions to 0600 (owner read/write only)
 * Supports multi-profile configuration
 */
export declare function saveConfig(config: ProfileConfig, profileName?: string): void;
/**
 * Switch to a different profile
 */
export declare function switchProfile(profileName: string): void;
/**
 * Remove a profile
 */
export declare function removeProfile(profileName: string): void;
/**
 * Clear configuration file
 */
export declare function clearConfig(): void;
/**
 * Get the default API URL from environment or use default
 */
export declare function getDefaultApiUrl(): string;
/**
 * Check if user is logged in (has valid token)
 */
export declare function isLoggedIn(): boolean;
/**
 * Require authentication - throws error if not logged in
 */
export declare function requireAuth(profileName?: string): ProfileConfig;
//# sourceMappingURL=config.d.ts.map