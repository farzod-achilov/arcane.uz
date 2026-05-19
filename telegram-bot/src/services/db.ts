/**
 * In-memory data store.
 * Replace with PostgreSQL / Redis in production using the same interface.
 *
 * Schema hint (PostgreSQL):
 *   TABLE telegram_users (
 *     telegram_id     BIGINT PRIMARY KEY,
 *     telegram_username VARCHAR(64),
 *     first_name      VARCHAR(128),
 *     user_id         VARCHAR(64) UNIQUE NOT NULL,
 *     user_name       VARCHAR(128),
 *     linked_at       TIMESTAMPTZ DEFAULT now(),
 *     reward_streak   INT DEFAULT 0,
 *     last_reward_claim TIMESTAMPTZ,
 *     referral_code   VARCHAR(32) UNIQUE,
 *     referred_by     VARCHAR(32),
 *     total_referrals INT DEFAULT 0,
 *     total_coins_earned INT DEFAULT 0,
 *     prefs_orders    BOOL DEFAULT true,
 *     prefs_coins     BOOL DEFAULT true,
 *     prefs_wishlist  BOOL DEFAULT true,
 *     prefs_deals     BOOL DEFAULT true,
 *     prefs_rewards   BOOL DEFAULT true,
 *     prefs_admin     BOOL DEFAULT false
 *   );
 *   TABLE pending_tokens (
 *     token      VARCHAR(64) PRIMARY KEY,
 *     user_id    VARCHAR(64),
 *     user_name  VARCHAR(128),
 *     expires_at TIMESTAMPTZ
 *   );
 */

import type { TelegramUser, PendingToken } from '../types/index';

/* ── Stores ───────────────────────────────────────────── */

/** telegram_id → TelegramUser */
export const usersByTgId  = new Map<number, TelegramUser>();

/** arcane user_id → TelegramUser */
export const usersByUserId = new Map<string, TelegramUser>();

/** token → PendingToken */
export const pendingTokens = new Map<string, PendingToken>();

/** referral_code → telegram_id */
export const referralCodes = new Map<string, number>();

/* ── Helpers ──────────────────────────────────────────── */

export function saveUser(user: TelegramUser): void {
  usersByTgId.set(user.telegramId, user);
  usersByUserId.set(user.userId, user);
  referralCodes.set(user.referralCode, user.telegramId);
}

export function getUserByTgId(tgId: number): TelegramUser | undefined {
  return usersByTgId.get(tgId);
}

export function getUserByUserId(userId: string): TelegramUser | undefined {
  return usersByUserId.get(userId);
}

export function getUserByReferralCode(code: string): TelegramUser | undefined {
  const tgId = referralCodes.get(code);
  return tgId ? usersByTgId.get(tgId) : undefined;
}

export function updateUser(tgId: number, patch: Partial<TelegramUser>): void {
  const user = usersByTgId.get(tgId);
  if (!user) return;
  const updated = { ...user, ...patch };
  usersByTgId.set(tgId, updated);
  usersByUserId.set(updated.userId, updated);
}

export function addPendingToken(token: string, entry: PendingToken): void {
  pendingTokens.set(token, entry);
  // Auto-cleanup expired tokens
  setTimeout(() => pendingTokens.delete(token), 10 * 60 * 1000);
}

export function consumeToken(token: string): PendingToken | null {
  const entry = pendingTokens.get(token);
  if (!entry) return null;
  if (new Date() > entry.expiresAt) {
    pendingTokens.delete(token);
    return null;
  }
  pendingTokens.delete(token);
  return entry;
}
