/**
 * Unit tests for encryption utilities
 */

import { encrypt, decrypt, encryptForStorage, decryptFromStorage } from '../encryption';

describe('Encryption Utils', () => {
  describe('encrypt', () => {
    it('should encrypt text and return EncryptedData object', () => {
      const text = 'my-secret-value';
      const result = encrypt(text);
      
      expect(result).toHaveProperty('encrypted');
      expect(result).toHaveProperty('iv');
      expect(result).toHaveProperty('tag');
      expect(typeof result.encrypted).toBe('string');
      expect(typeof result.iv).toBe('string');
      expect(typeof result.tag).toBe('string');
    });

    it('should generate different IV for each encryption', () => {
      const text = 'my-secret-value';
      const result1 = encrypt(text);
      const result2 = encrypt(text);
      
      expect(result1.iv).not.toBe(result2.iv);
      expect(result1.encrypted).not.toBe(result2.encrypted);
    });

    it('should encrypt empty string', () => {
      const result = encrypt('');
      expect(result).toHaveProperty('encrypted');
      expect(result).toHaveProperty('iv');
      expect(result).toHaveProperty('tag');
    });

    it('should encrypt special characters', () => {
      const text = '!@#$%^&*()_+-={}[]|\\:";\'<>?,./~`';
      const result = encrypt(text);
      const decrypted = decrypt(result);
      expect(decrypted).toBe(text);
    });

    it('should encrypt unicode characters', () => {
      const text = '你好世界 🌍🔒';
      const result = encrypt(text);
      const decrypted = decrypt(result);
      expect(decrypted).toBe(text);
    });
  });

  describe('decrypt', () => {
    it('should decrypt encrypted data back to original text', () => {
      const original = 'my-secret-value';
      const encrypted = encrypt(original);
      const decrypted = decrypt(encrypted);
      
      expect(decrypted).toBe(original);
    });

    it('should handle long strings', () => {
      const original = 'a'.repeat(10000);
      const encrypted = encrypt(original);
      const decrypted = decrypt(encrypted);
      
      expect(decrypted).toBe(original);
    });

    it('should throw error for invalid encrypted data', () => {
      const invalidData = {
        encrypted: 'invalid',
        iv: 'invalid',
        tag: 'invalid',
      };
      
      expect(() => decrypt(invalidData)).toThrow();
    });

    it('should throw error for tampered data', () => {
      const encrypted = encrypt('original-data');
      encrypted.encrypted = encrypted.encrypted.slice(0, -2) + 'XX';
      
      expect(() => decrypt(encrypted)).toThrow();
    });
  });

  describe('encryptForStorage', () => {
    it('should return JSON string', () => {
      const text = 'my-secret-value';
      const result = encryptForStorage(text);
      
      expect(typeof result).toBe('string');
      expect(() => JSON.parse(result)).not.toThrow();
    });

    it('should be parseable and decryptable', () => {
      const original = 'my-secret-value';
      const stored = encryptForStorage(original);
      const parsed = JSON.parse(stored);
      const decrypted = decrypt(parsed);
      
      expect(decrypted).toBe(original);
    });

    it('should handle complex JSON values', () => {
      const original = JSON.stringify({
        key: 'value',
        nested: { data: 'test' },
        array: [1, 2, 3],
      });
      const stored = encryptForStorage(original);
      const decrypted = decryptFromStorage(stored);
      
      expect(decrypted).toBe(original);
    });
  });

  describe('decryptFromStorage', () => {
    it('should decrypt stored encrypted data', () => {
      const original = 'my-secret-value';
      const stored = encryptForStorage(original);
      const decrypted = decryptFromStorage(stored);
      
      expect(decrypted).toBe(original);
    });

    it('should throw error for invalid JSON', () => {
      expect(() => decryptFromStorage('invalid-json')).toThrow();
    });

    it('should throw error for incomplete data', () => {
      const incomplete = JSON.stringify({
        encrypted: 'data',
        // missing iv and tag
      });
      
      expect(() => decryptFromStorage(incomplete)).toThrow();
    });
  });

  describe('Integration tests', () => {
    it('should handle complete encrypt/decrypt cycle', () => {
      const secrets = [
        'DATABASE_URL=postgresql://localhost:5432/db',
        'API_KEY=sk_live_123456789',
        'PASSWORD=P@ssw0rd!',
        '',
        '🔐 secure value',
      ];

      secrets.forEach(secret => {
        const encrypted = encryptForStorage(secret);
        const decrypted = decryptFromStorage(encrypted);
        expect(decrypted).toBe(secret);
      });
    });

    it('should be deterministic in decryption', () => {
      const original = 'test-value';
      const stored = encryptForStorage(original);
      
      // Decrypt multiple times
      const results = Array.from({ length: 5 }, () => decryptFromStorage(stored));
      
      results.forEach(result => {
        expect(result).toBe(original);
      });
    });
  });
});
