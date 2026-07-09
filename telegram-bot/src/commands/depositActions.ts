/**
 * Inline-кнопки ✅/❌ под уведомлениями о P2P-депозитах в админском чате.
 * Само уведомление шлёт сайт (lib/adminTelegram.ts); нажатия ловим здесь
 * и применяем через внутренний API сайта — вся бизнес-логика (баланс,
 * защита от двойного зачисления) остаётся на стороне сайта.
 */

import type { Telegraf } from 'telegraf';
import type { ArcaneContext } from '../types/index';
import { config } from '../config/index';

const fmt = (n: number) => new Intl.NumberFormat('uz-UZ').format(n) + ' сум';

interface AdminActionResponse {
  ok?:       boolean;
  credit?:   number;
  username?: string;
  error?:    string;
  status?:   string;
}

export function registerDepositActions(bot: Telegraf<ArcaneContext>): void {
  bot.action(/^dep:(approve|reject):(.+)$/, async (ctx) => {
    // кнопки действуют только в админском чате
    if (!config.admin.chatId || ctx.chat?.id !== config.admin.chatId) {
      await ctx.answerCbQuery('Недоступно');
      return;
    }

    const match     = (ctx as unknown as { match: RegExpExecArray }).match;
    const action    = match[1] as 'approve' | 'reject';
    const depositId = match[2];
    const actor     = ctx.from?.username ? `@${ctx.from.username}` : String(ctx.from?.id ?? '');

    try {
      const res = await fetch(`${config.website.url}/api/deposit/admin-action`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-secret': config.website.secret },
        body:    JSON.stringify({ depositId, action, actor }),
      });
      const data = (await res.json().catch(() => ({}))) as AdminActionResponse;

      if (res.ok && data.ok) {
        await ctx.answerCbQuery(action === 'approve' ? 'Зачислено ✅' : 'Отклонено ❌');
        await ctx.editMessageReplyMarkup(undefined);
        await ctx.reply(
          action === 'approve'
            ? `✅ Зачислено ${fmt(data.credit ?? 0)} пользователю ${data.username ?? '—'} · ${actor}`
            : `❌ Заявка отклонена · ${actor}`,
        );
      } else if (res.status === 409) {
        // депозит уже обработан (например, автозачисление успело раньше)
        await ctx.answerCbQuery(`Уже обработано (${data.status ?? '—'})`, { show_alert: true });
        await ctx.editMessageReplyMarkup(undefined);
      } else {
        await ctx.answerCbQuery(`Ошибка: ${data.error ?? res.status}`, { show_alert: true });
      }
    } catch (err) {
      console.error('[DepositActions] website call failed:', err);
      await ctx.answerCbQuery('Сайт недоступен, попробуйте позже', { show_alert: true });
    }
  });
}
