import { prisma } from '@/lib/prisma';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

export type NotifType =
  | 'order' | 'coins' | 'wishlist' | 'event' | 'level' | 'system' | 'preorder';

export async function createNotification(
  userId: string,
  data: { type: NotifType; title: string; body: string; href?: string },
): Promise<void> {
  try {
    await db.notifications.create({ data: { userId, ...data } });
  } catch { /* non-fatal */ }
}
