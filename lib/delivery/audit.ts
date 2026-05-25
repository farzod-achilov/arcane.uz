import { prisma } from '@/lib/prisma';

export type AuditAction =
  | 'ORDER_PAID'
  | 'AUTO_DELIVERY_START'
  | 'AUTO_KEY_ISSUED'
  | 'AUTO_KEY_WAITING_STOCK'
  | 'AUTO_DELIVERY_COMPLETE'
  | 'MANUAL_QUEUED'
  | 'MANUAL_ADMIN_NOTIFIED'
  | 'MANUAL_COMPLETE'
  | 'ORDER_CANCELLED';

export async function auditLog(
  orderId: string,
  action: AuditAction,
  actor = 'system',
  note?: string,
  payload?: Record<string, unknown>,
) {
  try {
    await prisma.delivery_logs.create({
      data: { orderId, action, actor, note, payload: payload as never },
    });
  } catch {
    // audit failure must never break the main flow
  }
}

export async function getOrderAudit(orderId: string) {
  return prisma.delivery_logs.findMany({
    where:   { orderId },
    orderBy: { createdAt: 'asc' },
    select:  { id: true, action: true, actor: true, note: true, payload: true, createdAt: true },
  });
}
