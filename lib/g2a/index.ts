/* Public API of the G2A integration layer — ⚠ UNVERIFIED, see lib/g2a/config.ts */
export {
  getProducts, getProduct, syncProducts, getLastSyncResult, purchaseKey, isG2aEnabled,
} from './g2aService';
export { usdToUzs, formatUzs } from './pricingMapper';
export { inferDeliveryType, inferCategory, inferPlatforms } from './deliveryMapper';
export { G2A_CONFIG } from './config';
export type { G2aNormalizedProduct, SyncResult, G2aPurchaseResult } from './types';
