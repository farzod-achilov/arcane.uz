import type { Telegraf } from 'telegraf';
import type { ArcaneContext } from '../types/index';
import { requireLinked } from '../middleware/auth';
import { updateUser } from '../services/db';
import { settingsMenu } from '../utils/keyboard';

const PREF_KEYS = ['orders', 'coins', 'wishlist', 'deals', 'rewards'] as const;
type PrefKey = typeof PREF_KEYS[number];

function buildSettingsText(prefs: Record<PrefKey, boolean>): string {
  return `\
⚙️ <b>НАСТРОЙКИ УВЕДОМЛЕНИЙ</b>
─────────────────────

Управляй тем, что хочешь получать:

🔔 — включено   🔕 — отключено`;
}

export function registerSettingsCommand(bot: Telegraf<ArcaneContext>): void {
  const showSettings = async (ctx: ArcaneContext) => {
    const { prefs } = ctx.tgUser!;
    await ctx.replyWithHTML(buildSettingsText(prefs), settingsMenu(prefs));
  };

  bot.command('settings', requireLinked, showSettings);
  bot.action('cmd_settings', requireLinked, async (ctx) => {
    await ctx.answerCbQuery();
    await showSettings(ctx);
  });

  // Toggle each preference
  PREF_KEYS.forEach((key) => {
    bot.action(`toggle_${key}`, requireLinked, async (ctx) => {
      await ctx.answerCbQuery();
      const user = ctx.tgUser!;
      const newPrefs = { ...user.prefs, [key]: !user.prefs[key] };
      await updateUser(user.telegramId, { prefs: newPrefs });
      ctx.tgUser = { ...user, prefs: newPrefs };

      const label = key.charAt(0).toUpperCase() + key.slice(1);
      const state = newPrefs[key] ? '🔔 включено' : '🔕 отключено';
      await ctx.answerCbQuery(`${label}: ${state}`, { show_alert: true });

      // Refresh settings message
      try {
        await ctx.editMessageReplyMarkup(settingsMenu(newPrefs).reply_markup);
      } catch { /* message unchanged */ }
    });
  });
}
