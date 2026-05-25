import type { orders, order_items, games, users } from '@prisma/client';

// ── Domain types ──────────────────────────────────────────────────────────────

export type OrderStatus = 'PENDING' | 'PAID' | 'COMPLETED' | 'CANCELLED';

export interface OrderItem {
  id: string;
  orderId: string;
  gameId: string;
  price: number;
  keyValue: string | null;
  createdAt: Date;
  game?: Pick<games, 'id' | 'title' | 'slug' | 'cover'>;
}

export interface Order {
  id: string;
  userId: string;
  totalPrice: number;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
  items?: OrderItem[];
  user?: Pick<users, 'id' | 'email' | 'username'>;
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

type RawOrder = orders & {
  items?: (order_items & { game?: games | null })[];
  user?: users | null;
};

export function mapOrder(raw: RawOrder): Order {
  return {
    id:         raw.id,
    userId:     raw.userId,
    totalPrice: raw.totalPrice,
    status:     raw.status as OrderStatus,
    createdAt:  raw.createdAt,
    updatedAt:  raw.updatedAt,
    items: raw.items?.map(it => ({
      id:       it.id,
      orderId:  it.orderId,
      gameId:   it.gameId,
      price:    it.price,
      keyValue: it.keyValue,
      createdAt: it.createdAt,
      game: it.game ? {
        id:    it.game.id,
        title: it.game.title,
        slug:  it.game.slug,
        cover: it.game.cover,
      } : undefined,
    })),
    user: raw.user ? {
      id:       raw.user.id,
      email:    raw.user.email,
      username: raw.user.username,
    } : undefined,
  };
}
