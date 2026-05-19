import type { Next } from 'telegraf';
import type { ArcaneContext } from '../types/index';

/** Simple in-process rate limiter — replace with Redis in production. */
const counts = new Map<number, { count: number; resetAt: number }>();

const WINDOW_MS   = 60_000; // 1 minute
const MAX_MSGS    = 20;     // max messages per window

export async function rateLimitMiddleware(ctx: ArcaneContext, next: Next): Promise<void> {
  const userId = ctx.from?.id;
  if (!userId) return next();

  const now = Date.now();
  const entry = counts.get(userId);

  if (!entry || now > entry.resetAt) {
    counts.set(userId, { count: 1, resetAt: now + WINDOW_MS });
    return next();
  }

  entry.count++;
  if (entry.count > MAX_MSGS) {
    await ctx.reply('⚠️ Слишком много запросов. Подожди немного.');
    return;
  }
  return next();
}
