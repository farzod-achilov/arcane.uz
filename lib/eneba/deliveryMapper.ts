import type { DeliveryType } from '@/lib/types';

/* ─────────────────────────────────────────────────────────
   Delivery type mapping — Eneba's catalog search doesn't expose
   an explicit delivery-method field, so infer from title/platform
   text, same approach as lib/digiseller/deliveryMapper.ts.
───────────────────────────────────────────────────────── */

const DELIVERY_SIGNALS: Array<{ patterns: RegExp[]; type: DeliveryType }> = [
  { patterns: [/steam gift/i, /gift/i], type: 'steam_gift' },
  { patterns: [/offline/i, /denuvo/i], type: 'offline_activation' },
  { patterns: [/steam key/i, /origin/i, /uplay/i, /epic/i, /xbox/i, /ps5/i, /playstation/i, /key/i], type: 'instant' },
];

export function inferDeliveryType(title: string, platform: string): DeliveryType {
  const haystack = `${title} ${platform}`.toLowerCase();
  for (const { patterns, type } of DELIVERY_SIGNALS) {
    if (patterns.some(p => p.test(haystack))) return type;
  }
  return 'instant';
}

const CATEGORY_MAP: Record<string, string> = {
  action: 'action', rpg: 'rpg', horror: 'horror', multiplayer: 'multiplayer',
  'open world': 'open-world', indie: 'indie', sport: 'sport',
  simulator: 'simulator', strategy: 'strategy',
};

export function inferCategory(title: string): string {
  const lower = title.toLowerCase();
  for (const [pattern, mapped] of Object.entries(CATEGORY_MAP)) {
    if (lower.includes(pattern)) return mapped;
  }
  return 'action';
}

export function inferPlatforms(platform: string, title: string): string[] {
  const text = `${platform} ${title}`.toLowerCase();
  const platforms: string[] = [];
  if (/steam|\bpc\b/.test(text)) platforms.push('Steam');
  if (/ps5/.test(text)) platforms.push('PS5');
  if (/ps4/.test(text)) platforms.push('PS4');
  if (/xbox/.test(text)) platforms.push('Xbox');
  if (/epic/.test(text)) platforms.push('Epic');
  if (/uplay|ubisoft/.test(text)) platforms.push('Ubisoft');
  if (/origin|ea app/.test(text)) platforms.push('EA App');
  return platforms.length ? platforms : ['PC'];
}
