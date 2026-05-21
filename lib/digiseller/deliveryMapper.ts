import type { DeliveryType } from '@/lib/types';
import type { DigiCategory } from './types';

/* ─────────────────────────────────────────────────────────
   Delivery type mapping
   Maps Digiseller category names / product name keywords
   → ARCANE DeliveryType
───────────────────────────────────────────────────────── */

/** Keywords in product name / category that hint at delivery type */
const DELIVERY_SIGNALS: Array<{ patterns: RegExp[]; type: DeliveryType }> = [
  {
    patterns: [/steam gift/i, /steam подарок/i, /gift steam/i],
    type: 'steam_gift',
  },
  {
    patterns: [/telegram/i, /tg активация/i, /телеграм/i],
    type: 'telegram_activation',
  },
  {
    patterns: [/offline/i, /оффлайн/i, /без интернета/i, /denuvo/i],
    type: 'offline_activation',
  },
  {
    patterns: [/ручная/i, /manual/i, /менеджер/i, /custom/i],
    type: 'manual_delivery',
  },
  {
    // Default for Steam/PC/console keys — instant delivery
    patterns: [/steam key/i, /steam ключ/i, /origin/i, /uplay/i, /epic/i, /xbox/i, /ps5/i, /playstation/i, /ключ/i, /key/i],
    type: 'instant',
  },
];

/**
 * Infer ARCANE delivery type from product name, description,
 * and Digiseller category list.
 */
export function inferDeliveryType(
  name: string,
  info: string,
  categories: DigiCategory[],
): DeliveryType {
  const haystack = [
    name,
    info.replace(/<[^>]+>/g, ' '), // strip HTML
    ...categories.map(c => c.name),
  ]
    .join(' ')
    .toLowerCase();

  for (const { patterns, type } of DELIVERY_SIGNALS) {
    if (patterns.some(p => p.test(haystack))) return type;
  }

  return 'instant'; // safe default
}

/** Map Digiseller product category name → ARCANE category slug */
const CATEGORY_MAP: Record<string, string> = {
  'action':        'action',
  'экшен':         'action',
  'rpg':           'rpg',
  'ролевая':       'rpg',
  'horror':        'horror',
  'хоррор':        'horror',
  'ужасы':         'horror',
  'multiplayer':   'multiplayer',
  'мультиплеер':   'multiplayer',
  'онлайн':        'multiplayer',
  'open world':    'open-world',
  'открытый мир':  'open-world',
  'indie':         'indie',
  'инди':          'indie',
  'sport':         'sport',
  'спорт':         'sport',
  'simulator':     'simulator',
  'симулятор':     'simulator',
  'strategy':      'strategy',
  'стратегия':     'strategy',
};

export function inferCategory(categories: DigiCategory[], name: string): string {
  for (const cat of categories) {
    const key = cat.name.toLowerCase();
    const mapped = CATEGORY_MAP[key];
    if (mapped) return mapped;
    // Partial match
    for (const [pattern, mapped2] of Object.entries(CATEGORY_MAP)) {
      if (key.includes(pattern)) return mapped2;
    }
  }
  // Fallback: try product name
  const nameLower = name.toLowerCase();
  for (const [pattern, mapped] of Object.entries(CATEGORY_MAP)) {
    if (nameLower.includes(pattern)) return mapped;
  }
  return 'action'; // default
}

/** Infer game platforms from product name */
export function inferPlatforms(name: string, info: string): string[] {
  const text = (name + ' ' + info).toLowerCase();
  const platforms: string[] = [];
  if (/\bsteam\b/.test(text) || /\bpc\b/.test(text))   platforms.push('Steam');
  if (/\bps5\b|\bplaystation 5\b/.test(text))           platforms.push('PS5');
  if (/\bps4\b|\bplaystation 4\b/.test(text))           platforms.push('PS4');
  if (/\bxbox\b/.test(text))                            platforms.push('Xbox');
  if (/\bepic\b|\bepic games\b/.test(text))             platforms.push('Epic');
  if (/\buplay\b|\bubisoft connect\b/.test(text))       platforms.push('Ubisoft');
  if (/\bea app\b|\borigin\b/.test(text))               platforms.push('EA App');
  return platforms.length ? platforms : ['PC'];
}
