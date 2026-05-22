import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { config } from '../config';
import { globalRateLimit } from '../middlewares/rateLimit.middleware';
import { errorHandler, notFound } from '../middlewares/error.middleware';

// ── Routes ────────────────────────────────────────────────────────────────────
import authRoutes      from '../modules/auth/auth.routes';
import usersRoutes     from '../modules/users/users.routes';
import gamesRoutes     from '../modules/games/games.routes';
import dropsRoutes     from '../modules/drops/drops.routes';
import rewardsRoutes   from '../modules/rewards/rewards.routes';
import inventoryRoutes from '../modules/inventory/inventory.routes';
import jackpotRoutes   from '../modules/jackpot/jackpot.routes';
import liveRoutes      from '../modules/live-drops/live.routes';
import keysRoutes      from '../modules/keys/keys.routes';

export function createApp() {
  const app = express();

  // ── Security & parsing ──────────────────────────────────────────────────────
  app.use(helmet());
  app.use(cors({ origin: config.cors.origin, credentials: true }));
  app.use(compression());
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));

  // ── Logging ─────────────────────────────────────────────────────────────────
  app.use(config.isDev ? morgan('dev') : morgan('combined'));

  // ── Global rate limit ────────────────────────────────────────────────────────
  app.use(globalRateLimit);

  // ── Health check ─────────────────────────────────────────────────────────────
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'arcane-api', timestamp: new Date().toISOString() });
  });

  // ── API routes ───────────────────────────────────────────────────────────────
  app.use('/api/auth',      authRoutes);
  app.use('/api/users',     usersRoutes);
  app.use('/api/games',     gamesRoutes);
  app.use('/api/drops',     dropsRoutes);
  app.use('/api/rewards',   rewardsRoutes);
  app.use('/api/inventory', inventoryRoutes);
  app.use('/api/jackpot',   jackpotRoutes);
  app.use('/api/live',      liveRoutes);
  app.use('/api/keys',      keysRoutes);

  // ── 404 & error ──────────────────────────────────────────────────────────────
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
