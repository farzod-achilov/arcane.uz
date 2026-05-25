import type { orders, order_items, games, users } from '@prisma/client';

// ── Domain types ──────────────────────────────────────────────────────────────

export type OrderStatus = 'PENDING' | 'PAID' | 'WAITING_MANUAL' | 'COMPLETED' | 'CANCELLED';

export interface OrderItem {
  id:          string;
  orderId:     string;
  gameId:      string;
  price:       number;
  keyValue:    string | null;
  deliveredAt: Date | null;
  createdAt:   Date;
  game?: Pick<games, 'id' | 'title' | 'slug' | 'cover'>;
}

export interface OrderDelivery {
  deliveredAt:  Date | null;
  deliveredBy:  string | null;
  deliveryNote: string | null;
}

// ── Delivery ──────────────────────────────────────────────────────────────────

export type DeliveryOutcome = 'completed' | 'waiting_stock' | 'partial';

export interface ItemDeliveryResult {
  itemId:    string;
  gameId:    string;
  gameTitle: string;
  delivered: boolean;
  keyValue?: string;
  reason?:   string;
}

export interface DeliveryResult {
  orderId:   string;
  outcome:   DeliveryOutcome;
  delivered: number;
  waiting:   number;
  items:     ItemDeliveryResult[];
}

export interface Order {
  id:           string;
  userId:       string;
  totalPrice:   number;
  status:       OrderStatus;
  deliveredAt:  Date | null;
  deliveredBy:  string | null;
  deliveryNote: string | null;
  createdAt:    Date;
  updatedAt:    Date;
  items?:       OrderItem[];
  user?:        Pick<users, 'id' | 'email' | 'username'>;
}

// ── Request / Response DTOs ────────────────────────────────────────────────────

export interface CreateOrderItemDto {
  gameId: string;
  quantity?: number;
}

export interface CreateOrderDto {
  userId: string;
  items: CreateOrderItemDto[];
}

export interface OrderFilters {
  userId?: string;
  status?: OrderStatus;
  limit?: number;
  offset?: number;
}

export interface OrderResponse {
  order: Order;
}

export interface OrderListResponse {
  orders: Order[];
  total: number;
}

// ── Errors ────────────────────────────────────────────────────────────────────

export class OrderError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 400,
  ) {
    super(message);
    this.name = 'OrderError';
  }
}

// ── Raw Prisma → domain mappers ───────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapOrder(raw: any): Order {
  return {
    id:           raw.id,
    userId:       raw.userId,
    totalPrice:   raw.totalPrice,
    status:       raw.status as OrderStatus,
    deliveredAt:  raw.deliveredAt  ?? null,
    deliveredBy:  raw.deliveredBy  ?? null,
    deliveryNote: raw.deliveryNote ?? null,
    createdAt:    raw.createdAt,
    updatedAt:    raw.updatedAt,
    items: raw.items?.map((it: any) => ({
      id:        it.id,
      orderId:   it.orderId,
      gameId:    it.gameId,
      price:     it.price,
      keyValue:    it.keyValue   ?? null,
      deliveredAt: it.deliveredAt ?? null,
      createdAt:   it.createdAt,
      game: it.game ? {
        id:    it.game.id,
        title: it.game.title,
        slug:  it.game.slug,
        cover: it.game.cover ?? null,
      } : undefined,
    })),
    user: raw.user ? {
      id:       raw.user.id,
      email:    raw.user.email,
      username: raw.user.username,
    } : undefined,
  };
}
