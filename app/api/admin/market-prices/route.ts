import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface MarketOffer {
  source:    'kinguin' | 'eneba';
  price:     number;
  currency:  string;
  priceUsd:  number;
  name:      string;
  platform?: string;
  inStock:   boolean;
  url?:      string;
}

interface SteamResult {
  appId:         number;
  name:          string;
  priceUsd:      number | null;
  salePriceUsd:  number | null;
  discountPct:   number;
  url:           string;
}

// ── Kinguin ───────────────────────────────────────────────────────────────────
async function fetchKinguin(title: string): Promise<MarketOffer[]> {
  const key = process.env.KINGUIN_API_KEY;
  if (!key) return [];

  try {
    const qs  = new URLSearchParams({ search: title, sortBy: 'price', sortType: 'asc', page: '1', limit: '10' });
    const res = await fetch(`https://api.kinguin.net/integration/v1/products?${qs}`, {
      headers: { 'X-Api-Key': key },
      signal:  AbortSignal.timeout(6000),
      cache:   'no-store',
    });
    if (!res.ok) return [];
    const data = await res.json();

    return (data.data ?? []).slice(0, 5).map((p: {
      name: string;
      cheapestOfferPrice: number;
      platform?: string;
      isAvailable?: boolean;
      kinguinId?: number;
    }) => ({
      source:   'kinguin' as const,
      price:    p.cheapestOfferPrice,
      currency: 'USD',
      priceUsd: p.cheapestOfferPrice,
      name:     p.name,
      platform: p.platform,
      inStock:  p.isAvailable !== false,
      url:      p.kinguinId ? `https://www.kinguin.net/category/${p.kinguinId}` : undefined,
    }));
  } catch {
    return [];
  }
}

// ── Eneba ─────────────────────────────────────────────────────────────────────
async function fetchEneba(title: string): Promise<MarketOffer[]> {
  const key = process.env.ENEBA_API_KEY;
  if (!key) return [];

  try {
    const query = `
      query SearchProducts($search: String!) {
        marketplace {
          auctions(
            filters: { search: $search, regionId: 1 }
            pagination: { first: 10 }
            sort: { field: PRICE, direction: ASC }
          ) {
            edges {
              node {
                price { amount currency }
                product { name slug }
                inStock
              }
            }
          }
        }
      }
    `;

    const res = await fetch('https://www.eneba.com/api/graphql/', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body:   JSON.stringify({ query, variables: { search: title } }),
      signal: AbortSignal.timeout(6000),
      cache:  'no-store',
    });
    if (!res.ok) return [];
    const json = await res.json();

    const edges = json?.data?.marketplace?.auctions?.edges ?? [];
    return edges.slice(0, 5).map((e: {
      node: {
        price:   { amount: number; currency: string };
        product: { name: string; slug?: string };
        inStock: boolean;
      };
    }) => {
      const amountUsd = e.node.price.currency === 'USD'
        ? e.node.price.amount / 100
        : e.node.price.amount / 100;
      return {
        source:   'eneba' as const,
        price:    e.node.price.amount / 100,
        currency: e.node.price.currency,
        priceUsd: amountUsd,
        name:     e.node.product.name,
        inStock:  e.node.inStock,
        url:      e.node.product.slug ? `https://www.eneba.com/${e.node.product.slug}` : undefined,
      };
    });
  } catch {
    return [];
  }
}

// ── Steam (public, no API key required) ──────────────────────────────────────

// Suffixes that indicate non-base versions — skip these when a better match exists
const SKIP_SUFFIXES = [
  ' vr', ' vr edition', ' bundle', ' dlc', ' demo', ' soundtrack',
  ' artbook', ' season pass', ' expansion', ' legacy edition',
];

function isBaseVersion(name: string): boolean {
  const lower = name.toLowerCase();
  return !SKIP_SUFFIXES.some(s => lower.endsWith(s));
}

// Score how closely a candidate name matches the search title (higher = better)
function matchScore(candidate: string, target: string): number {
  const c = candidate.toLowerCase().trim();
  const t = target.toLowerCase().trim();
  if (c === t) return 100;
  if (c.startsWith(t) && isBaseVersion(c)) return 80;
  if (c.includes(t) && isBaseVersion(c)) return 60;
  if (c.startsWith(t)) return 40;
  if (c.includes(t)) return 20;
  return 0;
}

async function fetchSteam(title: string): Promise<SteamResult | null> {
  try {
    const searchRes = await fetch(
      `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(title)}&l=english&cc=uz`,
      { cache: 'no-store', signal: AbortSignal.timeout(6000) },
    );
    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();

    const items: { id: number; name: string; price?: { final: number; discount_percent: number } }[] =
      searchData?.items ?? [];
    if (items.length === 0) return null;

    // Pick best match — prefer exact/base version over VR/DLC/bundle
    const scored = items
      .map(i => ({ item: i, score: matchScore(i.name, title) }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score);

    const match = (scored[0]?.item) ?? items[0];

    const appId       = match.id;
    const basePrice   = match.price ? match.price.final / 100 : null;
    const discountPct = match.price?.discount_percent ?? 0;

    // Fetch full app details to get the initial (non-sale) price
    const detailRes = await fetch(
      `https://store.steampowered.com/api/appdetails?appids=${appId}&cc=uz&l=english`,
      { cache: 'no-store', signal: AbortSignal.timeout(5000) },
    );

    let originalPrice: number | null = basePrice;
    let currentSalePrice: number | null = null;

    if (detailRes.ok) {
      const detail = await detailRes.json();
      const ov = detail?.[appId]?.data?.price_overview;
      if (ov) {
        originalPrice    = ov.initial / 100;
        const finalPrice = ov.final / 100;
        if (ov.discount_percent > 0) {
          currentSalePrice = finalPrice;
        }
      }
    }

    return {
      appId,
      name:         match.name,
      priceUsd:     originalPrice,
      salePriceUsd: currentSalePrice,
      discountPct,
      url:          `https://store.steampowered.com/app/${appId}`,
    };
  } catch {
    return null;
  }
}

// ── Handler ───────────────────────────────────────────────────────────────────
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title')?.trim();
  if (!title) return NextResponse.json({ success: false, error: 'title is required' }, { status: 400 });

  const hasKinguin = !!process.env.KINGUIN_API_KEY;

  const [kinguinOffers, steamResult] = await Promise.all([
    fetchKinguin(title),
    fetchSteam(title),
  ]);

  const cheapestKinguin = kinguinOffers[0] ?? null;

  return NextResponse.json({
    success: true,
    title,
    sources: {
      kinguin: { configured: hasKinguin, cheapest: cheapestKinguin, offers: kinguinOffers },
      steam:   { result: steamResult },
    },
  });
}
