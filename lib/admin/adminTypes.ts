/* ── Admin data types ────────────────────────────────── */

export type OrderStatus = 'pending' | 'paid' | 'processing' | 'delivered' | 'completed' | 'refunded';
export type TicketStatus = 'open' | 'pending' | 'resolved';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type UserLevel = 'Rookie' | 'Player' | 'Elite' | 'Phantom' | 'Arcane';

export interface AdminOrder {
  id: string;
  productId: string;
  productTitle: string;
  productImage: string;
  userId: string;
  userName: string;
  userEmail: string;
  userTelegram?: string;
  platform: string;
  price: number;
  status: OrderStatus;
  paymentMethod: string;
  deliveryType: string;
  coinsEarned: number;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  level: UserLevel;
  xp: number;
  coins: number;
  telegram?: string;
  steamUsername?: string;
  totalOrders: number;
  totalSpent: number;
  joinDate: string;
  lastActive: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userTelegram?: string;
  subject: string;
  message: string;
  status: TicketStatus;
  priority: TicketPriority;
  orderNumber?: string;
  category: 'delivery' | 'payment' | 'activation' | 'refund' | 'coins' | 'other';
  createdAt: string;
  updatedAt: string;
}

export interface AdminProduct {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  category: string;
  platform: string[];
  price: number;
  originalPrice?: number;
  discount?: number;
  deliveryType: string;
  featured: boolean;
  preorder: boolean;
  inStock: boolean;
  badge?: string;
  totalSales: number;
  totalRevenue: number;
  rating: number;
}

export interface DiscountItem {
  id: string;
  productId: string;
  productTitle: string;
  originalPrice: number;
  discountPct: number;
  active: boolean;
  featured: boolean;
  startsAt?: string;
  endsAt?: string;
  type: 'flash' | 'scheduled' | 'seasonal';
}

export interface CaseItem {
  id: string;
  title: string;
  price: number;
  rarity: 'silver' | 'gold' | 'arcane';
  totalOpened: number;
  totalRevenue: number;
  rewards: string[];
  featured: boolean;
  dropChance: Record<string, number>;
}

export interface AnalyticsDay {
  date: string;
  revenue: number;
  orders: number;
  newUsers: number;
  coinsEarned: number;
}
