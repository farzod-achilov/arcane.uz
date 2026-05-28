import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new Response('Unauthorized', { status: 401 });

  const userId = session.user.id;

  const encoder = new TextEncoder();
  let lastId = '';
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      function send(data: unknown) {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {}
      }

      // Initial load — send all unread
      try {
        const notifs = await prisma.notifications.findMany({
          where:   { userId },
          orderBy: { createdAt: 'desc' },
          take:    20,
        });
        if (notifs.length > 0) lastId = notifs[0].id;
        send({ type: 'init', notifications: notifs });
      } catch {
        controller.close();
        return;
      }

      // Poll for new ones every 5s
      const interval = setInterval(async () => {
        if (closed) { clearInterval(interval); return; }
        try {
          const where = lastId
            ? { userId, id: { gt: lastId } }
            : { userId };
          const newNotifs = await prisma.notifications.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take:    10,
          });
          if (newNotifs.length > 0) {
            lastId = newNotifs[0].id;
            send({ type: 'new', notifications: newNotifs });
          }
          // Heartbeat to keep connection alive
          controller.enqueue(encoder.encode(': ping\n\n'));
        } catch {
          clearInterval(interval);
          if (!closed) controller.close();
          closed = true;
        }
      }, 5000);

      req.signal.addEventListener('abort', () => {
        closed = true;
        clearInterval(interval);
        try { controller.close(); } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection':    'keep-alive',
      'X-Accel-Buffering': 'no', // disable nginx buffering
    },
  });
}
