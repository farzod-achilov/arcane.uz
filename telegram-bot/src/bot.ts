/**
 * ARCANE.UZ Telegram Bot — Main entry point
 *
 * Architecture:
 *   - Telegraf handles all incoming Telegram updates
 *   - Express exposes an internal REST API for the Next.js website:
 *       POST /api/notify        → send notification to a user
 *       POST /api/request-token → generate a linking token
 *       POST /api/confirm       → mark account as linked
 *       GET  /health            → healthcheck
 */

import 'dotenv/config';
import { Telegraf } from 'telegraf';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

import { config }            from './config/index';
import type { ArcaneContext } from './types/index';

import { authMiddleware }    from './middleware/auth';
import { rateLimitMiddleware } from './middleware/rateLimit';

import { VerificationService } from './services/verificationService';
import { NotificationService } from './services/notificationService';
import { rewardsService }    from './services/rewardsService';

import { registerStartCommand }    from './commands/start';
import { registerProfileCommand }  from './commands/profile';
import { registerOrdersCommand }   from './commands/orders';
import { registerCoinsCommand }    from './commands/coins';
import { registerWishlistCommand } from './commands/wishlist';
import { registerRewardsCommand }  from './commands/rewards';
import { registerSupportCommand }  from './commands/support';
import { registerSettingsCommand } from './commands/settings';

import { referralMenu, backMenu, mainMenu } from './utils/keyboard';
import * as tpl from './templates/messages';

/* ══════════════════════════════════════════════════════
   BOT SETUP
══════════════════════════════════════════════════════ */

const bot = new Telegraf<ArcaneContext>(config.bot.token);

const verifyService = new VerificationService(bot);
const notifService  = new NotificationService(bot);

// ── Global middleware ──────────────────────────────────
bot.use(rateLimitMiddleware);
bot.use(authMiddleware);

// ── Commands ───────────────────────────────────────────
registerStartCommand(bot, verifyService);
registerProfileCommand(bot);
registerOrdersCommand(bot);
registerCoinsCommand(bot);
registerWishlistCommand(bot);
registerRewardsCommand(bot);
registerSupportCommand(bot, notifService);
registerSettingsCommand(bot);

// ── /referral command ──────────────────────────────────
bot.command('referral', async (ctx) => {
  if (!ctx.tgUser) {
    await ctx.replyWithHTML('Сначала подключи аккаунт на <a href="https://arcane.uz/settings">arcane.uz</a>');
    return;
  }
  await ctx.replyWithHTML(tpl.tplReferral(ctx.tgUser), referralMenu(ctx.tgUser.referralCode));
});

bot.action('referral_stats', async (ctx) => {
  await ctx.answerCbQuery();
  if (!ctx.tgUser) return;
  await ctx.replyWithHTML(
    `📊 <b>Реферальная статистика</b>\n\nПриглашено: <b>${ctx.tgUser.totalReferrals}</b>\nЗаработано: <b>${ctx.tgUser.totalCoinsEarned} монет</b>`,
    backMenu(),
  );
});

// ── Set bot commands in Telegram menu ─────────────────
bot.telegram.setMyCommands([
  { command: 'start',    description: '🏠 Главное меню' },
  { command: 'demo',     description: '🎮 Войти с демо-аккаунтом' },
  { command: 'profile',  description: '👤 Мой профиль' },
  { command: 'orders',   description: '📦 Мои заказы' },
  { command: 'coins',    description: '🪙 Arcane Coins' },
  { command: 'wishlist', description: '❤️ Вишлист' },
  { command: 'rewards',  description: '🎁 Ежедневные награды' },
  { command: 'referral', description: '👥 Пригласить друга' },
  { command: 'support',  description: '🆘 Поддержка' },
  { command: 'settings', description: '⚙️ Настройки' },
]);

// ── Graceful error handler ─────────────────────────────
bot.catch((err, ctx) => {
  console.error(`[Bot] Error for ${ctx.updateType}:`, err);
  ctx.reply('⚠️ Что-то пошло не так. Попробуй ещё раз.').catch(() => {});
});

/* ══════════════════════════════════════════════════════
   INTERNAL EXPRESS API (called by Next.js website)
══════════════════════════════════════════════════════ */

const app = express();

app.use(helmet());
app.use(cors({ origin: config.website.url }));
app.use(express.json({ limit: '64kb' }));

// Verify internal API secret on all /api routes
app.use('/api', (req, res, next) => {
  const secret = req.headers['x-api-secret'];
  if (secret !== config.server.apiSecret) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
});

// Rate limit for API
const apiLimiter = rateLimit({ windowMs: 60_000, max: 100 });
app.use('/api', apiLimiter);

/* ── POST /api/request-token ──────────────────────────
   Website requests a token to start the linking flow.
   Returns: { token: string, link: string }
─────────────────────────────────────────────────────── */
app.post('/api/request-token', async (req, res) => {
  const { userId, userName } = req.body as { userId?: string; userName?: string };
  if (!userId || !userName) {
    res.status(400).json({ error: 'userId and userName required' });
    return;
  }
  const token = await verifyService.createToken(userId, userName);
  res.json({
    token,
    link: `https://t.me/${config.bot.username}?start=verify_${token}`,
  });
});

/* ── POST /api/notify ─────────────────────────────────
   Website sends a notification event.
   Body: NotifPayload
─────────────────────────────────────────────────────── */
app.post('/api/notify', async (req, res) => {
  try {
    const sent = await notifService.dispatch(req.body);
    res.json({ sent });
  } catch (err) {
    console.error('[API] /api/notify error:', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

/* ── GET /health ─────────────────────────────────────── */
app.get('/health', (_, res) => {
  res.json({ status: 'ok', bot: config.bot.username, ts: Date.now() });
});

// Webhook endpoint (production)
if (config.webhook.domain && !config.isDev) {
  const path = config.webhook.path;
  app.use(bot.webhookCallback(path));
  bot.telegram.setWebhook(`${config.webhook.domain}${path}`);
  console.log(`[Bot] Webhook set: ${config.webhook.domain}${path}`);
}

/* ══════════════════════════════════════════════════════
   START
══════════════════════════════════════════════════════ */

app.listen(config.server.port, () => {
  console.log(`[API] Internal server running on port ${config.server.port}`);
});

if (config.isDev || !config.webhook.domain) {
  console.log(`[Bot] @${config.bot.username} starting polling mode...`);
  bot.launch({ dropPendingUpdates: true })
    .then(() => console.log('[Bot] Polling stopped.'))
    .catch((err: Error) => console.error('[Bot] Error:', err.message));
  // Telegraf v4: launch() resolves on stop, not on start — bot is already active above
  console.log(`[Bot] @${config.bot.username} is LIVE — send /start in Telegram`);
}

// Graceful shutdown
process.once('SIGINT',  () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
