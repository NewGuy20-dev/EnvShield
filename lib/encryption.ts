// lib/encryption.ts
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_HEX = process.env.ENCRYPTION_KEY;
if (!KEY_HEX || KEY_HEX.length !== 64) {
  throw new Error('ENCRYPTION_KEY must be a 64-hex-character string (32 bytes).');
}
const ENCRYPTION_KEY = Buffer.from(KEY_HEX, 'hex');

export interface EncryptedData {
  encrypted: string; // base64
  iv: string;        // base64
  tag: string;       // base64
}

export function encrypt(text: string): EncryptedData {
  if (!text) {
    throw new Error('Encryption failed: input text cannot be empty.');
  }
  try {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return {
      encrypted: encrypted.toString('base64'),
      iv: iv.toString('base64'),
      tag: tag.toString('base64'),
    };
  } catch (error) {
    throw new Error(`Encryption failed: ${error.message}`);
  }
}

export function decrypt(data: EncryptedData): string {
  try {
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      ENCRYPTION_KEY,
      Buffer.from(data.iv, 'base64')
    );
    decipher.setAuthTag(Buffer.from(data.tag, 'base64'));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(data.encrypted, 'base64')),
      decipher.final(),
    ]);
    return decrypted.toString('utf8');
  } catch (error) {
    throw new Error('Decryption failed: data may be corrupted or tampered with');
  }
}

export function encryptForStorage(text: string): string {
  return JSON.stringify(encrypt(text));
}

export function decryptFromStorage(stored: string): string {
  try {
    const data: EncryptedData = JSON.parse(stored);
    if (
      !data ||
      typeof data.encrypted !== 'string' ||
      typeof data.iv !== 'string' ||
      typeof data.tag !== 'string'
    ) {
      throw new Error('Invalid encrypted data format');
    }
    return decrypt(data);
  } catch (error) {
    throw new Error(`Failed to decrypt from storage: ${error.message}`);
  }
}
