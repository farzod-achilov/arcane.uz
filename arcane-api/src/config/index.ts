import dotenv from 'dotenv';
dotenv.config();

function required(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env var: ${key}`);
  return value;
}

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  isDev: process.env.NODE_ENV !== 'production',

  db: {
    url: required('DATABASE_URL'),
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  jwt: {
    secret: required('JWT_SECRET'),
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshSecret: required('JWT_REFRESH_SECRET'),
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },

  games: {
    igdbClientId: process.env.IGDB_CLIENT_ID || '',
    igdbClientSecret: process.env.IGDB_CLIENT_SECRET || '',
    rawgApiKey: process.env.RAWG_API_KEY || '',
    steamApiKey: process.env.STEAM_API_KEY || '',
  },

  jackpot: {
    contributionPercent: parseInt(process.env.JACKPOT_CONTRIBUTION_PERCENT || '2', 10),
  },

  redis_ttl: {
    liveDrops: 300,
    jackpot: 60,
    hotGames: 600,
    onlineUsers: 30,
    session: 7 * 24 * 3600,
  },
} as const;
