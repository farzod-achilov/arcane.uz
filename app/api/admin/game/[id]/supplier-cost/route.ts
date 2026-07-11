import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchProductById } from '@/lib/kinguin/client';
import { cheapestInStockOffer } from '@/lib/kinguin/productMapper';
import { isKinguinEnabled } from '@/lib/kinguin';
import { requireAdmin } from '@/lib/apiGuard';

/* ─────────────────────────────────────────────────────────
   GET /api/admin/game/[id]/supplier-cost

   Точная закупочная цена dropship-игры прямо из связанного
   товара Kinguin (по dropshipExternalId) через мерчант-API.
   В отличие от /api/admin/market-prices (fuzzy-поиск по названию
   через отдельный search-tier KINGUIN_API_KEY, который часто не
   задан → «No results»), здесь мы знаем точный товар и берём цену
   самого дешёвого доступного оффера — того же, что купится при
   заказе. Заполняет поле Supplier Price в модалке ценообразования.
───────────────────────────────────────────────────────── */

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const game = await prisma.games.findUnique({
    where:  { id: params.id },
    select: { dropshipSource: true, dropshipExternalId: true },
  });
  if (!game) return NextResponse.json({ ok: false, error: 'Game not found' }, { status: 404 });

  if (game.dropshipSource !== 'kinguin' || !game.dropshipExternalId) {
    return NextResponse.json({ ok: false, error: 'Не dropship-игра Kinguin' });
  }
  if (!isKinguinEnabled()) {
    return NextResponse.json({ ok: false, error: 'Kinguin не настроен (KINGUIN_MERCHANT_API_KEY)' });
  }

  try {
    const product = await fetchProductById(Number(game.dropshipExternalId));
    const offer   = cheapestInStockOffer(product);
    const costUsd = offer?.price ?? product.price;
    if (!costUsd || costUsd <= 0) {
      return NextResponse.json({ ok: false, error: 'У товара нет доступных офферов' });
    }
    return NextResponse.json({
      ok:       true,
      source:   'kinguin',
      costUsd,
      inStock:  Boolean(offer),
      name:     product.name,
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : 'fetch failed' });
  }
}
