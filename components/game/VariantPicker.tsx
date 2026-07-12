'use client';

import { formatPrice } from '@/lib/utils';

export interface VariantOption {
  id:       string;
  label:    string;
  priceUzs: number;
}

interface VariantPickerProps {
  variants:   VariantOption[];
  selectedId: string | undefined;
  onSelect:   (id: string) => void;
}

// Radio-style picker for a game's purchase variants (e.g. "Ключ" vs
// "Аккаунт") — shown on the product page only when a game has ≥1 active
// game_variants row. Selecting a variant changes the price shown and what
// gets added to cart/checked out.
export default function VariantPicker({ variants, selectedId, onSelect }: VariantPickerProps) {
  if (variants.length === 0) return null;

  return (
    <div className="mb-5">
      <p className="font-body mb-2" style={{ fontSize: '12px', color: '#6B7280', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        Вариант покупки
      </p>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(variants.length, 3)}, 1fr)` }}>
        {variants.map(v => {
          const active = v.id === selectedId;
          return (
            <button
              key={v.id}
              onClick={() => onSelect(v.id)}
              className="rounded-xl px-3 py-2.5 text-left transition-all"
              style={{
                background: active ? 'rgba(124,58,237,0.14)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${active ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.08)'}`,
              }}
            >
              <p className="font-heading font-semibold" style={{ fontSize: '13px', color: active ? '#C4B5FD' : '#E5E7EB' }}>
                {v.label}
              </p>
              <p className="font-body" style={{ fontSize: '12.5px', color: active ? '#A78BFA' : '#6B7280' }}>
                {formatPrice(v.priceUzs)}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
