import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/apiGuard';
import { PriceEngineService } from '@/lib/smartPricing/engine';
import { getPriceSettings, getCurrencySettings, upsertGamePricing } from '@/lib/smartPricing/repository';
import type { PricingStrategy } from '@/lib/smartPricing/types';

/* ─────────────────────────────────────────────────────────
   POST /api/admin/dropship/create

   Adds a new dropship-fulfilled game in one step: takes the
   Kinguin product the admin picked (supplier cost) and, optionally,
   the matching Steam listing (for youSave display), runs both
   through the Smart Pricing engine, and creates the games +
   game_pricing rows. deliveryType=DROPSHIP, dropshipSource='kinguin' —
   no stock is pre-loaded, the key is bought from Kinguin at order
   time (see lib/delivery/dropshipDeliver.ts).
───────────────────────────────────────────────────────── */

export const dynamic = 'force-dynamic';

function buildSlug(title: string, fallbackId: string | number): string {
  const base = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return base || `game-${fallbackId}`;
}

interface Body {
  title:          string;
  kinguinId:      number;
  costUsd:        number;      // Kinguin supplier price at pick time
  cover?:         string | null;
  genres?:        string[];
  platforms?:     string[];
  steamAppId?:    number | null;
  steamPriceUsd?: number | null;
  strategy?:      PricingStrategy;
}

export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const body = await req.json() as Body;
  const title     = body.title?.trim();
  const kinguinId = body.kinguinId;
  const costUsd   = Number(body.costUsd);

  if (!title || !kinguinId || !costUsd || costUsd <= 0) {
    return NextResponse.json({ ok: false, error: 'title, kinguinId и costUsd обязательны' }, { status: 400 });
  }

  const existing = await prisma.games.findFirst({
    where:  { dropshipSource: 'kinguin', dropshipExternalId: String(kinguinId) },
    select: { id: true, title: true, slug: true },
  });
  if (existing) {
    return NextResponse.json({ ok: false, error: 'Эта игра Kinguin уже добавлена', existing }, { status: 409 });
  }

  const strategy = body.strategy ?? 'GLOBAL';
  const [settings, currency] = await Promise.all([getPriceSettings(), getCurrencySettings()]);
  const engine = new PriceEngineService(settings, currency);

  const result = engine.calculateFinalGamePrice({
    gameId:                'new',
    supplierPriceUsd:      costUsd,
    steamPriceUsd:         body.steamPriceUsd ?? null,
    steamDiscountPriceUsd: null,
    pricingStrategy:       strategy,
    customPricingEnabled:  false,
    customMarkupType:      null,
    customMarkupValue:     null,
    customFinalPrice:      null,
  });

  const priceUzs = Math.round(result.finalPriceUzs);
  const id       = crypto.randomUUID();
  let   slug     = buildSlug(title, kinguinId);
  if (await prisma.games.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${slug}-${kinguinId}`;
  }

  await prisma.games.create({
    data: {
      id,
      source:             'manual',
      title,
      slug,
      cover:              body.cover ?? null,
      genres:             body.genres ?? [],
      platforms:          body.platforms?.length ? body.platforms : ['PC'],
      priceUsd:           result.finalPriceUsd,
      priceUzs,
      deliveryType:       'DROPSHIP',
      dropshipSource:     'kinguin',
      dropshipExternalId: String(kinguinId),
      productType:        'KEY',
      isActive:           true,
      stockStore:         0,
      stockDrop:          0,
      updatedAt:          new Date(),
    },
  });

  await upsertGamePricing(
    id,
    {
      supplierPriceUsd: costUsd,
      steamPriceUsd:    body.steamPriceUsd ?? null,
      finalPriceUsd:    result.finalPriceUsd,
      finalPriceUzs:    priceUzs,
      youSaveAmount:    result.youSaveAmount,
      youSavePercent:   result.youSavePercent,
      marginPercent:    result.marginPercent,
      pricingStrategy:  strategy,
    },
    {
      event:           'dropship_create',
      previousUsd:     0,
      newUsd:          result.finalPriceUsd,
      previousUzs:     0,
      newUzs:          priceUzs,
      appliedStrategy: strategy,
      appliedRules:    result.appliedRules,
    },
  );

  return NextResponse.json({
    ok: true,
    game: { id, title, slug, priceUsd: result.finalPriceUsd, priceUzs, marginPercent: result.marginPercent },
  });
}
