/**
 * Seed script — inserts sample data for development.
 * Run: npm run prisma:seed
 */
import { PrismaClient } from '@prisma/client';
import Decimal          from 'decimal.js';
import { applyMarkup }  from './utils/decimal';

const prisma = new PrismaClient();

async function main() {
  // ── Suppliers ──────────────────────────────────────────────────────────────
  const [g2a, kinguin] = await Promise.all([
    prisma.supplier.upsert({
      where:  { slug: 'g2a' },
      update: {},
      create: { name: 'G2A', slug: 'g2a' },
    }),
    prisma.supplier.upsert({
      where:  { slug: 'kinguin' },
      update: {},
      create: { name: 'Kinguin', slug: 'kinguin' },
    }),
  ]);

  // ── Games ──────────────────────────────────────────────────────────────────
  const [cyberpunk, witcher, minecraft] = await Promise.all([
    prisma.game.upsert({
      where:  { slug: 'cyberpunk-2077' },
      update: {},
      create: { title: 'Cyberpunk 2077', slug: 'cyberpunk-2077' },
    }),
    prisma.game.upsert({
      where:  { slug: 'witcher-3' },
      update: {},
      create: { title: 'The Witcher 3: Wild Hunt', slug: 'witcher-3' },
    }),
    prisma.game.upsert({
      where:  { slug: 'minecraft' },
      update: {},
      create: { title: 'Minecraft', slug: 'minecraft' },
    }),
  ]);

  // ── Global config ──────────────────────────────────────────────────────────
  const existing = await prisma.globalConfig.findFirst();
  if (!existing) {
    await prisma.globalConfig.create({ data: { globalMarkupPercent: new Decimal(5) } });
  }

  // ── Pricing rules ──────────────────────────────────────────────────────────
  await prisma.pricingRule.createMany({
    skipDuplicates: true,
    data: [
      {
        name:        'Cheap games — fixed markup',
        description: 'Games under $20 get a flat $2 markup',
        minPrice:    new Decimal(0),
        maxPrice:    new Decimal(19.9999),
        markupType:  'fixed',
        markupValue: new Decimal(2),
        priority:    10,
      },
      {
        name:        'Mid-range games — 10% markup',
        description: '$20–$59.99',
        minPrice:    new Decimal(20),
        maxPrice:    new Decimal(59.9999),
        markupType:  'percent',
        markupValue: new Decimal(10),
        priority:    5,
      },
      {
        name:        'AAA games — 8% markup',
        description: '$60+',
        minPrice:    new Decimal(60),
        maxPrice:    null,
        markupType:  'percent',
        markupValue: new Decimal(8),
        priority:    1,
      },
    ],
  });

  // ── Sample offers ──────────────────────────────────────────────────────────
  const offersData = [
    { game: cyberpunk, supplier: g2a,     price: 29.99, type: 'percent' as const, markup: 10 },
    { game: cyberpunk, supplier: kinguin, price: 27.5,  type: 'percent' as const, markup: 12 },
    { game: witcher,   supplier: g2a,     price: 9.99,  type: 'fixed'   as const, markup: 2  },
    { game: minecraft, supplier: kinguin, price: 14.99, type: 'fixed'   as const, markup: 2  },
  ];

  for (const o of offersData) {
    const supplierPrice = new Decimal(o.price);
    const markupValue   = new Decimal(o.markup);
    const finalPrice    = applyMarkup(supplierPrice, o.type, markupValue);

    await prisma.offer.create({
      data: {
        gameId:        o.game.id,
        supplierId:    o.supplier.id,
        supplierPrice,
        markupType:    o.type,
        markupValue,
        finalPrice,
        currency:      'USD',
      },
    });
  }

  console.log('✓ Seed complete');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
