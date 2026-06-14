import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/apiGuard';

export const dynamic = 'force-dynamic';

export interface PriceSettings {
  globalMarkupPercent:       number;
  cheapGameThreshold:        number;
  fixedMarkupForCheap:       number;
  expensiveGamePercentMarkup: number;
  autoRoundEnabled:          boolean;
  roundType:                 '.99' | '.49' | 'integer';
  minimumProfitUsd:          number;
  autoUpdateEnabled:         boolean;
}

const DEFAULT_SETTINGS: PriceSettings = {
  globalMarkupPercent:        5,
  cheapGameThreshold:         20,
  fixedMarkupForCheap:        2,
  expensiveGamePercentMarkup: 10,
  autoRoundEnabled:           true,
  roundType:                  '.99',
  minimumProfitUsd:           1,
  autoUpdateEnabled:          true,
};

// In-memory store (replace with DB in production)
let settings: PriceSettings = { ...DEFAULT_SETTINGS };

export async function GET() {
  const guard = await requireAdmin();
  if (guard) return guard;

  return NextResponse.json({ success: true, data: settings });
}

export async function PATCH(request: Request) {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const body = await request.json() as Partial<PriceSettings>;

    // Validate
    if (body.globalMarkupPercent !== undefined && body.globalMarkupPercent < 0) {
      return NextResponse.json({ success: false, error: 'globalMarkupPercent must be >= 0' }, { status: 400 });
    }
    if (body.cheapGameThreshold !== undefined && body.cheapGameThreshold <= 0) {
      return NextResponse.json({ success: false, error: 'cheapGameThreshold must be > 0' }, { status: 400 });
    }
    if (body.fixedMarkupForCheap !== undefined && body.fixedMarkupForCheap < 0) {
      return NextResponse.json({ success: false, error: 'fixedMarkupForCheap must be >= 0' }, { status: 400 });
    }
    if (body.minimumProfitUsd !== undefined && body.minimumProfitUsd < 0) {
      return NextResponse.json({ success: false, error: 'minimumProfitUsd must be >= 0' }, { status: 400 });
    }

    settings = { ...settings, ...body };
    return NextResponse.json({ success: true, data: settings });
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }
}

export async function PUT() {
  const guard = await requireAdmin();
  if (guard) return guard;

  settings = { ...DEFAULT_SETTINGS };
  return NextResponse.json({ success: true, data: settings });
}
