import { createHash, createHmac } from 'crypto';

export interface TelegramAuthData {
  id:         string | number;
  first_name: string;
  last_name?: string;
  username?:  string;
  photo_url?: string;
  auth_date:  string | number;
  hash:       string;
}

export function verifyTelegramAuth(data: TelegramAuthData, botToken: string): boolean {
  const { hash, ...fields } = data;

  const checkString = (Object.keys(fields) as (keyof typeof fields)[])
    .filter(k => fields[k] !== undefined && fields[k] !== null && fields[k] !== '')
    .sort()
    .map(k => `${k}=${fields[k]}`)
    .join('\n');

  const secretKey    = createHash('sha256').update(botToken).digest();
  const computedHash = createHmac('sha256', secretKey).update(checkString).digest('hex');

  return computedHash === hash;
}

export function isTelegramAuthFresh(authDate: string | number, maxAgeSeconds = 86400): boolean {
  const now = Math.floor(Date.now() / 1000);
  return now - Number(authDate) <= maxAgeSeconds;
}
