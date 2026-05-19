import type { Telegraf } from 'telegraf';
import type { ArcaneContext, Order } from '../types/index';
import { requireLinked } from '../middleware/auth';
import * as tpl from '../templates/messages';
import { backMenu } from '../utils/keyboard';

// Mock orders — replace with DB query in production
function getMockOrders(userId: string): Order[] {
  void userId;
  return [
    {
      id:          'ARC-45231',
      gameTitle:   'Cyberpunk 2077',
      platform:    'PC',
      price:       249000,
      status:      'completed',
      date:        '10.05.2025',
      coinsEarned: 249,
    },
    {
      id:          'ARC-42890',
      gameTitle:   'Call of Duty MW3',
      platform:    'PC',
      price:       189000,
      status:      'completed',
      date:        '25.04.2025',
      coinsEarned: 189,
    },
  ];
}

export function registerOrdersCommand(bot: Telegraf<ArcaneContext>): void {
  const handler = async (ctx: ArcaneContext) => {
    const orders = getMockOrders(ctx.tgUser!.userId);
    await ctx.replyWithHTML(tpl.tplOrders(orders), backMenu());
  };

  bot.command('orders', requireLinked, handler);
  bot.action('cmd_orders', requireLinked, async (ctx) => {
    await ctx.answerCbQuery();
    await handler(ctx);
  });
}
