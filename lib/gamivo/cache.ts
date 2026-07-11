import { TtlCache } from '@/lib/shared/ttlCache';

export const gamivoCache = new TtlCache();

export const CK = {
  productList: () => 'gamivo:products:list',
  product: (id: string) => `gamivo:product:${id}`,
  syncResult: () => 'gamivo:sync:last',
} as const;
