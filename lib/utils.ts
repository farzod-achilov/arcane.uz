import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatPrice(price: number): string {
  // Manual formatter — avoids SSR/client Intl.NumberFormat locale mismatch
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' сум';
}

export function formatRating(rating: number): string {
  return rating.toFixed(1);
}
