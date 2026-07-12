import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/apiGuard';
import { processDelivery, DeliveryError } from '@/lib/delivery';

/* ─────────────────────────────────────────────────────────
   POST /api/admin/orders/auto-retry-dropship

   Scans WAITING_MANUAL orders stuck purely on a DROPSHIP purchase
   failure (cold catalog cache, transient network error, temporary
   InsufficientBalance) and re-runs processDelivery() for each —
   the same thing the admin's manual "Повторить закупку" button does,
   on a schedule instead. dropshipDeliver()'s re-entrancy guard makes
   this safe to call repeatedly (already-delivered items are skipped,
   never re-purchased).

   Deliberately excludes:
   - Orders with any MANUAL item — those are WAITING_MANUAL because a
     human has to deliver them regardless, not because of a supplier
     failure. Retrying would just re-fire queueManual()'s admin
     Telegram notification every cycle for no reason.
   - Orders older than MAX_AGE_HOURS — an order stuck this long has a
     persistent cause (e.g. region lock, product delisted) that won't
     resolve itself; repeatedly hammering the supplier API for it is
     wasted calls. Left for a human via the low-balance alert / manual
     retry button instead.
───────────────────────────────────────────────────────── */

export const dynamic = 'force-dynamic';

const MAX_AGE_HOURS = 48;
const MAX_ORDERS_PER_RUN = 25;

export async function POST(request: Request) {
  const secret   = request.headers.get('x-sync-secret');
  const expected = process.env.SYNC_SECRET;
  const secretOk = expected && secret === expected;
  if (!secretOk) {
    const guard = await requireAdmin();
    if (guard) return guard;
  }

  const cutoff = new Date(Date.now() - MAX_AGE_HOURS * 60 * 60 * 1000);

  const candidates = await prisma.orders.findMany({
    where: {
      status:    'WAITING_MANUAL',
      createdAt: { gte: cutoff },
      items: {
        some: { game: { deliveryType: 'DROPSHIP' }, keyValue: null },
        none: { game: { deliveryType: 'MANUAL' } },
      },
    },
    select: { id: true },
    orderBy: { createdAt: 'asc' },
    take: MAX_ORDERS_PER_RUN,
  });

  let completed = 0;
  let stillWaiting = 0;
  let errored = 0;

  for (const order of candidates) {
    try {
      const result = await processDelivery(order.id);
      if ('waiting' in result && result.waiting === 0) completed++;
      else stillWaiting++;
    } catch (err) {
      // ALREADY_COMPLETED/ORDER_CANCELLED just means the order moved on
      // between the query above and this call — not a real error.
      if (!(err instanceof DeliveryError)) {
        errored++;
        console.error('[auto-retry-dropship]', order.id, err);
      }
    }
  }

  return NextResponse.json({
    ok: true,
    candidates: candidates.length,
    completed,
    stillWaiting,
    errored,
  });
}
