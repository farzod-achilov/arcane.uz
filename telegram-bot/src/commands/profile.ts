import type { Telegraf } from 'telegraf';
import type { ArcaneContext } from '../types/index';
import { requireLinked } from '../middleware/auth';
import * as tpl from '../templates/messages';
import { mainMenu } from '../utils/keyboard';

// Mock order count lookup — replace with DB query in production
function mockOrderCount(userId: string): number {
  void userId;
  return 3;
}

function mockLevel(xp: number): string {
  if (xp >= 50000) return 'Arcane';
  if (xp >= 15000) return 'Phantom';
  if (xp >= 5000)  return 'Elite';
  if (xp >= 1000)  return 'Player';
  return 'Rookie';
}

export function registerProfileCommand(bot: Telegraf<ArcaneContext>): void {
  bot.command('profile', requireLinked, async (ctx) => {
    const user  = ctx.tgUser!;
    const level = mockLevel(user.totalCoinsEarned * 7); // approximate from coins
    await ctx.replyWithHTML(
      tpl.tplProfile(user, mockOrderCount(user.userId), level),
      mainMenu(),
    );
  });

  bot.action('cmd_profile', requireLinked, async (ctx) => {
    await ctx.answerCbQuery();
    const user  = ctx.tgUser!;
    const level = mockLevel(user.totalCoinsEarned * 7);
    await ctx.replyWithHTML(
      tpl.tplProfile(user, mockOrderCount(user.userId), level),
      mainMenu(),
    );
  });
}
