export type DeliveryType =
  | 'instant'
  | 'steam_gift'
  | 'telegram_activation'
  | 'offline_activation'
  | 'manual_delivery';

/* ── System requirements ─────────────────────────────── */
export interface RequirementSpec {
  os: string;
  cpu: string;
  gpu: string;
  ram: string;
  storage: string;
  directx?: string;
  notes?: string;
}

export interface SystemRequirementsData {
  minimum: RequirementSpec;
  recommended: RequirementSpec;
}

/* ── Game editions ───────────────────────────────────── */
export interface GameEdition {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  isRecommended?: boolean;
  isCurrentEdition?: boolean;
  includes: string[];
  badge?: string;
  color?: string;
}

/* ── Product-specific reviews ────────────────────────── */
export interface ProductReview {
  id: string;
  author: string;
  avatar: string;
  rating: number;
  text: string;
  date: string;
  verified: boolean;
  playtime?: string;
  helpful?: number;
  platform?: string;
}

/* ── FAQ ────────────────────────────────────────────── */
export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

/* ── Main Product interface ──────────────────────────── */
export interface Product {
  id: string;
  title: string;
  subtitle: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  image: string;
  screenshots?: string[];
  category: string;
  platform: string[];
  rating: number;
  reviews: number;
  badge?: 'hot' | 'new' | 'sale' | 'exclusive' | 'preorder';
  inStock: boolean;
  description: string;
  features: string[];
  tags: string[];
  featured?: boolean;
  preorder?: boolean;
  releaseDate?: string;
  developer?: string;
  /* ── Delivery metadata ── */
  deliveryType: DeliveryType;
  deliveryTime?: string;
  deliveryDescription?: string;
  /* ── Extended product metadata ── */
  publisher?: string;
  genres?: string[];
  region?: string;
  multiplayer?: boolean;
  singleplayer?: boolean;
  controllerSupport?: boolean;
  /* ── Rich content sections ── */
  requirements?: SystemRequirementsData;
  editions?: GameEdition[];
  productReviews?: ProductReview[];
  faq?: FaqItem[];
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  count: number;
  color: string;
}

export interface Review {
  id: string;
  author: string;
  avatar: string;
  rating: number;
  text: string;
  date: string;
  verified: boolean;
  productName: string;
}

export interface MysteryCase {
  id: string;
  title: string;
  price: number;
  image: string;
  items: string[];
  color: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
