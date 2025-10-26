// lib/encryption.ts
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_HEX = process.env.ENCRYPTION_KEY!;
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
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    encrypted: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
  };
}

export function decrypt(data: EncryptedData): string {
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
}

export function encryptForStorage(text: string): string {
  return JSON.stringify(encrypt(text));
}

export function decryptFromStorage(stored: string): string {
  const data: EncryptedData = JSON.parse(stored);
  return decrypt(data);
}
