import { TtlCache } from './ttlCache';
import { fetchWithTimeout } from './fetchWithTimeout';

/* ─────────────────────────────────────────────────────────
   Live EUR→USD rate.

   Kinguin's eCommerce API prices everything in EUR (confirmed against
   github.com/kinguinltdhk/Kinguin-eCommerce-API: "Cheapest offer price
   in EUR" / "Offer price in EUR"), but every cost field downstream
   (game_pricing.supplierPriceUsd, the Smart Pricing engine, purchaseKey()'s
   profit-safety check) assumes USD. Convert at the point Kinguin's raw
   price first enters our system — never apply this to the raw value sent
   back to Kinguin's own POST /v1/order, which must echo their own EUR
   number, not a converted one.

   frankfurter.app is ECB-reference-rate based, free, no API key. Cached
   1h (FX doesn't move fast enough to justify per-request calls); on a
   failed fetch, prefers the last known-good rate over the hardcoded
   fallback so a transient outage doesn't silently mis-price purchases.
───────────────────────────────────────────────────────── */

const cache = new TtlCache();
const CACHE_KEY = 'fx:eur-usd';
const TTL_SECONDS = 3600;
const FALLBACK_RATE = 1.08; // only used if we've never fetched a live rate this process

let lastKnownGoodEurUsd: number | null = null;

export async function getEurUsdRate(): Promise<number> {
  const cached = cache.get<number>(CACHE_KEY);
  if (cached) return cached;

  try {
    const res = await fetchWithTimeout('https://api.frankfurter.app/latest?from=EUR&to=USD', {}, 5000);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: { rates?: { USD?: number } } = await res.json();
    const rate = data.rates?.USD;
    if (!rate || rate <= 0) throw new Error('invalid rate in response');
    lastKnownGoodEurUsd = rate;
    cache.set(CACHE_KEY, rate, TTL_SECONDS);
    return rate;
  } catch (err) {
    console.warn(
      `[FX] EUR/USD live rate fetch failed, using ${lastKnownGoodEurUsd ? 'last known rate' : 'hardcoded fallback'}:`,
      err instanceof Error ? err.message : err,
    );
    return lastKnownGoodEurUsd ?? FALLBACK_RATE;
  }
}

/* ─────────────────────────────────────────────────────────
   Live USD→UZS rate — backs the "Авто-обновление курса" toggle
   (currency_settings.autoUpdateRate) that already existed in the admin
   Smart Pricing UI and schema, but had no fetch logic behind it: the
   toggle just sat there unused. frankfurter.app doesn't carry UZS (ECB
   reference rates only cover major currencies), so this uses
   open.er-api.com instead — also free, no API key, ~24h-refreshed rates.
───────────────────────────────────────────────────────── */

const USD_UZS_CACHE_KEY = 'fx:usd-uzs';
const USD_UZS_FALLBACK = 12700; // matches USD_TO_UZS env default (lib/shared/currency.ts)

let lastKnownGoodUsdUzs: number | null = null;

export async function getUsdUzsRate(): Promise<number> {
  const cached = cache.get<number>(USD_UZS_CACHE_KEY);
  if (cached) return cached;

  try {
    const res = await fetchWithTimeout('https://open.er-api.com/v6/latest/USD', {}, 5000);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: { result?: string; rates?: { UZS?: number } } = await res.json();
    const rate = data.rates?.UZS;
    if (data.result !== 'success' || !rate || rate <= 0) throw new Error('invalid rate in response');
    lastKnownGoodUsdUzs = rate;
    cache.set(USD_UZS_CACHE_KEY, rate, TTL_SECONDS);
    return rate;
  } catch (err) {
    console.warn(
      `[FX] USD/UZS live rate fetch failed, using ${lastKnownGoodUsdUzs ? 'last known rate' : 'hardcoded fallback'}:`,
      err instanceof Error ? err.message : err,
    );
    return lastKnownGoodUsdUzs ?? USD_UZS_FALLBACK;
  }
}
