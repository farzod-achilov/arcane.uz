import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';

export const dynamic = 'force-dynamic';

const DEFAULT_CASES = [
  {
    name:        'Silver Case',
    slug:        'silver-case',
    theme:       'silver',
    price:       49000,
    description: 'Стартовый кейс с монетами',
    rewards: [
      { name: '500 монет',    type: 'COINS', rarity: 'COMMON',    dropChance: 0.35, sellValue: 500    },
      { name: '1 000 монет',  type: 'COINS', rarity: 'COMMON',    dropChance: 0.25, sellValue: 1000   },
      { name: '2 000 монет',  type: 'COINS', rarity: 'RARE',      dropChance: 0.18, sellValue: 2000   },
      { name: '5 000 монет',  type: 'COINS', rarity: 'RARE',      dropChance: 0.12, sellValue: 5000   },
      { name: '10 000 монет', type: 'COINS', rarity: 'EPIC',      dropChance: 0.07, sellValue: 10000  },
      { name: '30 000 монет', type: 'COINS', rarity: 'LEGENDARY', dropChance: 0.03, sellValue: 30000  },
    ],
  },
  {
    name:        'Gold Case',
    slug:        'gold-case',
    theme:       'gold',
    price:       149000,
    description: 'Премиум кейс с редкими наградами',
    rewards: [
      { name: '2 000 монет',   type: 'COINS', rarity: 'COMMON',    dropChance: 0.28, sellValue: 2000   },
      { name: '5 000 монет',   type: 'COINS', rarity: 'COMMON',    dropChance: 0.22, sellValue: 5000   },
      { name: '10 000 монет',  type: 'COINS', rarity: 'RARE',      dropChance: 0.18, sellValue: 10000  },
      { name: '25 000 монет',  type: 'COINS', rarity: 'RARE',      dropChance: 0.14, sellValue: 25000  },
      { name: '50 000 монет',  type: 'COINS', rarity: 'EPIC',      dropChance: 0.10, sellValue: 50000  },
      { name: 'Случайная игра',type: 'GAME',  rarity: 'EPIC',      dropChance: 0.05, sellValue: 100000 },
      { name: '150 000 монет', type: 'COINS', rarity: 'LEGENDARY', dropChance: 0.03, sellValue: 150000 },
    ],
  },
  {
    name:        'Arcane Case',
    slug:        'arcane-case',
    theme:       'arcane',
    price:       349000,
    description: 'Легендарный кейс — самые ценные дропы',
    rewards: [
      { name: '10 000 монет',  type: 'COINS',   rarity: 'COMMON',    dropChance: 0.25, sellValue: 10000  },
      { name: '25 000 монет',  type: 'COINS',   rarity: 'COMMON',    dropChance: 0.20, sellValue: 25000  },
      { name: '50 000 монет',  type: 'COINS',   rarity: 'RARE',      dropChance: 0.17, sellValue: 50000  },
      { name: '100 000 монет', type: 'COINS',   rarity: 'RARE',      dropChance: 0.13, sellValue: 100000 },
      { name: 'AAA-игра',      type: 'GAME',    rarity: 'EPIC',      dropChance: 0.10, sellValue: 200000 },
      { name: '250 000 монет', type: 'COINS',   rarity: 'EPIC',      dropChance: 0.08, sellValue: 250000 },
      { name: 'JACKPOT',       type: 'JACKPOT', rarity: 'LEGENDARY', dropChance: 0.04, sellValue: 500000 },
      { name: '500 000 монет', type: 'COINS',   rarity: 'LEGENDARY', dropChance: 0.03, sellValue: 500000 },
    ],
  },
];

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const created: string[] = [];
  const skipped: string[] = [];

  for (const def of DEFAULT_CASES) {
    const existing = await prisma.drop_machines.findUnique({ where: { slug: def.slug } });
    if (existing) {
      skipped.push(def.name);
      continue;
    }

    const now     = new Date();
    const machine = await prisma.drop_machines.create({
      data: {
        id:          nanoid(),
        name:        def.name,
        slug:        def.slug,
        theme:       def.theme,
        price:       def.price,
        description: def.description,
        isActive:    false,
        totalOpened: 0,
        updatedAt:   now,
      },
    });

    await prisma.drop_rewards.createMany({
      data: def.rewards.map(r => ({
        id:          nanoid(),
        dropId:      machine.id,
        name:        r.name,
        type:        r.type as 'COINS' | 'GAME' | 'DISCOUNT' | 'BOOST' | 'JACKPOT',
        rarity:      r.rarity as 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY',
        dropChance:  r.dropChance,
        sellValue:   r.sellValue,
        isActive:    true,
        timesDropped:0,
        updatedAt:   now,
      })),
    });

    created.push(def.name);
  }

  return NextResponse.json({ ok: true, created, skipped });
}
