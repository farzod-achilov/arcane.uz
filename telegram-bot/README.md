# 🎮 ARCANE.UZ — Telegram Bot

Premium gaming companion bot for the ARCANE.UZ platform.

## Quick Start

```bash
cd telegram-bot
npm install
cp .env.example .env
# Fill in BOT_TOKEN from @BotFather
npm run dev
```

## Architecture

```
telegram-bot/
├── src/
│   ├── bot.ts                  # Entry: Telegraf + Express API
│   ├── config/index.ts         # Env config
│   ├── types/index.ts          # Shared TypeScript types
│   ├── services/
│   │   ├── db.ts               # In-memory store (→ PostgreSQL)
│   │   ├── notificationService.ts
│   │   ├── verificationService.ts
│   │   └── rewardsService.ts
│   ├── middleware/
│   │   ├── auth.ts             # Attach linked user to ctx
│   │   └── rateLimit.ts
│   ├── commands/               # One file per command
│   ├── templates/messages.ts   # All message HTML templates
│   └── utils/keyboard.ts       # Inline keyboard builders
```

## Bot Commands

| Command     | Description                      |
|-------------|----------------------------------|
| /start      | Welcome + account link           |
| /profile    | User stats (level, coins, orders)|
| /orders     | Recent order history             |
| /coins      | Arcane Coins balance             |
| /wishlist   | Wishlist with prices             |
| /rewards    | Daily reward claim               |
| /referral   | Referral link + stats            |
| /support    | Support ticket system            |
| /settings   | Notification preferences         |

## Internal API (port 3001)

Used by the Next.js website to trigger bot actions:

| Endpoint               | Method | Body                              |
|------------------------|--------|-----------------------------------|
| `/api/request-token`   | POST   | `{ userId, userName }`            |
| `/api/notify`          | POST   | `{ userId, event, data }`         |
| `/health`              | GET    | —                                 |

All `/api/*` routes require header: `x-api-secret: <API_SECRET>`

## Account Linking Flow

```
1. User → Settings page on website
2. Website → POST /api/request-token → { token, link }
3. Website → Shows link button:  t.me/arcaneuz_bot?start=verify_TOKEN
4. User → Clicks link in Telegram
5. Bot → Validates token → POST arcane.uz/api/telegram/confirm
6. Bot → Saves TelegramUser in DB
7. Bot → Sends success message to user
```

## Notification Events

```ts
'ORDER_CONFIRMED'      // New order placed
'ORDER_DELIVERED'      // Key sent to email
'COINS_EARNED'         // Cashback or bonus
'LEVEL_UP'             // Account level changed
'WISHLIST_PRICE_DROP'  // Wishlisted game on sale
'PAYMENT_FAILED'       // Payment error
```

## Production Deployment

1. Set `WEBHOOK_DOMAIN=https://your-domain.com` in `.env`
2. The bot automatically switches to webhook mode
3. Replace `db.ts` Maps with PostgreSQL queries
4. Use Redis for rate limiting

## Database Migration (PostgreSQL)

```sql
CREATE TABLE telegram_users (
  telegram_id       BIGINT PRIMARY KEY,
  telegram_username VARCHAR(64),
  first_name        VARCHAR(128),
  user_id           VARCHAR(64) UNIQUE NOT NULL,
  user_name         VARCHAR(128),
  linked_at         TIMESTAMPTZ DEFAULT now(),
  reward_streak     INT DEFAULT 0,
  last_reward_claim TIMESTAMPTZ,
  referral_code     VARCHAR(32) UNIQUE,
  referred_by       VARCHAR(32),
  total_referrals   INT DEFAULT 0,
  total_coins_earned INT DEFAULT 0,
  prefs_orders      BOOL DEFAULT true,
  prefs_coins       BOOL DEFAULT true,
  prefs_wishlist    BOOL DEFAULT true,
  prefs_deals       BOOL DEFAULT true,
  prefs_rewards     BOOL DEFAULT true
);

CREATE TABLE pending_tokens (
  token      VARCHAR(64) PRIMARY KEY,
  user_id    VARCHAR(64) NOT NULL,
  user_name  VARCHAR(128),
  expires_at TIMESTAMPTZ NOT NULL
);
```
