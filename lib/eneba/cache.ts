import { TtlCache } from '@/lib/shared/ttlCache';

// Singleton — module-level, survives across requests in the same process
export const enebaCache = new TtlCache();

export const CK = {
  token: () => 'eneba:token',
  productList: () => 'eneba:products:list',
  product: (id: string) => `eneba:product:${id}`,
  syncResult: () => 'eneba:sync:last',
} as const;
