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

let lastKnownGood: number | null = null;

export async function getEurUsdRate(): Promise<number> {
  const cached = cache.get<number>(CACHE_KEY);
  if (cached) return cached;

  try {
    const res = await fetchWithTimeout('https://api.frankfurter.app/latest?from=EUR&to=USD', {}, 5000);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: { rates?: { USD?: number } } = await res.json();
    const rate = data.rates?.USD;
    if (!rate || rate <= 0) throw new Error('invalid rate in response');
    lastKnownGood = rate;
    cache.set(CACHE_KEY, rate, TTL_SECONDS);
    return rate;
  } catch (err) {
    console.warn(
      `[FX] EUR/USD live rate fetch failed, using ${lastKnownGood ? 'last known rate' : 'hardcoded fallback'}:`,
      err instanceof Error ? err.message : err,
    );
    return lastKnownGood ?? FALLBACK_RATE;
  }
}
