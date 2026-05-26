import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { encryptKey, hashKey, normalizeSteamKey, validateSteamKey } from '@/lib/keys/encryption';

export const dynamic = 'force-dynamic';

type Ctx = { params: { gameId: string } };

export async function POST(req: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { key, type = 'BOTH' } = await req.json() as { key: string; type?: string };
  if (!validateSteamKey(key)) return NextResponse.json({ error: 'Invalid key format' }, { status: 400 });

  const normalized = normalizeSteamKey(key);
  const hash = hashKey(normalized);

  const exists = await prisma.game_keys.findUnique({ where: { keyHash: hash }, select: { id: true } });
  if (exists) return NextResponse.json({ error: 'Duplicate key' }, { status: 409 });

  const enc = encryptKey(normalized);
  const now = new Date();

  await prisma.game_keys.create({
    data: {
      id:           crypto.randomUUID(),
      gameId:       params.gameId,
      encryptedKey: enc.encryptedKey,
      keyIv:        enc.keyIv,
      keyTag:       enc.keyTag,
      keyHash:      hash,
      status:       'AVAILABLE',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      type:         type as any,
      createdAt:    now,
      updatedAt:    now,
    },
  });

  const [storeCount, dropCount] = await Promise.all([
    prisma.game_keys.count({ where: { gameId: params.gameId, status: 'AVAILABLE', type: { in: ['STORE', 'BOTH'] as never[] } } }),
    prisma.game_keys.count({ where: { gameId: params.gameId, status: 'AVAILABLE', type: { in: ['DROP',  'BOTH'] as never[] } } }),
  ]);
  await prisma.games.update({ where: { id: params.gameId }, data: { stockStore: storeCount, stockDrop: dropCount } });

  return NextResponse.json({ ok: true });
}
