import { TtlCache } from '@/lib/shared/ttlCache';

export const kinguinCache = new TtlCache();

export const CK = {
  productList: () => 'kinguin:products:list',
  product: (id: string) => `kinguin:product:${id}`,
  syncResult: () => 'kinguin:sync:last',
} as const;
