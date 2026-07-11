# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server at http://localhost:3000
npm run build    # Production build (type-checks + compiles)
npm run start    # Serve production build
npm run lint     # ESLint via next lint
```

### Database setup (required before first run)

```bash
# Push schema to PostgreSQL (creates all tables)
npx prisma db push

# Or create a versioned migration (preferred for production)
npx prisma migrate dev --name init

# After schema changes, regenerate Prisma client
npx prisma generate
```

`DATABASE_URL` is read from `.env` (see `.env` in repo root, default: `postgresql://arcane:arcane_secret@localhost:5432/arcane_db`).

No test suite is configured. TypeScript errors surface during `npm run build`.

## Architecture

**Next.js 14 App Router** store for the Uzbekistan market. The project has two layers:

- **Storefront**: product catalog, mystery cases, checkout
- **Admin panel**: `/admin/*` routes for orders, products, analytics, and more

### Data layer

Static mock data lives in [`lib/mockData.ts`](lib/mockData.ts) (products, mystery cases, categories). Types are in [`lib/types.ts`](lib/types.ts). When Digiseller env vars are present, live product data is fetched from the Digiseller API and cached in-memory; otherwise all endpoints fall back to mock data transparently (`source: 'mock'` in responses).

Orders are stored in **PostgreSQL** via Prisma. The service layer lives in [`lib/orders/`](lib/orders/) (`service.ts` → `repository.ts`). Delivery logic is in [`lib/delivery/`](lib/delivery/).

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

### Other supplier integrations (Kinguin, Eneba, G2A, Gamivo)

Four more external catalog/dropship integrations follow the exact same file shape as `lib/digiseller/`, under `lib/kinguin/`, `lib/eneba/`, `lib/g2a/`, `lib/gamivo/` — each with its own `config.ts`/`cache.ts`/`client.ts`/`productMapper.ts`/`pricingMapper.ts`/`deliveryMapper.ts`/`{x}Service.ts`/`index.ts`, plus matching API routes under `app/api/{kinguin,eneba,g2a,gamivo}/{products,product/[id],sync}` and hooks `use{X}Products`/`use{X}Product`. Shared infrastructure (`TtlCache`, timeout-bounded fetch, USD→UZS conversion, OAuth2 client_credentials) lives in [`lib/shared/`](lib/shared/). Auth scheme differs per supplier — see below.

**Two credential tiers per supplier** — do not confuse them:
- **Search tier** (`KINGUIN_API_KEY`, `ENEBA_API_KEY`) — read-only, used only by `app/api/admin/market-prices/route.ts` for price comparison.
- **Merchant tier** — required for catalog sync and dropship ordering, gates `isKinguinEnabled()` / `isEnebaEnabled()`. **Kinguin** (`KINGUIN_MERCHANT_API_KEY`) is a single `X-Api-Key` header — verified 2026-07-11 against the official reference implementation (github.com/kinguinltdhk/Kinguin-eCommerce-API); no `auth.ts` file, `client.ts` reads the key straight from config. **Eneba** (`ENEBA_AUTH_ID`/`SECRET`) is OAuth2 client_credentials via `lib/eneba/auth.ts` — verified against Eneba's own docs, but NOT re-confirmed against a reference implementation the way Kinguin was, so treat with slightly less certainty.

**Verification status**: Kinguin's single-API-key merchant auth and Eneba's OAuth2 merchant auth are both verified against official docs (Kinguin against an actual reference client, which caught and corrected an earlier wrong assumption that Kinguin used OAuth2 too — it doesn't). Kinguin order fulfillment is async: `lib/kinguin/client.ts`'s `purchaseProduct()` creates the order then polls a separate "download keys" endpoint a few times before giving up (falls back to `WAITING_MANUAL` like any other dropship failure). **G2A and Gamivo are unverified** — their `auth.ts` always throws `UnverifiedSupplierError` (from `lib/shared/unverifiedSupplierError.ts`) regardless of env vars, so `getProducts()`/`syncProducts()` always fall back to mock and no network call is ever attempted. See the header comments in `lib/g2a/config.ts` and `lib/gamivo/config.ts` before enabling.

### API routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/digiseller/products` | GET | Product list with q/category/platform/sort filters |
| `/api/digiseller/product/[id]` | GET | Single product |
| `/api/digiseller/sync` | GET/POST | Sync status / trigger re-sync from Digiseller |
| `/api/digiseller/purchase/[id]` | GET | Generate Digiseller purchase URL |
| `/api/{kinguin,eneba,g2a,gamivo}/products` | GET | Product list, same filter/sort contract as Digiseller's |
| `/api/{kinguin,eneba,g2a,gamivo}/product/[id]` | GET | Single product |
| `/api/{kinguin,eneba,g2a,gamivo}/sync` | GET/POST | Sync status / trigger re-sync (same `x-sync-secret`/admin-session guard as Digiseller's) |
| `/api/orders` | GET/POST | List all orders / create order after payment |
| `/api/orders/[id]/deliver` | POST | Admin delivers game key; triggers Telegram notification |
| `/api/cases/[id]/open` | POST | Open a mystery case; returns weighted random reward |

### Order flow

`POST /api/orders` → Prisma (`lib/orders/service.ts`) → Telegram admin notification via `lib/adminTelegram.ts` → `lib/delivery/processDelivery()` dispatches by the most-restrictive item's `deliveryType` (`MANUAL` > `DROPSHIP` > `AUTO`) → `queueManual` / `dropshipDeliver` / `autoDeliver` → admin can also manually deliver via `POST /api/orders/[id]/deliver` → key written to `order_items.keyValue`, user notified.

`DROPSHIP` (`lib/delivery/dropshipDeliver.ts`) buys the key from the game's `dropshipSource`/`dropshipExternalId`-tagged supplier at order time instead of pulling pre-stocked `game_keys` — no stock is ever pre-loaded for these games. These fields are deliberately separate from `source`/`externalId` (metadata origin — rawg/igdb/steam), since a game can be RAWG-sourced for content but dropship-fulfilled via a different supplier like Kinguin. A cart mixing `DROPSHIP` and `AUTO` items is handled in one pass (AUTO items reuse `deliverAutoItem()` from `autoDeliver.ts`). arcane-api's `autoDisableEmptyGamesJob`/`lowStockScanJob` cron jobs exclude `DROPSHIP` games from "0 stock ⇒ inactive" logic.

Status machine: `PENDING` → `PAID` → `WAITING_MANUAL` → `COMPLETED` (or `CANCELLED`).

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

# Sync endpoint protection (optional, shared across all supplier /sync routes)
SYNC_SECRET=

# Kinguin/Eneba merchant tier (optional — omit to use mock data)
# G2A/Gamivo vars exist but are inert — see "Other supplier integrations" above
KINGUIN_MERCHANT_API_KEY=
ENEBA_AUTH_ID=
ENEBA_AUTH_SECRET=

# Telegram notifications
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

### Adding a new product

Add to the `products` array in `lib/mockData.ts`. The `id` must be unique — it becomes `/product/[id]`. `trendingProducts` and `dailyDeals` are derived slices (first 6, and `discount > 0`), so they update automatically. To expose Digiseller products, set `digiGoodId` on the product entry.
