import { describe, it, expect, beforeAll } from 'vitest';
import crypto from 'crypto';
import { encryptKey, decryptKey, hashKey, normalizeSteamKey, validateSteamKey } from '@/lib/keys/encryption';

beforeAll(() => {
  process.env.KEY_ENCRYPTION_SECRET = crypto.randomBytes(32).toString('hex');
});

describe('game key encryption', () => {
  it('round-trips a key through encrypt/decrypt', () => {
    const key = 'ABCDE-12345-FGHIJ';
    expect(decryptKey(encryptKey(key))).toBe(key);
  });

  it('produces a different ciphertext per call (random IV)', () => {
    const key = 'ABCDE-12345-FGHIJ';
    expect(encryptKey(key).encryptedKey).not.toBe(encryptKey(key).encryptedKey);
  });

  it('rejects tampered ciphertext (GCM auth tag)', () => {
    const enc = encryptKey('ABCDE-12345-FGHIJ');
    const tampered = { ...enc, encryptedKey: enc.encryptedKey.replace(/^../, '00') };
    expect(() => decryptKey(tampered)).toThrow();
  });
});

describe('hashKey', () => {
  it('is case- and whitespace-insensitive (dedup check)', () => {
    expect(hashKey(' abcde-12345-fghij ')).toBe(hashKey('ABCDE-12345-FGHIJ'));
  });
});

describe('steam key validation', () => {
  it('accepts the XXXXX-XXXXX-XXXXX format', () => {
    expect(validateSteamKey('abcde-12345-fghij')).toBe(true);
  });
  it('rejects malformed keys', () => {
    expect(validateSteamKey('not-a-key')).toBe(false);
    expect(validateSteamKey('ABCDE-12345')).toBe(false);
    expect(validateSteamKey('')).toBe(false);
  });
  it('normalizes to uppercase', () => {
    expect(normalizeSteamKey(' abcde-12345-fghij ')).toBe('ABCDE-12345-FGHIJ');
  });
});
