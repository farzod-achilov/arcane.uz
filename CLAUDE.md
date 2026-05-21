# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server at http://localhost:3000
npm run build    # Production build (type-checks + compiles)
npm run start    # Serve production build
npm run lint     # ESLint via next lint
```

No test suite is configured. TypeScript errors surface during `npm run build`.

## Architecture

**Next.js 14 App Router** store for the Uzbekistan market. The project has two layers:

- **Storefront**: product catalog, mystery cases, checkout
- **Admin panel**: `/admin/*` routes for orders, products, analytics, and more

### Data layer

Static mock data lives in [`lib/mockData.ts`](lib/mockData.ts) (products, mystery cases, categories). Types are in [`lib/types.ts`](lib/types.ts). When Digiseller env vars are present, live product data is fetched from the Digiseller API and cached in-memory; otherwise all endpoints fall back to mock data transparently (`source: 'mock'` in responses).

Orders are stored in an **in-memory `Map`** in [`lib/orders.ts`](lib/orders.ts) — this resets on every server restart and must be replaced with a database before production.

### Digiseller integration

All Digiseller logic is server-only under [`lib/digiseller/`](lib/digiseller/):

| File | Role |
|------|------|
| `client.ts` | HTTP client (12s timeout, no-store cache) |
| `auth.ts` | SHA256 token signing; tokens cached 11h |
| `cache.ts` | In-memory TTL cache (products: 5 min, single product: 10 min) |
| `digisellerService.ts` | Orchestrates fetch → cache → map → sync |
| `productMapper.ts` | Normalises Digi response → `Product` shape |
| `pricingMapper.ts` | USD → UZS conversion (configurable rate) |
| `deliveryMapper.ts` | Keyword-based `DeliveryType` inference |

Client-side access goes through React hooks in [`hooks/`](hooks/): `useDigisellerProducts` and `useDigisellerProduct`, which hit the Next.js API routes.

### API routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/digiseller/products` | GET | Product list with q/category/platform/sort filters |
| `/api/digiseller/product/[id]` | GET | Single product |
| `/api/digiseller/sync` | GET/POST | Sync status / trigger re-sync from Digiseller |
| `/api/digiseller/purchase/[id]` | GET | Generate Digiseller purchase URL |
| `/api/orders` | GET/POST | List all orders / create order after payment |
| `/api/orders/[id]/deliver` | POST | Admin delivers game key; triggers Telegram notification |
| `/api/cases/[id]/open` | POST | Open a mystery case; returns weighted random reward |

### Order flow

`POST /api/orders` → in-memory store (`lib/orders.ts`) → Telegram admin notification via `lib/adminTelegram.ts` → admin manually buys & delivers key via `POST /api/orders/[id]/deliver` → key sent to customer (Telegram-first, email fallback).

Status machine: `pending` → `paid` → `processing` → `delivered`.

### Page → component tree

- `app/layout.tsx` — wraps every page with `<Navbar>` and `<Footer>`
- `app/page.tsx` — homepage: 8 section components from `components/home/`
- `app/catalog/page.tsx` — `'use client'`; filter/sort/search state, renders `CatalogSidebar` + product grid
- `app/product/[id]/page.tsx` — `'use client'`; fetches via `useDigisellerProduct`, falls back to mock
- `app/checkout/page.tsx` — `'use client'`; 3-step state machine (`'cart' | 'payment' | 'success'`)
- `app/cases/[id]/page.tsx` — animated drum spin, calls `/api/cases/[id]/open`, three rarity tiers

Shared product card: `components/ui/ProductCard.tsx`. Catalog list view has its own inline `ListProductCard` at the bottom of `app/catalog/page.tsx`.

### Design system

Custom Tailwind tokens (`tailwind.config.ts`):
- **Backgrounds**: `bg-base` (#0A0A0F), `bg-card` (#12121A), `bg-elevated` (#1A1A28), `bg-border` (#1E1E2E)
- **Accents**: `accent-purple` (#7C3AED), `accent-cyan` (#06B6D4) with light/dark variants
- **Shadows**: `shadow-glow-purple`, `shadow-glow-cyan`, `shadow-card`, `shadow-card-hover`
- **Fonts**: `font-heading` (Space Grotesk), `font-body` (Inter) — loaded via `next/font/google`

All animations use Framer Motion with `initial`/`whileInView`/`viewport={{ once: true }}`.

### Prices

Plain integers in UZS (e.g. `249000`). Always use `formatPrice()` from `lib/utils.ts` for display. Digiseller prices are USD → UZS via `pricingMapper.ts` using `USD_TO_UZS` env var (default `12700`), rounded to nearest 1000 сум.

### Images

All product/user images use `picsum.photos` with deterministic seeds. `next.config.js` allowlist: `picsum.photos`, `via.placeholder.com`, `placehold.co`. All `<Image>` components require the `unoptimized` prop.

### Environment variables

Copy `.env.local.example` to `.env.local`. Without Digiseller vars, mock data is used everywhere.

```
# Digiseller (optional — omit to use mock data)
DIGISELLER_SELLER_ID=
DIGISELLER_API_KEY=
DIGISELLER_BASE_URL=https://api.digiseller.com/api
DIGISELLER_STORE_URL=https://digiseller.com
DIGISELLER_PAGE_SIZE=50
USD_TO_UZS=12700
DIGI_CACHE_PRODUCTS_TTL=300   # seconds
DIGI_CACHE_PRODUCT_TTL=600

# Sync endpoint protection (optional)
SYNC_SECRET=

# Telegram notifications
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

### Adding a new product

Add to the `products` array in `lib/mockData.ts`. The `id` must be unique — it becomes `/product/[id]`. `trendingProducts` and `dailyDeals` are derived slices (first 6, and `discount > 0`), so they update automatically. To expose Digiseller products, set `digiGoodId` on the product entry.
