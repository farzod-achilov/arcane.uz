import 'dotenv/config';
import http from 'http';
import { createApp } from './app';
import { createSocketServer } from './socketServer';
import { scheduler } from '../jobs/scheduler';
import { logger } from '../lib/logger';
import { redis } from '../lib/redis';
import { prisma } from '../lib/prisma';
import { config } from '../config';
import { cacheHotGames } from '../modules/games/games.import';

async function bootstrap() {
  // ── Verify connections ────────────────────────────────────────────────────
  await prisma.$connect();
  logger.info('PostgreSQL connected via Prisma');

  await redis.ping();
  logger.info('Redis ping OK');

  // ── HTTP + WebSocket ──────────────────────────────────────────────────────
  const app = createApp();
  const httpServer = http.createServer(app);
  createSocketServer(httpServer);

  // ── Cron jobs ─────────────────────────────────────────────────────────────
  scheduler.start();

  // ── Warm cache on startup ─────────────────────────────────────────────────
  cacheHotGames().catch(() => null);

  // ── Listen ────────────────────────────────────────────────────────────────
  httpServer.listen(config.port, () => {
    logger.info(`ARCANE API running on port ${config.port} [${config.env}]`);
  });

  // ── Graceful shutdown ─────────────────────────────────────────────────────
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal} — shutting down gracefully`);
    scheduler.stop();
    await prisma.$disconnect();
    redis.disconnect();
    httpServer.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  console.error('Fatal bootstrap error:', err);
  process.exit(1);
});
