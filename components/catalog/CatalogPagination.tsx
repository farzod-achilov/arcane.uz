'use client';

import Link from 'next/link';
import { useSearchParams, usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props { page: number; pages: number; total: number }

export default function CatalogPagination({ page, pages, total }: Props) {
  const pathname = usePathname();
  const sp       = useSearchParams();

  const buildPage = (p: number) => {
    const params = new URLSearchParams(sp.toString());
    if (p === 1) params.delete('page'); else params.set('page', String(p));
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  // Build visible page numbers: always show first, last, current ±1
  const range: (number | '…')[] = [];
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || Math.abs(i - page) <= 1) {
      range.push(i);
    } else if (range[range.length - 1] !== '…') {
      range.push('…');
    }
  }

  if (pages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-10">
      {/* Prev */}
      {page > 1 ? (
        <Link href={buildPage(page - 1)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-body text-sm text-white transition-all duration-150"
              style={{ background: '#12121A', border: '1px solid rgba(255,255,255,0.07)' }}>
          <ChevronLeft className="w-4 h-4" />
          Назад
        </Link>
      ) : (
        <span className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-body text-sm text-[#4B5563] cursor-not-allowed"
              style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.04)' }}>
          <ChevronLeft className="w-4 h-4" />
          Назад
        </span>
      )}

      {/* Page numbers */}
      <div className="flex items-center gap-1">
        {range.map((r, i) =>
          r === '…' ? (
            <span key={`ell-${i}`} className="px-2 text-[#4B5563] font-body text-sm">…</span>
          ) : (
            <Link key={r} href={buildPage(r)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center font-heading font-semibold text-sm transition-all duration-150"
                  style={{
                    background: r === page ? '#7C3AED' : '#12121A',
                    color:      r === page ? '#fff'    : '#6B7280',
                    border:     r === page ? '1px solid #9D60FA' : '1px solid rgba(255,255,255,0.07)',
                    boxShadow:  r === page ? '0 0 12px rgba(124,58,237,0.4)' : 'none',
                  }}>
              {r}
            </Link>
          )
        )}
      </div>

      {/* Next */}
      {page < pages ? (
        <Link href={buildPage(page + 1)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-body text-sm text-white transition-all duration-150"
              style={{ background: '#12121A', border: '1px solid rgba(255,255,255,0.07)' }}>
          Вперёд
          <ChevronRight className="w-4 h-4" />
        </Link>
      ) : (
        <span className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-body text-sm text-[#4B5563] cursor-not-allowed"
              style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.04)' }}>
          Вперёд
          <ChevronRight className="w-4 h-4" />
        </span>
      )}

      <span className="hidden sm:block font-body text-[#4B5563] text-sm ml-2">
        Страница {page} из {pages} · {total} игр
      </span>
    </div>
  );
}
