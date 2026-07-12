'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import SingleAddFlow from './SingleAddFlow';
import BulkAddFlow from './BulkAddFlow';
import AttachVariantFlow from './AttachVariantFlow';

type Mode = 'single' | 'bulk' | 'variant';

export default function AddDropshipGamePage() {
  const [mode, setMode] = useState<Mode>('single');

  const TABS: Array<{ id: Mode; label: string }> = [
    { id: 'single',  label: 'Один товар' },
    { id: 'bulk',    label: 'Пакетное добавление' },
    { id: 'variant', label: 'Вариант к игре' },
  ];

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/suppliers"
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <ChevronLeft style={{ width: '16px', height: '16px', color: '#9CA3AF' }} />
        </Link>
        <div>
          <h1 className="font-heading font-bold text-white" style={{ fontSize: '20px' }}>
            Добавить dropship-игру
          </h1>
          <p className="font-body text-[#6B7280]" style={{ fontSize: '13px' }}>
            Поиск на Kinguin → цена закупки → цена продажи с наценкой
          </p>
        </div>
      </div>

      <div className="flex gap-2 mb-5">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setMode(tab.id)}
            className="flex-1 rounded-xl py-2.5 font-heading font-semibold text-sm transition-all"
            style={{
              background: mode === tab.id ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${mode === tab.id ? 'rgba(124,58,237,0.45)' : 'rgba(255,255,255,0.07)'}`,
              color: mode === tab.id ? '#A78BFA' : '#6B7280',
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {mode === 'single' && <SingleAddFlow />}
      {mode === 'bulk' && <BulkAddFlow />}
      {mode === 'variant' && <AttachVariantFlow />}
    </div>
  );
}
