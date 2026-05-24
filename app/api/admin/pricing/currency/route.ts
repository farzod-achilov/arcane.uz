import { NextResponse } from 'next/server';
import { getCurrencySettings, upsertCurrencySettings } from '@/lib/smartPricing/repository';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [current, history] = await Promise.all([
      getCurrencySettings(),
      prisma.exchange_rates.findMany({
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
    ]);
    return NextResponse.json({ success: true, data: current, history });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json() as { exchangeRate?: number; autoUpdateRate?: boolean };

    if (body.exchangeRate !== undefined) {
      if (typeof body.exchangeRate !== 'number' || body.exchangeRate <= 0) {
        return NextResponse.json(
          { success: false, error: 'exchangeRate must be a positive number' },
          { status: 400 },
        );
      }
    }

    const data = await upsertCurrencySettings(body);
    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
