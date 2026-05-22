import crypto from 'crypto';

// ── AES-256-GCM key encryption ────────────────────────────────────────────────
//
//   Each Steam key gets its own random 12-byte IV.
//   The auth tag prevents tampering with ciphertext.
//   Master key is 32 bytes from KEY_ENCRYPTION_SECRET env var.
//
//   Storage layout (all hex strings):
//     encryptedKey | keyIv | keyTag
//
//   The plaintext key NEVER touches the database.

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;   // 96-bit IV for GCM
const TAG_LENGTH = 16;  // 128-bit auth tag

function getMasterKey(): Buffer {
  const secret = process.env.KEY_ENCRYPTION_SECRET;
  if (!secret || secret.length !== 64) {
    throw new Error(
      'KEY_ENCRYPTION_SECRET must be a 64-char hex string (32 bytes). ' +
      'Generate with: openssl rand -hex 32'
    );
  }
  return Buffer.from(secret, 'hex');
}

export interface EncryptedPayload {
  encryptedKey: string;
  keyIv: string;
  keyTag: string;
}

export function encryptKey(plaintext: string): EncryptedPayload {
  const masterKey = getMasterKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, masterKey, iv, { authTagLength: TAG_LENGTH });

  const encrypted = Buffer.concat([
    cipher.update(plaintext.trim(), 'utf8'),
    cipher.final(),
  ]);

  return {
    encryptedKey: encrypted.toString('hex'),
    keyIv: iv.toString('hex'),
    keyTag: cipher.getAuthTag().toString('hex'),
  };
}

export function decryptKey(payload: EncryptedPayload): string {
  const masterKey = getMasterKey();
  const iv = Buffer.from(payload.keyIv, 'hex');
  const tag = Buffer.from(payload.keyTag, 'hex');
  const encrypted = Buffer.from(payload.encryptedKey, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, masterKey, iv, { authTagLength: TAG_LENGTH });
  decipher.setAuthTag(tag);

  try {
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
  } catch {
    throw new Error('Key decryption failed — ciphertext may be tampered or master key changed');
  }
}

// ── Duplicate detection ───────────────────────────────────────────────────────
//
//   SHA-256 of the normalized key is stored for duplicate detection.
//   This is a one-way hash — you cannot reverse it to get the key.

export function hashKey(plaintext: string): string {
  return crypto
    .createHash('sha256')
    .update(plaintext.trim().toUpperCase())
    .digest('hex');
}

// ── Steam key format validation ───────────────────────────────────────────────

const STEAM_KEY_REGEX = /^[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/;

export function validateSteamKey(key: string): boolean {
  return STEAM_KEY_REGEX.test(key.trim().toUpperCase());
}

export function normalizeSteamKey(key: string): string {
  return key.trim().toUpperCase();
}
