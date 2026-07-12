import { TtlCache } from '@/lib/shared/ttlCache';

export const kinguinCache = new TtlCache();

export const CK = {
  productList: () => 'kinguin:products:list',
  product: (id: string) => `kinguin:product:${id}`,
  syncResult: () => 'kinguin:sync:last',
  /** De-dup marker so low-balance Telegram alerts don't fire on every check */
  lowBalanceAlertSent: () => 'kinguin:low-balance-alert-sent',
} as const;
