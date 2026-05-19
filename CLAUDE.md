# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server at http://localhost:3000
npm run build    # Production build (type-checks + compiles)
npm run start    # Serve production build
npm run lint     # ESLint via next lint
```

No test suite is configured. There is no separate type-check script — TypeScript errors surface during `npm run build`.

## Architecture

**Next.js 14 App Router** frontend-only store (no backend, no database). All data is static mock data — there is no API layer.

### Data flow

All product/category/review data lives in [`lib/mockData.ts`](lib/mockData.ts) as exported arrays. Types are defined in [`lib/types.ts`](lib/types.ts). Pages import directly from `mockData` — there is no state management library or context. The catalog page performs all filtering/sorting client-side with `useMemo` over the full `products` array.

### Page → component tree

- `app/layout.tsx` — wraps every page with `<Navbar>` and `<Footer>`
- `app/page.tsx` — homepage: composes 8 section components from `components/home/`
- `app/catalog/page.tsx` — `'use client'`; owns filter/sort/search state, renders `CatalogSidebar` + product grid
- `app/product/[id]/page.tsx` — `'use client'`; looks up product by `params.id` from the mock array, calls `notFound()` if missing
- `app/checkout/page.tsx` — `'use client'`; 3-step local state machine (`'cart' | 'payment' | 'success'`), no real payment integration

The shared product card (`components/ui/ProductCard.tsx`) is used by both the homepage trending section and the catalog grid. The catalog list view has its own inline `ListProductCard` component defined at the bottom of `app/catalog/page.tsx`.

### Design system

Custom Tailwind tokens (defined in `tailwind.config.ts`):
- **Backgrounds**: `bg-base` (#0A0A0F), `bg-card` (#12121A), `bg-elevated` (#1A1A28), `bg-border` (#1E1E2E)
- **Accents**: `accent-purple` (#7C3AED), `accent-cyan` (#06B6D4) and their light/dark variants
- **Shadows**: `shadow-glow-purple`, `shadow-glow-cyan`, `shadow-card`, `shadow-card-hover`
- **Fonts**: `font-heading` (Space Grotesk) for titles, `font-body` (Inter) for body text — loaded via `next/font/google` in the root layout

All animations use Framer Motion. The `motion.div` pattern with `initial`/`whileInView`/`viewport={{ once: true }}` is used consistently for scroll-triggered entrance animations.

### Prices

All prices are in Uzbek soum (UZS) as plain integers (e.g. `249000`). Use `formatPrice()` from `lib/utils.ts` for display — it formats with `Intl.NumberFormat('uz-UZ')` and appends `' сум'`.

### Images

External images from `picsum.photos` are used for all product/user photos with deterministic seeds (e.g. `https://picsum.photos/seed/cyber2077/400/550`). The `next.config.js` allowlist includes `picsum.photos`, `via.placeholder.com`, and `placehold.co`. All `<Image>` usages require `unoptimized` prop since these are third-party seeded URLs.

### Adding a new product

Add an entry to the `products` array in `lib/mockData.ts`. The `id` must be a unique string — it becomes the URL segment at `/product/[id]`. `trendingProducts` and `dailyDeals` are derived slices of `products` (first 6, and filtered by `discount > 0`), so they update automatically.
