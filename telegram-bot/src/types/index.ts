import type { Context } from 'telegraf';

/* ── Notification preferences ────────────────────────── */
export interface NotifPrefs {
  orders:   boolean;
  coins:    boolean;
  wishlist: boolean;
  deals:    boolean;
  rewards:  boolean;
  admin:    boolean;
}

/* ── Linked user stored in bot's in-memory DB ─────────── */
export interface TelegramUser {
  telegramId:       number;
  telegramUsername: string | undefined;
  firstName:        string;
  userId:           string;   // arcane.uz user ID
  userName:         string;   // arcane.uz display name
  linkedAt:         Date;
  rewardStreak:     number;
  lastRewardClaim:  Date | null;
  referralCode:     string;
  referredBy:       string | undefined;
  totalReferrals:   number;
  totalCoinsEarned: number;
  prefs:            NotifPrefs;
}

/* ── Pending verification token ──────────────────────── */
export interface PendingToken {
  userId:     string;
  userName:   string;
  expiresAt:  Date;
}

/* ── Notification payload (from website → bot) ────────── */
export type NotifEventType =
  | 'ORDER_CONFIRMED'
  | 'ORDER_PROCESSING'
  | 'ORDER_DELIVERED'
  | 'ORDER_COMPLETED'
  | 'PAYMENT_FAILED'
  | 'COINS_EARNED'
  | 'COINS_SPENT'
  | 'LEVEL_UP'
  | 'WISHLIST_PRICE_DROP'
  | 'WISHLIST_IN_STOCK'
  | 'DEAL_ALERT'
  | 'REWARD_AVAILABLE'
  | 'REFERRAL_JOINED';

export interface NotifPayload {
  userId:    string;
  event:     NotifEventType;
  data:      Record<string, string | number | boolean>;
}

/* ── Custom bot context ──────────────────────────────── */
export interface ArcaneContext extends Context {
  tgUser?: TelegramUser; // attached by auth middleware if user is linked
}

/* ── Order (mock shape matching website) ─────────────── */
export interface Order {
  id:        string;
  gameTitle: string;
  platform:  string;
  price:     number;
  status:    'pending' | 'processing' | 'delivered' | 'completed';
  date:      string;
  coinsEarned: number;
}
