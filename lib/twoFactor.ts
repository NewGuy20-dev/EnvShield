/**
 * Two-Factor Authentication (2FA) with TOTP
 * 
 * Implements Time-based One-Time Password (TOTP) authentication
 * using authenticator apps like Google Authenticator or Authy.
 */

import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { randomBytes } from 'crypto';

const APP_NAME = 'EnvShield';

export interface TwoFactorSecret {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

/**
 * Generate a new 2FA secret for a user
 */
export async function generateTwoFactorSecret(
  userEmail: string
): Promise<TwoFactorSecret> {
  // Generate secret
  const secret = speakeasy.generateSecret({
    name: `${APP_NAME} (${userEmail})`,
    issuer: APP_NAME,
    length: 32,
  });

  if (!secret.otpauth_url) {
    throw new Error('Failed to generate 2FA secret');
  }

  // Generate QR code
  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

  // Generate 10 backup codes
  const backupCodes = generateBackupCodes(10);

  return {
    secret: secret.base32,
    qrCodeUrl,
    backupCodes,
  };
}

/**
 * Verify a TOTP token
 */
export function verifyTwoFactorToken(secret: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2, // Allow 2 time windows (60 seconds) for clock drift
  });
}

/**
 * Generate backup codes
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  
  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric code
    const code = randomBytes(4).toString('hex').toUpperCase();
    // Format as XXXX-XXXX for readability
    const formatted = `${code.slice(0, 4)}-${code.slice(4, 8)}`;
    codes.push(formatted);
  }
  
  return codes;
}

/**
 * Hash backup codes for storage (using bcrypt)
 */
export async function hashBackupCodes(codes: string[]): Promise<string[]> {
  const bcrypt = await import('bcryptjs');
  return Promise.all(codes.map(code => bcrypt.hash(code, 10)));
}

/**
 * Verify a backup code
 */
export async function verifyBackupCode(
  code: string,
  hashedCodes: string[]
): Promise<{ valid: boolean; codeIndex: number }> {
  const bcrypt = await import('bcryptjs');
  
  for (let i = 0; i < hashedCodes.length; i++) {
    const isValid = await bcrypt.compare(code, hashedCodes[i]);
    if (isValid) {
      return { valid: true, codeIndex: i };
    }
  }
  
  return { valid: false, codeIndex: -1 };
}

/**
 * Generate a recovery code for disabling 2FA
 */
export function generateRecoveryCode(): string {
  return randomBytes(16).toString('hex').toUpperCase();
}

/**
 * Check if 2FA is required for a user role
 */
export function isTwoFactorRequired(role: string): boolean {
  return ['OWNER', 'ADMIN'].includes(role);
}

/**
 * Format backup codes for display
 */
export function formatBackupCodesForDisplay(codes: string[]): string {
  return codes
    .map((code, index) => `${(index + 1).toString().padStart(2, '0')}. ${code}`)
    .join('\n');
}

/**
 * Validate TOTP token format
 */
export function isValidTotpFormat(token: string): boolean {
  // TOTP tokens are 6 digits
  return /^\d{6}$/.test(token);
}

/**
 * Validate backup code format
 */
export function isValidBackupCodeFormat(code: string): boolean {
  // Backup codes are in format XXXX-XXXX
  return /^[A-F0-9]{4}-[A-F0-9]{4}$/i.test(code);
}

/**
 * Get current TOTP token (for testing)
 */
export function getCurrentToken(secret: string): string {
  return speakeasy.totp({
    secret,
    encoding: 'base32',
  });
}

/**
 * Calculate time until next TOTP token
 */
export function getTimeUntilNextToken(): number {
  const now = Math.floor(Date.now() / 1000);
  const period = 30; // TOTP period is 30 seconds
  const timeInPeriod = now % period;
  return period - timeInPeriod;
}

/**
 * 2FA Setup Instructions
 */
export const SETUP_INSTRUCTIONS = `
1. Install an authenticator app on your phone:
   - Google Authenticator
   - Authy
   - Microsoft Authenticator
   - 1Password

2. Scan the QR code with your authenticator app

3. Enter the 6-digit code from your app to verify setup

4. Save your backup codes in a secure location
   - These codes can be used if you lose access to your authenticator app
   - Each code can only be used once

5. Keep your backup codes safe:
   - Store them in a password manager
   - Print them and keep in a secure location
   - Never share them with anyone
`;
