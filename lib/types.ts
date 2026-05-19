export interface Product {
  id: string;
  title: string;
  subtitle: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  image: string;
  category: string;
  platform: string[];
  rating: number;
  reviews: number;
  badge?: 'hot' | 'new' | 'sale' | 'exclusive';
  inStock: boolean;
  description: string;
  features: string[];
  tags: string[];
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
