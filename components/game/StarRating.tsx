'use client';

import { Star } from 'lucide-react';

interface Props {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
  readonly?: boolean;
}

export default function StarRating({ value, onChange, size = 20, readonly = false }: Props) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(n)}
          className={readonly ? 'cursor-default' : 'transition-transform hover:scale-110'}
        >
          <Star
            style={{ width: size, height: size }}
            className={n <= value ? 'text-[#F59E0B] fill-[#F59E0B]' : 'text-[#374151]'}
          />
        </button>
      ))}
    </div>
  );
}
