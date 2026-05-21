/* ─────────────────────────────────────────────────────────
   ARCANE.UZ — Order management
   In-memory store for MVP. Replace with DB later.
───────────────────────────────────────────────────────── */

export type OrderStatus =
  | 'pending'    // waiting for payment confirmation
  | 'paid'       // payment received, waiting admin to buy key
  | 'processing' // admin bought key, preparing delivery
  | 'delivered'  // key sent to customer
  | 'cancelled';

export interface ArcaneOrder {
  id:            string;
  productId:     string;
  productTitle:  string;
  productImage:  string;
  platform:      string;
  price:         number;
  status:        OrderStatus;
  // Customer info
  customerName:  string;
  customerEmail: string;
  customerTelegram?: string;
  // Delivery
  deliveryType:  'manual_delivery';
  gameKey?:      string; // filled by admin before sending
  // Timestamps
  createdAt:     string;
  updatedAt:     string;
  paidAt?:       string;
  deliveredAt?:  string;
  // Source
  paymentMethod?: string;
  coinsEarned:   number;
}

/* ── In-memory store ─────────────────────────────────── */
const store = new Map<string, ArcaneOrder>();

function genId(): string {
  const ts  = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `ARC-${ts}${rnd}`;
}

export function createOrder(
  data: Omit<ArcaneOrder, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'coinsEarned'>,
): ArcaneOrder {
  const order: ArcaneOrder = {
    ...data,
    id:          genId(),
    status:      'paid',
    coinsEarned: Math.floor(data.price / 1000),
    createdAt:   new Date().toISOString(),
    updatedAt:   new Date().toISOString(),
    paidAt:      new Date().toISOString(),
  };
  store.set(order.id, order);
  return order;
}

export function getOrder(id: string): ArcaneOrder | null {
  return store.get(id) ?? null;
}

export function getAllOrders(): ArcaneOrder[] {
  return Array.from(store.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function updateOrder(id: string, patch: Partial<ArcaneOrder>): ArcaneOrder | null {
  const order = store.get(id);
  if (!order) return null;
  const updated = { ...order, ...patch, updatedAt: new Date().toISOString() };
  store.set(id, updated);
  return updated;
}

export function setGameKey(id: string, key: string): ArcaneOrder | null {
  return updateOrder(id, { gameKey: key, status: 'processing' });
}

export function markDelivered(id: string): ArcaneOrder | null {
  return updateOrder(id, { status: 'delivered', deliveredAt: new Date().toISOString() });
}
