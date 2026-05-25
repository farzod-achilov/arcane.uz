import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { encryptKey, hashKey, normalizeSteamKey, validateSteamKey } from '@/lib/keys/encryption';

const BATCH_SIZE = 100;

export interface BulkImportResult {
  imported:   number;
  duplicates: number;
  invalid:    number;
  total:      number;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      gameId: string;
      keys:   string[];
      type?:  'STORE' | 'DROP' | 'BOTH';
    };

    const { gameId, keys, type = 'BOTH' } = body;

    if (!gameId || !Array.isArray(keys) || keys.length === 0) {
      return NextResponse.json({ error: 'gameId and keys[] are required' }, { status: 400 });
    }

    const game = await prisma.games.findUnique({
      where:  { id: gameId },
      select: { id: true, title: true },
    });
    if (!game) {
      return NextResponse.json({ error: `Game not found: ${gameId}` }, { status: 404 });
    }

    const result: BulkImportResult = { imported: 0, duplicates: 0, invalid: 0, total: keys.length };

    // ── Separate valid from format-invalid ───────────────────────────────────
    const validKeys: string[] = [];
    for (const raw of keys) {
      if (validateSteamKey(raw)) {
        validKeys.push(normalizeSteamKey(raw));
      } else {
        result.invalid++;
      }
    }

    if (validKeys.length === 0) {
      return NextResponse.json({ success: true, ...result });
    }

    // ── Duplicate check against DB ────────────────────────────────────────────
    const incomingHashes = validKeys.map(hashKey);
    const existing = await prisma.game_keys.findMany({
      where:  { keyHash: { in: incomingHashes } },
      select: { keyHash: true },
    });
    const existingSet = new Set(existing.map(e => e.keyHash));

    // ── Build insert batch (deduplicate within CSV too) ───────────────────────
    const seenInBatch = new Set<string>();
    const now = new Date();

    const toInsert: Array<{
      id: string; gameId: string;
      encryptedKey: string; keyIv: string; keyTag: string; keyHash: string;
      status: 'AVAILABLE'; type: 'STORE' | 'DROP' | 'BOTH';
      createdAt: Date; updatedAt: Date;
    }> = [];

    for (const normalized of validKeys) {
      const hash = hashKey(normalized);
      if (existingSet.has(hash) || seenInBatch.has(hash)) {
        result.duplicates++;
        continue;
      }
      seenInBatch.add(hash);
      const enc = encryptKey(normalized);
      toInsert.push({
        id:           crypto.randomUUID(),
        gameId,
        encryptedKey: enc.encryptedKey,
        keyIv:        enc.keyIv,
        keyTag:       enc.keyTag,
        keyHash:      hash,
        status:       'AVAILABLE',
        type,
        createdAt:    now,
        updatedAt:    now,
      });
    }

    // ── Bulk insert in chunks of 100 ──────────────────────────────────────────
    for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await prisma.game_keys.createMany({ data: toInsert.slice(i, i + BATCH_SIZE) as any[], skipDuplicates: true });
    }

    result.imported = toInsert.length;

    // ── Recalculate stock counters ────────────────────────────────────────────
    if (result.imported > 0) {
      const [storeCount, dropCount] = await Promise.all([
        prisma.game_keys.count({
          where: { gameId, status: 'AVAILABLE', type: { in: ['STORE', 'BOTH'] as never[] } },
        }),
        prisma.game_keys.count({
          where: { gameId, status: 'AVAILABLE', type: { in: ['DROP', 'BOTH'] as never[] } },
        }),
      ]);

      await prisma.games.update({
        where: { id: gameId },
        data:  { stockStore: storeCount, stockDrop: dropCount },
      });
    }

    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[bulk-import]', msg);

    if (msg.includes('KEY_ENCRYPTION_SECRET')) {
      return NextResponse.json(
        { error: 'KEY_ENCRYPTION_SECRET is not configured. Add a 64-char hex string to .env.local.' },
        { status: 500 },
      );
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
