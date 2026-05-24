type Next = () => Promise<void>;
import type { ArcaneContext } from '../types/index';
import { getUserByTgId } from '../services/db';

/**
 * Attaches the linked TelegramUser to ctx.tgUser if the sender
 * has a connected ARCANE.UZ account.
 * Does NOT block — each command decides whether to require linking.
 */
export async function authMiddleware(ctx: ArcaneContext, next: Next): Promise<void> {
  const tgId = ctx.from?.id;
  if (tgId) {
    const user = getUserByTgId(tgId);
    if (user) ctx.tgUser = user;
  }
  return next();
}

/**
 * Guard: replies with a linking prompt if the user is not linked.
 * Use inside command handlers that require an account.
 */
export async function requireLinked(ctx: ArcaneContext, next: Next): Promise<void> {
  if (!ctx.tgUser) {
    await ctx.replyWithHTML(
      '🔗 <b>Аккаунт не подключён</b>\n\n' +
      'Перейди на <a href="https://arcane.uz/settings">arcane.uz/settings</a> ' +
      'и привяжи свой Telegram, чтобы пользоваться этой функцией.',
    );
    return;
  }
  return next();
}
