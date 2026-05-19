import dotenv from 'dotenv';
dotenv.config();

function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

export const config = {
  bot: {
    token:    required('BOT_TOKEN'),
    username: process.env.BOT_USERNAME ?? 'arcaneuz_bot',
  },
  webhook: {
    domain: process.env.WEBHOOK_DOMAIN ?? '',
    path:   process.env.WEBHOOK_PATH ?? '/webhook',
  },
  server: {
    port:      parseInt(process.env.PORT ?? '3001', 10),
    apiSecret: process.env.API_SECRET ?? 'dev-secret',
  },
  website: {
    url:    process.env.WEBSITE_URL ?? 'http://localhost:3000',
    secret: process.env.WEBSITE_API_SECRET ?? 'dev-secret',
  },
  admin: {
    chatId: process.env.ADMIN_CHAT_ID ? parseInt(process.env.ADMIN_CHAT_ID, 10) : null,
  },
  isDev: process.env.NODE_ENV !== 'production',
} as const;
