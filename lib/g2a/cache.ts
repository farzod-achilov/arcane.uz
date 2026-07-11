import { TtlCache } from '@/lib/shared/ttlCache';

export const g2aCache = new TtlCache();

export const CK = {
  productList: () => 'g2a:products:list',
  product: (id: string) => `g2a:product:${id}`,
  syncResult: () => 'g2a:sync:last',
} as const;
