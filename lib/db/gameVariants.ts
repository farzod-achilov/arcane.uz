import type { Prisma } from '@prisma/client';

/* ─────────────────────────────────────────────────────────
   Keeps games.priceUzs (and, on the first variant, deliveryType) in sync
   with its game_variants rows. Called inside the SAME transaction as
   whatever create/update/toggle just touched a variant, so there's no
   window for a stale read.

   games.priceUzs becomes "starting from" price once a game has ≥1 active
   variant — this is why lib/db/games.ts's catalog filter/sort-by-price
   needs zero changes: it keeps reading games.priceUzs exactly as before.

   Forcing deliveryType='DROPSHIP' on the base row the first time a variant
   is added is required so arcane-api's autoDisableEmptyGamesJob/
   lowStockScanJob (which already exclude DROPSHIP games from "0 stock ⇒
   inactive" logic) keep working with zero changes on that side — v1
   variants are DROPSHIP-only, so this is always correct for now.

   games.dropshipSource/dropshipExternalId are ALSO synced to the cheapest
   active variant's own SKU (not just its price). Some code paths still
   resolve delivery straight from the game row instead of a variant — the
   legacy /product/[id] related-games carousel's quick-add, or any old
   /checkout?gameId= deep link with no ?variantId= — and those must never
   charge a price that doesn't match a deliverable SKU. Keeping both fields
   pinned to the same (cheapest) variant keeps that fallback self-consistent
   instead of silently drifting from whatever SKU the game was first created with.

   Callers MUST guard the 4 existing repricing routes (dropship-reprice,
   steam-sync, bulk-pricing, game/[id]/pricing) against writing
   games.priceUzs directly for a game that has active variants — otherwise
   those crons undo this sync every time they run. See the plan doc.
───────────────────────────────────────────────────────── */

type Tx = Prisma.TransactionClient;

export async function syncGameFromVariants(tx: Tx, gameId: string): Promise<void> {
  const cheapest = await tx.game_variants.findFirst({
    where:   { gameId, isActive: true },
    orderBy: { priceUzs: 'asc' },
    select:  { priceUzs: true, dropshipSource: true, dropshipExternalId: true },
  });

  if (!cheapest) return; // no active variants — leave the game row untouched

  await tx.games.update({
    where: { id: gameId },
    data:  {
      priceUzs:           cheapest.priceUzs,
      deliveryType:       'DROPSHIP',
      dropshipSource:     cheapest.dropshipSource,
      dropshipExternalId: cheapest.dropshipExternalId,
    },
  });
}

/** True if this game currently has at least one active purchase variant. */
export async function hasActiveVariants(tx: Tx, gameId: string): Promise<boolean> {
  const count = await tx.game_variants.count({ where: { gameId, isActive: true } });
  return count > 0;
}
