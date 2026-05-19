import type { Telegraf } from 'telegraf';
import type { ArcaneContext } from '../types/index';
import { NotificationService } from '../services/notificationService';
import * as tpl from '../templates/messages';
import { supportMenu, backMenu } from '../utils/keyboard';
import { config } from '../config/index';

const SUPPORT_CATEGORIES: Record<string, string> = {
  support_order:   'Проблема с заказом',
  support_payment: 'Вопрос по оплате',
  support_key:     'Ключ не работает',
  support_coins:   'Arcane Coins',
  support_human:   'Связь с менеджером',
};

/* Track which users are in "waiting for reply" mode:
   telegramId → category */
const awaitingReply = new Map<number, string>();

export function registerSupportCommand(
  bot: Telegraf<ArcaneContext>,
  notifService: NotificationService,
): void {

  const showSupport = async (ctx: ArcaneContext) => {
    await ctx.replyWithHTML(tpl.tplSupport(), supportMenu());
  };

  bot.command('support', showSupport);
  bot.action('cmd_support', async (ctx) => {
    await ctx.answerCbQuery();
    await showSupport(ctx);
  });

  /* ── Category buttons ──────────────────────────────── */
  Object.keys(SUPPORT_CATEGORIES).forEach((key) => {
    bot.action(key, async (ctx) => {
      await ctx.answerCbQuery();
      const category = SUPPORT_CATEGORIES[key];
      const from = ctx.from!;
      const userName = ctx.tgUser?.userName ?? from.first_name;

      if (key === 'support_human') {
        /* Put user in reply-waiting mode */
        awaitingReply.set(from.id, category);

        await ctx.replyWithHTML(
          `💬 <b>СВЯЗЬ С МЕНЕДЖЕРОМ</b>\n─────────────────────\n\nНапиши своё сообщение прямо сейчас.\n\nМенеджер ответит в течение 5 минут.\n\n<i>Для отмены напиши /cancel</i>`,
        );
      } else {
        /* Create ticket + notify admin */
        awaitingReply.set(from.id, category);

        await ctx.replyWithHTML(
          tpl.tplSupportTicket(category, userName),
          backMenu(),
        );

        await notifService.notifyAdmin(
          tpl.tplAdminSupportRequest(userName, category) +
          `\n\n<b>Telegram ID:</b> <code>${from.id}</code>` +
          (from.username ? `\n<b>Username:</b> @${from.username}` : ''),
        );

        await ctx.replyWithHTML(
          `\u{1F4AC} <b>Опиши проблему подробнее</b>\n\nНапиши следующим сообщением — менеджер получит его.\n\n<i>/cancel — отменить обращение</i>`,
        );
      }
    });
  });

  /* ── /cancel ────────────────────────────────────────── */
  bot.command('cancel', async (ctx) => {
    const from = ctx.from!;
    if (awaitingReply.has(from.id)) {
      awaitingReply.delete(from.id);
      await ctx.replyWithHTML(
        '✅ <b>Обращение отменено</b>',
        backMenu(),
      );
    } else {
      await ctx.replyWithHTML('Нет активных обращений.', backMenu());
    }
  });

  /* ── Free-text handler — forward to admin ───────────── */
  bot.on('text', async (ctx, next) => {
    const from = ctx.from!;
    const category = awaitingReply.get(from.id);

    if (!category) {
      return next(); // not in support mode
    }

    const text = ctx.message.text;
    if (text.startsWith('/')) {
      return next(); // let commands pass through
    }

    const userName = ctx.tgUser?.userName ?? from.first_name;
    const adminId  = config.admin.chatId;

    /* Forward to admin */
    if (adminId) {
      try {
        await ctx.telegram.sendMessage(
          adminId,
          `\u{1F4E9} <b>Новое сообщение от пользователя</b>\n─────────────────────\n` +
          `\u{1F464} <b>${userName}</b>` +
          (from.username ? ` (@${from.username})` : '') +
          `\n\u{1F4CB} Категория: <b>${category}</b>\n` +
          `\u{1F194} ID: <code>${from.id}</code>\n\n` +
          `\u{1F4AC} <b>Сообщение:</b>\n${text}\n\n` +
          `─────────────────────\n` +
          `<i>Ответить пользователю: /reply_${from.id} [текст]</i>`,
          { parse_mode: 'HTML' },
        );
        awaitingReply.delete(from.id);
        await ctx.replyWithHTML(
          `\u{2705} <b>Сообщение отправлено менеджеру!</b>\n\nОтвет придёт в этот чат в течение 5 минут.`,
          backMenu(),
        );
      } catch {
        await ctx.replyWithHTML(
          '⚠️ Не удалось отправить менеджеру. Напиши напрямую: @arcaneuz_support',
          backMenu(),
        );
      }
    } else {
      /* No admin configured — show direct link */
      awaitingReply.delete(from.id);
      await ctx.replyWithHTML(
        `\u{1F4E8} Твоё сообщение получено!\n\nМенеджер: <a href="https://t.me/arcaneuz_support">@arcaneuz_support</a>`,
        backMenu(),
      );
    }
  });

  /* ── Admin reply command: /reply_USERID text ────────── */
  bot.hears(/^\/reply_(\d+)\s(.+)$/s, async (ctx) => {
    const from = ctx.from!;
    if (!config.admin.chatId || from.id !== config.admin.chatId) return;

    const match = ctx.match;
    const targetId = parseInt(match[1], 10);
    const replyText = match[2];

    try {
      await ctx.telegram.sendMessage(
        targetId,
        `\u{1F9D1}\u{200D}\u{1F4BB} <b>Ответ менеджера</b>\n─────────────────────\n\n${replyText}\n\n─────────────────────\n<i>ARCANE.UZ Support</i>`,
        { parse_mode: 'HTML' },
      );
      await ctx.reply(`✅ Ответ отправлен пользователю ${targetId}`);
    } catch {
      await ctx.reply(`❌ Не удалось отправить пользователю ${targetId}`);
    }
  });
}
