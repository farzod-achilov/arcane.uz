'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import SingleAddFlow from './SingleAddFlow';
import BulkAddFlow from './BulkAddFlow';

export default function AddDropshipGamePage() {
  const [mode, setMode] = useState<'single' | 'bulk'>('single');

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
        <button onClick={() => setMode('single')}
          className="flex-1 rounded-xl py-2.5 font-heading font-semibold text-sm transition-all"
          style={{
            background: mode === 'single' ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${mode === 'single' ? 'rgba(124,58,237,0.45)' : 'rgba(255,255,255,0.07)'}`,
            color: mode === 'single' ? '#A78BFA' : '#6B7280',
          }}>
          Один товар
        </button>
        <button onClick={() => setMode('bulk')}
          className="flex-1 rounded-xl py-2.5 font-heading font-semibold text-sm transition-all"
          style={{
            background: mode === 'bulk' ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${mode === 'bulk' ? 'rgba(124,58,237,0.45)' : 'rgba(255,255,255,0.07)'}`,
            color: mode === 'bulk' ? '#A78BFA' : '#6B7280',
          }}>
          Пакетное добавление
        </button>
      </div>

      {mode === 'single' ? <SingleAddFlow /> : <BulkAddFlow />}
    </div>
  );
}
