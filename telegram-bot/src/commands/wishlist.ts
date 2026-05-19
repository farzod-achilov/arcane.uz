import type { Telegraf } from 'telegraf';
import type { ArcaneContext } from '../types/index';
import { requireLinked } from '../middleware/auth';
import * as tpl from '../templates/messages';
import { backMenu } from '../utils/keyboard';

// Mock wishlist — replace with DB/website API call in production
function getMockWishlist(userId: string) {
  void userId;
  return [
    { title: 'Elden Ring',   price: 299000, discount: undefined },
    { title: 'GTA V',        price: 89000,  discount: 30 },
    { title: 'Baldur\'s Gate 3', price: 249000, discount: undefined },
  ];
}

export function registerWishlistCommand(bot: Telegraf<ArcaneContext>): void {
  const handler = async (ctx: ArcaneContext) => {
    const items = getMockWishlist(ctx.tgUser!.userId);
    await ctx.replyWithHTML(tpl.tplWishlist(items), backMenu());
  };

  bot.command('wishlist', requireLinked, handler);
  bot.action('cmd_wishlist', requireLinked, async (ctx) => {
    await ctx.answerCbQuery();
    await handler(ctx);
  });
}
