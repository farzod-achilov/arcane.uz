import { usdToUzs as sharedUsdToUzs, formatUzs } from '@/lib/shared/currency';

export function usdToUzs(usd: number): number {
  return sharedUsdToUzs(usd);
}

export { formatUzs };
