import type { Telegraf } from 'telegraf';
import type { ArcaneContext, TelegramUser } from '../types/index';
import { VerificationService } from '../services/verificationService';
import { saveUser, getUserByTgId } from '../services/db';
import * as tpl from '../templates/messages';
import { mainMenu } from '../utils/keyboard';

function createDemoUser(tgId: number, firstName: string, username?: string): TelegramUser {
  return {
    telegramId:       tgId,
    telegramUsername: username,
    firstName,
    userId:           `demo_${tgId}`,
    userName:         firstName,
    linkedAt:         new Date(),
    rewardStreak:     5,
    lastRewardClaim:  null,
    referralCode:     `arc${tgId}`,
    referredBy:       undefined,
    totalReferrals:   2,
    totalCoinsEarned: 1250,
    prefs: { orders: true, coins: true, wishlist: true, deals: true, rewards: true, admin: false },
  };
}

export function registerStartCommand(
  bot: Telegraf<ArcaneContext>,
  verifyService: VerificationService,
): void {

  /* /demo — link a demo account without the website */
  bot.command('demo', async (ctx) => {
    const from = ctx.from!;
    const existing = getUserByTgId(from.id);
    if (existing) {
      await ctx.replyWithHTML(
        `✅ <b>Аккаунт уже привязан</b>\n\nВы вошли как <b>${existing.userName}</b>`,
        mainMenu(),
      );
      return;
    }
    const demoUser = createDemoUser(from.id, from.first_name, from.username);
    saveUser(demoUser);
    ctx.tgUser = demoUser;
    await ctx.replyWithHTML(
      `✅ <b>ДЕМО-АККАУНТ АКТИВИРОВАН</b>\n─────────────────────\n\nПривет, <b>${from.first_name}</b>!\n\n🪙 <b>Монеты:</b> <code>1 250</code>\n💎 <b>Уровень:</b> Elite\n🔥 <b>Серия наград:</b> 5 дней\n\nТеперь все команды доступны.\n─────────────────────\n<i>Это тестовый аккаунт. Для полной интеграции подключи arcane.uz</i>`,
      mainMenu(),
    );
  });

  bot.start(async (ctx) => {
    const payload = ctx.startPayload; // text after /start

    // ── Account linking ──────────────────────────────────
    if (payload.startsWith('verify_')) {
      const token = payload.slice('verify_'.length);
      await verifyService.handleVerification(ctx, token);
      return;
    }

    // ── Referral ─────────────────────────────────────────
    if (payload.startsWith('ref_')) {
      await verifyService.handleReferral(ctx, payload.slice('ref_'.length));
      return;
    }

    // ── Returning linked user ─────────────────────────────
    if (ctx.tgUser) {
      await ctx.replyWithHTML(tpl.tplWelcomeBack(ctx.tgUser), mainMenu());
      return;
    }

    // ── New / unlinked visitor ────────────────────────────
    await ctx.replyWithHTML(
      tpl.tplWelcomeNew(ctx.from?.first_name ?? 'игрок'),
      {
        reply_markup: {
          inline_keyboard: [[
            { text: '🔗 Подключить аккаунт', url: 'https://arcane.uz/settings' },
          ]],
        },
      },
    );
  });

  // Callback: show main menu
  bot.action('cmd_menu', async (ctx) => {
    await ctx.answerCbQuery();
    if (!ctx.tgUser) {
      await ctx.replyWithHTML(tpl.tplWelcomeNew(ctx.from?.first_name ?? 'игрок'));
      return;
    }
    await ctx.replyWithHTML(tpl.tplWelcomeBack(ctx.tgUser), mainMenu());
  });
}
