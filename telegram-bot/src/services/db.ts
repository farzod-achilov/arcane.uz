import crypto from 'crypto';
import type { TelegramUser, PendingToken } from '../types/index';
import { prisma } from './prisma';

// ── Helpers: map DB row → TelegramUser ───────────────────

function rowToUser(row: {
  telegramId: bigint; telegramUsername: string | null; firstName: string;
  userId: string; userName: string; linkedAt: Date; rewardStreak: number;
  lastRewardClaim: Date | null; referralCode: string; referredBy: string | null;
  totalReferrals: number; totalCoinsEarned: number;
  prefsOrders: boolean; prefsCoins: boolean; prefsWishlist: boolean;
  prefsDeals: boolean; prefsRewards: boolean; prefsAdmin: boolean;
}): TelegramUser {
  return {
    telegramId:       Number(row.telegramId),
    telegramUsername: row.telegramUsername ?? undefined,
    firstName:        row.firstName,
    userId:           row.userId,
    userName:         row.userName,
    linkedAt:         row.linkedAt,
    rewardStreak:     row.rewardStreak,
    lastRewardClaim:  row.lastRewardClaim,
    referralCode:     row.referralCode,
    referredBy:       row.referredBy ?? undefined,
    totalReferrals:   row.totalReferrals,
    totalCoinsEarned: row.totalCoinsEarned,
    prefs: {
      orders:   row.prefsOrders,
      coins:    row.prefsCoins,
      wishlist: row.prefsWishlist,
      deals:    row.prefsDeals,
      rewards:  row.prefsRewards,
      admin:    row.prefsAdmin,
    },
  };
}

// ── User operations ───────────────────────────────────────

export async function saveUser(user: TelegramUser): Promise<void> {
  await prisma.telegram_users.upsert({
    where:  { telegramId: BigInt(user.telegramId) },
    create: {
      telegramId:       BigInt(user.telegramId),
      telegramUsername: user.telegramUsername,
      firstName:        user.firstName,
      userId:           user.userId,
      userName:         user.userName,
      linkedAt:         user.linkedAt,
      rewardStreak:     user.rewardStreak,
      lastRewardClaim:  user.lastRewardClaim,
      referralCode:     user.referralCode,
      referredBy:       user.referredBy,
      totalReferrals:   user.totalReferrals,
      totalCoinsEarned: user.totalCoinsEarned,
      prefsOrders:      user.prefs.orders,
      prefsCoins:       user.prefs.coins,
      prefsWishlist:    user.prefs.wishlist,
      prefsDeals:       user.prefs.deals,
      prefsRewards:     user.prefs.rewards,
      prefsAdmin:       user.prefs.admin,
    },
    update: {
      telegramUsername: user.telegramUsername,
      firstName:        user.firstName,
      userName:         user.userName,
      rewardStreak:     user.rewardStreak,
      lastRewardClaim:  user.lastRewardClaim,
      totalReferrals:   user.totalReferrals,
      totalCoinsEarned: user.totalCoinsEarned,
      prefsOrders:      user.prefs.orders,
      prefsCoins:       user.prefs.coins,
      prefsWishlist:    user.prefs.wishlist,
      prefsDeals:       user.prefs.deals,
      prefsRewards:     user.prefs.rewards,
      prefsAdmin:       user.prefs.admin,
    },
  });
}

export async function getUserByTgId(tgId: number): Promise<TelegramUser | undefined> {
  const row = await prisma.telegram_users.findUnique({ where: { telegramId: BigInt(tgId) } });
  return row ? rowToUser(row) : undefined;
}

export async function getUserByUserId(userId: string): Promise<TelegramUser | undefined> {
  const row = await prisma.telegram_users.findUnique({ where: { userId } });
  return row ? rowToUser(row) : undefined;
}

export async function getUserByReferralCode(code: string): Promise<TelegramUser | undefined> {
  const row = await prisma.telegram_users.findUnique({ where: { referralCode: code } });
  return row ? rowToUser(row) : undefined;
}

export async function updateUser(tgId: number, patch: Partial<TelegramUser>): Promise<void> {
  await prisma.telegram_users.update({
    where: { telegramId: BigInt(tgId) },
    data: {
      ...(patch.telegramUsername !== undefined && { telegramUsername: patch.telegramUsername }),
      ...(patch.firstName        !== undefined && { firstName:        patch.firstName }),
      ...(patch.userName         !== undefined && { userName:         patch.userName }),
      ...(patch.rewardStreak     !== undefined && { rewardStreak:     patch.rewardStreak }),
      ...(patch.lastRewardClaim  !== undefined && { lastRewardClaim:  patch.lastRewardClaim }),
      ...(patch.totalReferrals   !== undefined && { totalReferrals:   patch.totalReferrals }),
      ...(patch.totalCoinsEarned !== undefined && { totalCoinsEarned: patch.totalCoinsEarned }),
      ...(patch.prefs && {
        prefsOrders:   patch.prefs.orders,
        prefsCoins:    patch.prefs.coins,
        prefsWishlist: patch.prefs.wishlist,
        prefsDeals:    patch.prefs.deals,
        prefsRewards:  patch.prefs.rewards,
        prefsAdmin:    patch.prefs.admin,
      }),
    },
  });
}

// ── Referral operations ───────────────────────────────────

const REFERRAL_PENDING_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/** Remember that this (not-yet-linked) Telegram user came via a referral code. */
export async function savePendingReferral(telegramId: number, referralCode: string): Promise<void> {
  await prisma.telegram_referral_pending.upsert({
    where:  { telegramId: BigInt(telegramId) },
    create: { telegramId: BigInt(telegramId), referralCode, expiresAt: new Date(Date.now() + REFERRAL_PENDING_TTL_MS) },
    update: { referralCode, expiresAt: new Date(Date.now() + REFERRAL_PENDING_TTL_MS) },
  });
}

/** Consume (and delete) the pending referral for this Telegram user, if any and not expired. */
export async function consumePendingReferral(telegramId: number): Promise<string | null> {
  const row = await prisma.telegram_referral_pending.findUnique({ where: { telegramId: BigInt(telegramId) } });
  if (!row) return null;
  await prisma.telegram_referral_pending.delete({ where: { telegramId: BigInt(telegramId) } }).catch(() => {});
  if (row.expiresAt < new Date()) return null;
  return row.referralCode;
}

const REFERRAL_REWARD_COINS = 200;

/**
 * Credits the referrer (found by their Telegram referral code) after the
 * referred user finishes linking their site account. Returns the referrer's
 * Telegram id (to notify them) or null if no valid referrer was credited
 * (unknown code, or the referrer somehow referred themselves).
 */
export async function creditReferrer(referralCode: string, newUserId: string): Promise<number | null> {
  const referrer = await prisma.telegram_users.findUnique({ where: { referralCode } });
  if (!referrer || referrer.userId === newUserId) return null;

  const user = await prisma.users.findUnique({ where: { id: referrer.userId }, select: { arcCoins: true } });
  if (!user) return null;

  await prisma.$transaction([
    prisma.users.update({
      where: { id: referrer.userId },
      data:  { arcCoins: { increment: REFERRAL_REWARD_COINS } },
    }),
    prisma.transactions.create({
      data: {
        id:            crypto.randomUUID(),
        userId:        referrer.userId,
        type:          'REFERRAL_BONUS',
        amount:        REFERRAL_REWARD_COINS,
        balanceBefore: user.arcCoins,
        balanceAfter:  user.arcCoins + REFERRAL_REWARD_COINS,
        description:   'Реферальный бонус за Telegram-приглашение',
      },
    }),
    prisma.telegram_users.update({
      where: { telegramId: referrer.telegramId },
      data:  { totalReferrals: { increment: 1 }, totalCoinsEarned: { increment: REFERRAL_REWARD_COINS } },
    }),
  ]);

  return Number(referrer.telegramId);
}

// ── Token operations ──────────────────────────────────────

export async function addPendingToken(token: string, entry: PendingToken): Promise<void> {
  await prisma.pending_tokens.create({
    data: { token, userId: entry.userId, userName: entry.userName, expiresAt: entry.expiresAt },
  });
}

export async function consumeToken(token: string): Promise<PendingToken | null> {
  const row = await prisma.pending_tokens.findUnique({ where: { token } });
  if (!row) return null;
  if (new Date() > row.expiresAt) {
    await prisma.pending_tokens.delete({ where: { token } }).catch(() => {});
    return null;
  }
  await prisma.pending_tokens.delete({ where: { token } });
  return { userId: row.userId, userName: row.userName, expiresAt: row.expiresAt };
}
