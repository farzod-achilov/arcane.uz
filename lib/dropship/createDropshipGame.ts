import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { PriceEngineService } from '@/lib/smartPricing/engine';
import { getPriceSettings, getCurrencySettings, upsertGamePricing } from '@/lib/smartPricing/repository';
import { inferProductType } from '@/lib/kinguin/basePicker';
import type { PricingStrategy } from '@/lib/smartPricing/types';

/* ─────────────────────────────────────────────────────────
   Shared core of "add one dropship-fulfilled game" — used by the
   admin's manual /api/admin/dropship/create endpoint AND the
   unattended /api/admin/dropship/auto-import job. Kept as one
   function so both callers get identical pricing/dedup/slug rules
   instead of the auto-import job re-implementing its own copy.
───────────────────────────────────────────────────────── */

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

export interface CreateDropshipGameInput {
  title:          string;
  kinguinId:      number;
  costUsd:        number;
  cover?:         string | null;
  genres?:        string[];
  platforms?:     string[];
  steamPriceUsd?: number | null;
  strategy?:      PricingStrategy;
  // Optional RAWG match — when present, display metadata (title/cover/
  // screenshots/genres/description/rating/developer) comes from RAWG
  // instead of Kinguin's own listing. Kinguin stays purely the dropship
  // fulfillment source (dropshipSource/dropshipExternalId below).
  rawgId?:          number | null;
  rawgTitle?:       string | null;
  rawgCover?:       string | null;
  rawgScreenshots?: string[];
  rawgGenres?:      string[];
  rawgPlatforms?:   string[];
  rawgRating?:      number | null;
  rawgDeveloper?:   string | null;
  rawgPublisher?:   string | null;
  rawgReleaseDate?: string | null;
  rawgDescription?: string | null;
}

export type CreateDropshipGameResult =
  | { ok: true; status: 200; game: { id: string; title: string; slug: string; priceUsd: number; priceUzs: number; marginPercent: number } }
  | { ok: false; status: 400 | 409; error: string; existing?: { id: string; title: string; slug: string } };

export async function createDropshipGame(input: CreateDropshipGameInput): Promise<CreateDropshipGameResult> {
  const kinguinId = input.kinguinId;
  const costUsd   = Number(input.costUsd);

  // Prefer RAWG for everything shown to customers (title/cover/screenshots/
  // genres/developer) — Kinguin's own listing name/image is a supplier SKU
  // label ("Grand Theft Auto V PC Rockstar Digital Download CD Key"), not
  // storefront copy. Falls back to the raw Kinguin fields only if no RAWG
  // match was picked.
  const hasRawg = input.rawgId != null;
  const title   = (hasRawg ? input.rawgTitle : input.title)?.trim();
  const cover   = hasRawg ? (input.rawgCover ?? null) : (input.cover ?? null);
  const screenshots = hasRawg ? (input.rawgScreenshots ?? []) : [];
  const genres  = hasRawg ? (input.rawgGenres ?? []) : (input.genres ?? []);
  // Platforms always come from Kinguin's own listing (what the key actually
  // delivers on — Steam/EA/Ubisoft/etc, mapped to 'PC' by the picker), never
  // from RAWG's cross-platform metadata.
  const platforms = input.platforms?.length ? input.platforms : ['PC'];

  if (!title || !kinguinId || !costUsd || costUsd <= 0) {
    return { ok: false, status: 400, error: 'title, kinguinId и costUsd обязательны' };
  }

  const existing = await prisma.games.findFirst({
    where:  { dropshipSource: 'kinguin', dropshipExternalId: String(kinguinId) },
    select: { id: true, title: true, slug: true },
  });
  if (existing) {
    return { ok: false, status: 409, error: 'Эта игра Kinguin уже добавлена', existing };
  }

  const strategy = input.strategy ?? 'GLOBAL';
  const [settings, currency] = await Promise.all([getPriceSettings(), getCurrencySettings()]);
  const engine = new PriceEngineService(settings, currency);

  const result = engine.calculateFinalGamePrice({
    gameId:                'new',
    supplierPriceUsd:      costUsd,
    steamPriceUsd:         input.steamPriceUsd ?? null,
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
      source:             hasRawg ? 'rawg' : 'manual',
      externalId:         hasRawg ? String(input.rawgId) : null,
      title,
      slug,
      cover,
      screenshots,
      description:        hasRawg ? (input.rawgDescription ?? null) : null,
      genres,
      platforms,
      developer:          hasRawg ? (input.rawgDeveloper ?? null) : null,
      publisher:          hasRawg ? (input.rawgPublisher ?? null) : null,
      rating:             hasRawg ? (input.rawgRating ?? null) : null,
      releaseDate:        hasRawg && input.rawgReleaseDate ? new Date(input.rawgReleaseDate) : null,
      priceUsd:           result.finalPriceUsd,
      priceUzs,
      deliveryType:       'DROPSHIP',
      dropshipSource:     'kinguin',
      dropshipExternalId: String(kinguinId),
      // input.title is always Kinguin's raw SKU name (see hasRawg branch
      // above) — needed here even when the display title comes from RAWG,
      // since RAWG's title never carries the "Account"/"Gift" signal.
      productType:        inferProductType(input.title ?? ''),
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
      steamPriceUsd:    input.steamPriceUsd ?? null,
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

  return {
    ok: true,
    status: 200,
    game: { id, title, slug, priceUsd: result.finalPriceUsd, priceUzs, marginPercent: result.marginPercent },
  };
}
