import type { Telegraf } from 'telegraf';
import type { ArcaneContext } from '../types/index';
import { requireLinked } from '../middleware/auth';
import * as tpl from '../templates/messages';
import { backMenu } from '../utils/keyboard';

function mockLevel(coins: number): string {
  if (coins >= 500)  return 'Elite';
  if (coins >= 100)  return 'Player';
  return 'Rookie';
}

export function registerCoinsCommand(bot: Telegraf<ArcaneContext>): void {
  const handler = async (ctx: ArcaneContext) => {
    const user  = ctx.tgUser!;
    const level = mockLevel(user.totalCoinsEarned);
    await ctx.replyWithHTML(
      tpl.tplCoins(user.totalCoinsEarned, user.totalCoinsEarned, level),
      backMenu(),
    );
  };

  bot.command('coins', requireLinked, handler);
  bot.action('cmd_coins', requireLinked, async (ctx) => {
    await ctx.answerCbQuery();
    await handler(ctx);
  });
}
