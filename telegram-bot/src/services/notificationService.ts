import type { Telegraf } from 'telegraf';
import type { ArcaneContext, NotifPayload } from '../types/index';
import { getUserByUserId } from './db';
import { config } from '../config/index';
import * as tpl from '../templates/messages';

/**
 * Central notification dispatcher.
 * Called from the Express API endpoint when the website triggers events.
 */
export class NotificationService {
  constructor(private bot: Telegraf<ArcaneContext>) {}

  async dispatch(payload: NotifPayload): Promise<boolean> {
    const user = await getUserByUserId(payload.userId);
    if (!user) return false;

    const { event, data } = payload;

    // Respect user notification preferences
    if (event.startsWith('ORDER') && !user.prefs.orders)   return false;
    if (event.startsWith('COINS') && !user.prefs.coins)    return false;
    if (event === 'WISHLIST_PRICE_DROP' && !user.prefs.wishlist) return false;
    if (event === 'DEAL_ALERT'          && !user.prefs.deals)    return false;
    if (event === 'REWARD_AVAILABLE'    && !user.prefs.rewards)  return false;

    try {
      const html = this.buildMessage(event as NotifPayload['event'], data);
      if (!html) return false;
      await this.bot.telegram.sendMessage(user.telegramId, html, {
        parse_mode: 'HTML',
        link_preview_options: { is_disabled: true },
      });
      return true;
    } catch (err) {
      console.error(`[Notify] Failed to send to user ${payload.userId}:`, err);
      return false;
    }
  }

  private buildMessage(
    event: NotifPayload['event'],
    data: Record<string, string | number | boolean>,
  ): string | null {
    switch (event) {
      case 'ORDER_CONFIRMED':
        return tpl.tplOrderConfirmed(
          String(data.orderId), String(data.game),
          String(data.platform), Number(data.price),
        );
      case 'ORDER_DELIVERED':
        return tpl.tplOrderDelivered(
          String(data.orderId), String(data.game), String(data.email),
        );
      case 'COINS_EARNED':
        return tpl.tplCoinsEarned(Number(data.amount), String(data.reason));
      case 'LEVEL_UP':
        return tpl.tplLevelUp(String(data.level));
      case 'WISHLIST_PRICE_DROP':
        return tpl.tplPriceDrop(
          String(data.game), Number(data.oldPrice),
          Number(data.newPrice), Number(data.discount),
        );
      default:
        return null;
    }
  }

  /** Send alert to admin chat */
  async notifyAdmin(html: string): Promise<void> {
    if (!config.admin.chatId) return;
    try {
      await this.bot.telegram.sendMessage(config.admin.chatId, html, { parse_mode: 'HTML' });
    } catch (err) {
      console.error('[Admin] Failed to notify admin:', err);
    }
  }
}
