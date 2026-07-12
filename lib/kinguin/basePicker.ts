import type { KinguinProductItem } from './types';
import { cheapestInStockOffer, isBlockedInUzbekistan } from './productMapper';

/* ─────────────────────────────────────────────────────────
   Auto-pick a clean, purchasable base-game Kinguin offer for a
   given search title — used by the bulk-add flow, where an admin
   pastes many titles and no human eyeballs each search result.

   Strict by design, no fallbacks: a first version of this logic
   (inline in a one-off script) fell back to non-Steam platforms
   when no Steam offer existed, and picked "Elden Ring - Pre-Order
   Bonus DLC Xbox Series X|S CD Key" as if it were the base PC game
   — it briefly went live on the storefront before being caught.
   Never repeat that: only Steam, only in-stock, never DLC/bonus/
   soundtrack listings. Titles with no clean match are surfaced to
   the admin as "not found" rather than guessed at.
───────────────────────────────────────────────────────── */

export interface KinguinSearchResult {
  kinguinId: number;
  name:      string;
  platform:  string | null;
  cover:     string | null;
  genres:    string[];
  costUsd:   number;
  inStock:   boolean;
}

// eurUsdRate — Kinguin's own price/offer.price fields are EUR, not USD
// (see lib/shared/fxRate.ts header comment); costUsd below is what the
// admin UI shows and what create/create-variant persist as game cost.
export function normalizeSearchResults(items: KinguinProductItem[], eurUsdRate: number): KinguinSearchResult[] {
  return items
    .filter(item => !isBlockedInUzbekistan(item))
    .map(item => {
      const offer = cheapestInStockOffer(item);
      return {
        kinguinId: item.kinguinId,
        name:      item.name,
        platform:  item.platform ?? null,
        cover:     item.images?.cover?.thumbnail ?? null,
        genres:    item.genres ?? [],
        costUsd:   (offer?.price ?? item.price) * eurUsdRate,
        inStock:   Boolean(offer),
      };
    });
}

const BLOCK_WORDS = [
  'dlc', 'pre-order', 'preorder', 'bonus', 'season pass', 'expansion pass',
  'soundtrack', ' ost', 'artbook', 'art book', 'currency', 'points',
  'gift card', 'skin pack', 'beta', 'demo', 'trainer',
  // real incident: "Valheim - Premium Items Pack Manual Delivery" ($5.49)
  // starts with the search title and has none of the words above, so it
  // out-priced (and got picked over) the real "Valheim PC Steam CD Key"
  // ($12.40) — cosmetic add-on packs need their own block words.
  'items pack', 'manual delivery',
];

function isCleanBaseGame(name: string): boolean {
  const lower = name.toLowerCase();
  return !BLOCK_WORDS.some(w => lower.includes(w));
}

const ACCOUNT_RE = /\baccount\b/i;
const GIFT_RE = /\bgift\b/i;

/**
 * games.productType/game_variants.productType from the raw Kinguin SKU
 * name ("... Steam Account", "... Steam Gift", "... CD Key") — the same
 * signal ACCOUNT_RE below uses to steer offer selection, reused so the
 * customer-facing badge (lib/types.ts ProductType) actually matches what
 * the supplier delivers instead of defaulting to KEY for everything.
 */
export function inferProductType(kinguinName: string): 'KEY' | 'GIFT' | 'ACCOUNT' {
  if (ACCOUNT_RE.test(kinguinName)) return 'ACCOUNT';
  if (GIFT_RE.test(kinguinName)) return 'GIFT';
  return 'KEY';
}

/**
 * "Account"-офферы (готовый Steam-аккаунт с игрой) обычно дешевле CD Key/
 * Gift, но покупатель получает не ключ активации, а логин/пароль Steam
 * ПЛЮС логин/пароль привязанной почты (для кода подтверждения) — см.
 * lib/deliveryFormat.ts. Заметно более сложный опыт для покупателя, чем
 * обычный ключ. Берём Account только если он ощутимо (40%+) дешевле
 * лучшего CD Key/Gift-варианта — иначе экономия не стоит путаницы.
 */
const ACCOUNT_DISCOUNT_THRESHOLD = 0.6; // account должен быть дешевле ×0.6 от non-account

/**
 * Best clean Steam base-game offer for `title`, or null if nothing
 * qualifies (wrong platform only, out of stock, or DLC/bonus only).
 */
export function pickBestBaseGameOffer(results: KinguinSearchResult[], title: string): KinguinSearchResult | null {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const t = norm(title);

  const sortPool = (pool: KinguinSearchResult[]): KinguinSearchResult[] =>
    [...pool].sort((a, b) => {
      const aMatch = norm(a.name).startsWith(t) ? 0 : 1;
      const bMatch = norm(b.name).startsWith(t) ? 0 : 1;
      if (aMatch !== bMatch) return aMatch - bMatch;
      return a.costUsd - b.costUsd;
    });

  const candidates = results.filter(r => r.platform === 'Steam' && r.inStock && isCleanBaseGame(r.name));
  if (!candidates.length) return null;

  const nonAccount = candidates.filter(c => !ACCOUNT_RE.test(c.name));
  const account    = candidates.filter(c => ACCOUNT_RE.test(c.name));

  if (nonAccount.length) {
    const bestNonAccount = sortPool(nonAccount)[0];
    const bestAccount    = account.length ? sortPool(account)[0] : null;
    if (bestAccount && bestAccount.costUsd < bestNonAccount.costUsd * ACCOUNT_DISCOUNT_THRESHOLD) {
      return bestAccount;
    }
    return bestNonAccount;
  }
  return account.length ? sortPool(account)[0] : null;
}
