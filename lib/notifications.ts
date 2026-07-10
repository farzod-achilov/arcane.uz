import { prisma } from '@/lib/prisma';

export type NotifType =
  | 'order' | 'coins' | 'wishlist' | 'event' | 'level' | 'system' | 'preorder' | 'review';

export async function createNotification(
  userId: string,
  data: { type: NotifType; title: string; body: string; href?: string },
): Promise<void> {
  try {
    await prisma.notifications.create({ data: { userId, ...data } });
  } catch { /* non-fatal */ }
}
