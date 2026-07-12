import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminOrSyncSecret } from '@/lib/apiGuard';
import { PriceEngineService } from '@/lib/smartPricing/engine';
import { getPriceSettings, getCurrencySettings } from '@/lib/smartPricing/repository';
import { syncGameFromVariants } from '@/lib/db/gameVariants';
import { inferProductType } from '@/lib/kinguin/basePicker';
import type { PricingStrategy } from '@/lib/smartPricing/types';

/* ─────────────────────────────────────────────────────────
   POST /api/admin/dropship/create-variant

   Attaches an additional purchase variant (e.g. "Аккаунт" alongside an
   existing "Ключ") to an ALREADY-EXISTING game, instead of creating a new
   games row like /api/admin/dropship/create does. Display metadata
   (title/cover/screenshots/genres) is inherited from the parent game — no
   RAWG step here, a variant only differs in price/dropship SKU/label.

   Deliberately does NOT call upsertGamePricing() — game_pricing.gameId is
   unique (one row per game), so a second variant would overwrite the
   first's persisted supplier-cost/margin audit trail. Pricing is computed
   as a pure function here; per-variant margin history is a deferred v2.
───────────────────────────────────────────────────────── */

export const dynamic = 'force-dynamic';

interface Body {
  gameId:     string;
  label:      string;
  kinguinId:  number;
  costUsd:    number;
  // Kinguin's raw SKU name (e.g. "... Steam Account") — used only to infer
  // productType, same signal lib/kinguin/basePicker.ts's picker already
  // reads to steer offer selection. Not shown to customers.
  title?:     string;
  strategy?:  PricingStrategy;
}

export async function POST(req: Request) {
  const guard = await requireAdminOrSyncSecret(req);
  if (guard) return guard;

  const body = await req.json() as Body;
  const { gameId, kinguinId, costUsd } = body;
  const label = body.label?.trim();

  if (!gameId || !label || !kinguinId || !costUsd || costUsd <= 0) {
    return NextResponse.json({ ok: false, error: 'gameId, label, kinguinId и costUsd обязательны' }, { status: 400 });
  }

  const game = await prisma.games.findUnique({ where: { id: gameId }, select: { id: true, title: true } });
  if (!game) {
    return NextResponse.json({ ok: false, error: 'Игра не найдена' }, { status: 404 });
  }

  const existing = await prisma.game_variants.findFirst({
    where:  { dropshipSource: 'kinguin', dropshipExternalId: String(kinguinId) },
    select: { id: true, label: true, gameId: true },
  });
  if (existing) {
    return NextResponse.json({ ok: false, error: `Этот SKU Kinguin уже используется как вариант «${existing.label}»`, existing }, { status: 409 });
  }
  // Also guard against the game's OWN base dropshipExternalId (set at
  // creation, before any variant existed) — same SKU shouldn't be sellable
  // twice under two different labels on the same game.
  const baseClash = await prisma.games.findFirst({
    where:  { id: gameId, dropshipSource: 'kinguin', dropshipExternalId: String(kinguinId) },
    select: { id: true },
  });
  if (baseClash) {
    return NextResponse.json({ ok: false, error: 'Этот SKU Kinguin уже привязан к этой игре как базовый вариант' }, { status: 409 });
  }

  const strategy = body.strategy ?? 'GLOBAL';
  const [settings, currency] = await Promise.all([getPriceSettings(), getCurrencySettings()]);
  const engine = new PriceEngineService(settings, currency);

  const result = engine.calculateFinalGamePrice({
    gameId:                'variant',
    supplierPriceUsd:      costUsd,
    steamPriceUsd:         null,
    steamDiscountPriceUsd: null,
    pricingStrategy:       strategy,
    customPricingEnabled:  false,
    customMarkupType:      null,
    customMarkupValue:     null,
    customFinalPrice:      null,
  });

  const priceUzs = Math.round(result.finalPriceUzs);

  const variant = await prisma.$transaction(async tx => {
    const created = await tx.game_variants.create({
      data: {
        gameId,
        label,
        deliveryType:       'DROPSHIP',
        dropshipSource:     'kinguin',
        dropshipExternalId: String(kinguinId),
        productType:        inferProductType(body.title ?? ''),
        priceUsd:           result.finalPriceUsd,
        priceUzs,
        pricingStrategy:    strategy,
      },
    });
    await syncGameFromVariants(tx, gameId);
    return created;
  });

  return NextResponse.json({
    ok: true,
    variant: { id: variant.id, label: variant.label, priceUzs: variant.priceUzs, marginPercent: result.marginPercent },
    game: { id: game.id, title: game.title },
  });
}
