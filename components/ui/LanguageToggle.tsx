'use client';

import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { Globe, Check } from 'lucide-react';
import { useI18n } from '@/lib/locale/client';
import { locales, localeNames, LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE, type Locale } from '@/lib/locale/config';

export default function LanguageToggle() {
  const { locale } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  function choose(next: Locale) {
    setOpen(false);
    if (next === locale) return;
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax`;
    // Re-render server components with the new locale (no full reload, no flash).
    router.refresh();
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        aria-label="Язык / Til"
        className="group flex items-center gap-1.5 p-2.5 rounded-xl transition-all duration-200"
        style={{ color: '#6B7280' }}
      >
        <Globe className="w-[18px] h-[18px] group-hover:text-[#9D60FA] transition-colors" />
        <span className="font-heading font-semibold uppercase" style={{ fontSize: '11px' }}>
          {locale}
        </span>
      </button>

      {open && (
        <div
          className="absolute right-0 top-[calc(100%+6px)] z-50 rounded-xl overflow-hidden min-w-[140px]"
          style={{
            background:     '#0C0C18',
            border:         '1px solid rgba(124,58,237,0.25)',
            boxShadow:      '0 16px 40px rgba(0,0,0,0.7)',
            backdropFilter: 'blur(20px)',
          }}
        >
          {locales.map(l => (
            <button
              key={l}
              onClick={() => choose(l)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 transition-colors hover:bg-white/[0.04]"
              style={{ color: l === locale ? '#fff' : '#9CA3AF' }}
            >
              <span className="font-body" style={{ fontSize: '13px' }}>{localeNames[l]}</span>
              {l === locale && <Check className="w-3.5 h-3.5" style={{ color: '#9D60FA' }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
