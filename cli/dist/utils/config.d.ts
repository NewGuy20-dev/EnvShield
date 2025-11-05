export interface Config {
    apiUrl: string;
    token: string;
    email?: string;
}
/**
 * Get the configuration from ~/.envshield/config.json
 */
export declare function getConfig(): Config | null;
/**
 * Save configuration to ~/.envshield/config.json
 * Sets file permissions to 0600 (owner read/write only)
 */
export declare function saveConfig(config: Config): void;
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
export declare function requireAuth(): Config;
//# sourceMappingURL=config.d.ts.map