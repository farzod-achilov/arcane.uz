import { NextResponse } from 'next/server';
import { getPriceSettings, upsertPriceSettings } from '@/lib/smartPricing/repository';
import { DEFAULT_PRICE_SETTINGS } from '@/lib/smartPricing/engine';
import { requireAdmin } from '@/lib/apiGuard';

export const dynamic = 'force-dynamic';

export async function GET() {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const data = await getPriceSettings();
    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const body = await req.json();

    const numericFields = [
      'globalMarkupPercent', 'cheapGamesThreshold', 'cheapGamesFixedMarkup',
      'expensiveGamesPercentMarkup', 'minimumProfitUsd',
      'aggressiveMarkupPercent', 'competitiveMarkupPercent', 'highProfitMarkupPercent',
    ] as const;

    for (const field of numericFields) {
      if (body[field] !== undefined && (typeof body[field] !== 'number' || body[field] < 0)) {
        return NextResponse.json(
          { success: false, error: `${field} must be a non-negative number` },
          { status: 400 },
        );
      }
    }

    const validStrategies = ['GLOBAL', 'AGGRESSIVE', 'COMPETITIVE', 'HIGH_PROFIT', 'MANUAL'];
    if (body.defaultStrategy !== undefined && !validStrategies.includes(body.defaultStrategy)) {
      return NextResponse.json(
        { success: false, error: 'Invalid defaultStrategy value' },
        { status: 400 },
      );
    }

    const data = await upsertPriceSettings(body);
    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

export async function PUT() {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const { id: _id, ...defaults } = DEFAULT_PRICE_SETTINGS;
    const data = await upsertPriceSettings(defaults);
    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
