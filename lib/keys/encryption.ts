import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH  = 12;
const TAG_LENGTH = 16;

function getMasterKey(): Buffer {
  const secret = process.env.KEY_ENCRYPTION_SECRET;
  if (!secret || secret.length !== 64) {
    throw new Error(
      'KEY_ENCRYPTION_SECRET must be a 64-char hex string (32 bytes). ' +
      'Generate with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"',
    );
  }
  return Buffer.from(secret, 'hex');
}

export interface EncryptedPayload {
  encryptedKey: string;
  keyIv:        string;
  keyTag:       string;
}

export function encryptKey(plaintext: string): EncryptedPayload {
  const masterKey = getMasterKey();
  const iv        = crypto.randomBytes(IV_LENGTH);
  const cipher    = crypto.createCipheriv(ALGORITHM, masterKey, iv, { authTagLength: TAG_LENGTH });
  const encrypted = Buffer.concat([cipher.update(plaintext.trim(), 'utf8'), cipher.final()]);
  return {
    encryptedKey: encrypted.toString('hex'),
    keyIv:        iv.toString('hex'),
    keyTag:       cipher.getAuthTag().toString('hex'),
  };
}

export function decryptKey(payload: EncryptedPayload): string {
  const masterKey  = getMasterKey();
  const iv         = Buffer.from(payload.keyIv, 'hex');
  const tag        = Buffer.from(payload.keyTag, 'hex');
  const encrypted  = Buffer.from(payload.encryptedKey, 'hex');
  const decipher   = crypto.createDecipheriv(ALGORITHM, masterKey, iv, { authTagLength: TAG_LENGTH });
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

export function hashKey(plaintext: string): string {
  return crypto.createHash('sha256').update(plaintext.trim().toUpperCase()).digest('hex');
}

export function normalizeSteamKey(key: string): string {
  return key.trim().toUpperCase();
}

export const STEAM_KEY_RE = /^[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/;

export function validateSteamKey(key: string): boolean {
  return STEAM_KEY_RE.test(normalizeSteamKey(key));
}
