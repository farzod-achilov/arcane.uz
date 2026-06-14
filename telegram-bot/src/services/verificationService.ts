import crypto from 'crypto';
import type { Telegraf } from 'telegraf';
import type { ArcaneContext, TelegramUser } from '../types/index';
import { addPendingToken, consumeToken, saveUser, getUserByTgId } from './db';
import * as tpl from '../templates/messages';
import { mainMenu } from '../utils/keyboard';
import { config } from '../config/index';

/**
 * Handles the account linking flow:
 *
 *   Website  → POST /api/telegram/request-token  → {token}
 *   User     → clicks  t.me/bot?start=verify_TOKEN
 *   Bot      → POST  website /api/telegram/confirm  → {userId, userName}
 *   Bot      → saves TelegramUser, sends success message
 */
export class VerificationService {
  constructor(private bot: Telegraf<ArcaneContext>) {}

  /** Called from Express /api/request-token endpoint (invoked by Next.js) */
  async createToken(userId: string, userName: string): Promise<string> {
    const token = crypto.randomBytes(20).toString('hex');
    await addPendingToken(token, {
      userId,
      userName,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min
    });
    return token;
  }

  /** Called when user sends /start verify_TOKEN */
  async handleVerification(ctx: ArcaneContext, token: string): Promise<void> {
    const from = ctx.from!;

    // Already linked?
    const existing = await getUserByTgId(from.id);
    if (existing) {
      await ctx.replyWithHTML(tpl.tplAlreadyLinked(existing), mainMenu());
      return;
    }

    const entry = await consumeToken(token);
    if (!entry) {
      await ctx.replyWithHTML(tpl.tplLinkError());
      return;
    }

    // Notify website that verification succeeded
    await this.confirmWithWebsite(entry.userId, from.id, from.username, from.first_name);

    const newUser: TelegramUser = {
      telegramId:       from.id,
      telegramUsername: from.username,
      firstName:        from.first_name,
      userId:           entry.userId,
      userName:         entry.userName,
      linkedAt:         new Date(),
      rewardStreak:     0,
      lastRewardClaim:  null,
      referralCode:     `arc${from.id}`,
      referredBy:       undefined,
      totalReferrals:   0,
      totalCoinsEarned: 0,
      prefs: {
        orders: true, coins: true, wishlist: true,
        deals: true,  rewards: true, admin: false,
      },
    };
    await saveUser(newUser);

    await ctx.replyWithHTML(tpl.tplLinkedSuccess(entry.userName), mainMenu());
  }

  /** Handle referral /start ref_CODE */
  async handleReferral(ctx: ArcaneContext, referralCode: string): Promise<void> {
    const from = ctx.from!;
    // Store referral code for when this user eventually links their account
    // In production: write to a temporary referral_pending table
    console.log(`[Referral] ${from.id} came via code: ${referralCode}`);
    await ctx.replyWithHTML(
      `🎁 <b>Реферальная ссылка активирована!</b>\n\nПосле подключения аккаунта ты получишь <b>+200 Arcane Coins</b>!\n\nПодключи аккаунт на <a href="https://arcane.uz/settings">arcane.uz</a>`,
    );
  }

  /** Notify Next.js website that linking succeeded */
  private async confirmWithWebsite(
    userId: string,
    telegramId: number,
    username: string | undefined,
    firstName: string,
  ): Promise<void> {
    try {
      await fetch(`${config.website.url}/api/telegram/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-secret': config.website.secret,
        },
        body: JSON.stringify({ userId, telegramId, username, firstName }),
      });
    } catch (err) {
      console.error('[Verify] Could not confirm with website:', err);
      // Non-fatal — user is still linked in the bot's store
    }
  }
}
