import { NextResponse } from 'next/server';
import { PriceEngineService } from '@/lib/smartPricing/engine';
import { getPriceSettings, getCurrencySettings } from '@/lib/smartPricing/repository';
import type { PreviewRequest } from '@/lib/smartPricing/types';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json() as PreviewRequest;

    if (typeof body.supplierPriceUsd !== 'number' || body.supplierPriceUsd <= 0) {
      return NextResponse.json(
        { success: false, error: 'supplierPriceUsd must be > 0' },
        { status: 400 },
      );
    }

    const [settings, currency] = await Promise.all([
      getPriceSettings(),
      getCurrencySettings(),
    ]);

    const engine = new PriceEngineService(settings, currency);
    const result = engine.previewPrice(body);

    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
