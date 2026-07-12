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

// Steam Gift deliveries come back as a claim link (e.g.
// store.steampowered.com/account/ackgift/...), not an alphanumeric code —
// confirmed live 2026-07-12. Delivered-key UIs use this to switch the
// instruction/button from "copy the code" to "open the link".
export function isDeliveredValueLink(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}
