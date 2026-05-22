import { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { config } from '../config';
import { logger } from '../lib/logger';
import { verifyAccessToken } from '../utils/jwt';
import { liveService } from '../modules/live-drops/live.service';
import { attachSocket as attachDropSocket } from '../modules/drops/drops.service';
import { attachSocket as attachJackpotSocket } from '../modules/jackpot/jackpot.service';

export function createSocketServer(httpServer: HttpServer): SocketServer {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: config.cors.origin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // ── JWT Auth middleware ─────────────────────────────────────────────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) {
      // Allow anonymous connections for live feed
      socket.data.userId = null;
      return next();
    }
    try {
      socket.data.user = verifyAccessToken(token);
      socket.data.userId = socket.data.user.userId;
    } catch {
      // Token invalid — treat as anonymous
      socket.data.userId = null;
    }
    next();
  });

  io.on('connection', async (socket) => {
    const userId: string | null = socket.data.userId;
    logger.debug(`Socket connected: ${socket.id} (user: ${userId ?? 'anon'})`);

    // Track online count
    if (userId) {
      const count = await liveService.trackUserOnline(userId);
      io.emit('player_online', { count });
    }

    // Send initial state on connect
    try {
      const { prisma } = await import('../lib/prisma');
      const [recentDrops, jackpot] = await Promise.all([
        prisma.liveDrop.findMany({ orderBy: { createdAt: 'desc' }, take: 10 }),
        prisma.jackpot.findFirst(),
      ]);
      socket.emit('init', {
        recentDrops,
        jackpot: jackpot?.total ?? 0,
        online: await liveService.getOnlineCount(),
      });
    } catch {
      // Non-fatal — client will refetch via REST
    }

    socket.on('disconnect', async () => {
      logger.debug(`Socket disconnected: ${socket.id}`);
      if (userId) {
        const count = await liveService.trackUserOffline(userId);
        io.emit('player_online', { count });
      }
    });
  });

  // Attach io instance to services that need to broadcast
  attachDropSocket(io);
  attachJackpotSocket(io);

  logger.info('Socket.io server initialized');
  return io;
}
