'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Tag, ToggleLeft, ToggleRight, Calendar, Flame, Clock, TrendingDown } from 'lucide-react';
import { ADMIN_DISCOUNTS } from '@/lib/admin/mockAdminData';
import { formatPrice } from '@/lib/utils';
import type { DiscountItem } from '@/lib/admin/adminTypes';

const TYPE_CFG = {
  flash:     { label: 'Flash Sale', color: '#EF4444', icon: Flame  },
  scheduled: { label: 'Плановая',   color: '#7C3AED', icon: Calendar },
  seasonal:  { label: 'Сезонная',   color: '#F59E0B', icon: Clock  },
};

export default function AdminDiscountsPage() {
  const [discounts, setDiscounts] = useState<DiscountItem[]>(ADMIN_DISCOUNTS);

  const toggle = (id: string, field: 'active' | 'featured') =>
    setDiscounts(prev => prev.map(d => d.id === id ? { ...d, [field]: !d[field] } : d));

  const setDiscountPct = (id: string, pct: number) =>
    setDiscounts(prev => prev.map(d => d.id === id ? { ...d, discountPct: pct } : d));

  const activeCount   = discounts.filter(d => d.active).length;
  const totalSavings  = discounts.filter(d => d.active).reduce((s, d) => s + (d.originalPrice * d.discountPct / 100), 0);

  return (
    <div className="p-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <p className="font-pixel mb-1" style={{ fontSize: '8px', color: '#EF4444', letterSpacing: '0.14em' }}>УПРАВЛЕНИЕ</p>
        <h1 className="font-heading font-bold text-white" style={{ fontSize: '22px' }}>Скидки & Акции</h1>
        <p className="font-body text-[#4B5563]" style={{ fontSize: '12px' }}>
          {activeCount} активных скидок · Общая экономия покупателей: {formatPrice(totalSavings)}
        </p>
      </motion.div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Flash Sale',   count: discounts.filter(d => d.type === 'flash').length,     color: '#EF4444', icon: Flame    },
          { label: 'Плановые',     count: discounts.filter(d => d.type === 'scheduled').length, color: '#7C3AED', icon: Calendar },
          { label: 'Сезонные',     count: discounts.filter(d => d.type === 'seasonal').length,  color: '#F59E0B', icon: Clock    },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="rounded-2xl p-4"
            style={{ background: '#0D0D1A', border: `1px solid ${s.color}18` }}
          >
            <s.icon style={{ width: '14px', height: '14px', color: s.color, marginBottom: '8px' }} />
            <p className="font-pixel text-white mb-0.5" style={{ fontSize: '18px', color: s.color }}>{s.count}</p>
            <p className="font-body text-[#4B5563]" style={{ fontSize: '11px' }}>{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Discounts table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl overflow-hidden"
        style={{ background: '#0D0D1A', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                {['Продукт', 'Тип', 'Скидка', 'Цена до/после', 'Период', 'Активна', 'Featured', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-body text-[#374151] whitespace-nowrap"
                      style={{ fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {discounts.map((d, i) => {
                const tc = TYPE_CFG[d.type];
                return (
                  <motion.tr
                    key={d.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.05 }}
                    className="hover:bg-white/[0.015] transition-colors"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                  >
                    <td className="px-4 py-3">
                      <p className="font-body text-white" style={{ fontSize: '13px' }}>{d.productTitle}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1"
                           style={{ background: `${tc.color}10`, border: `1px solid ${tc.color}25` }}>
                        <tc.icon style={{ width: '10px', height: '10px', color: tc.color }} />
                        <span className="font-body" style={{ fontSize: '10.5px', color: tc.color }}>{tc.label}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={d.discountPct}
                          onChange={e => setDiscountPct(d.id, +e.target.value)}
                          className="bg-[#09090E] border border-[#EF4444]/30 rounded-lg px-2 py-1 text-white font-heading font-bold outline-none w-14 text-center"
                          style={{ fontSize: '13px' }}
                          min={1} max={99}
                        />
                        <span className="font-body text-[#EF4444]" style={{ fontSize: '12px' }}>%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-body text-[#374151] line-through" style={{ fontSize: '11px' }}>
                          {formatPrice(d.originalPrice)}
                        </p>
                        <p className="font-heading font-semibold text-[#22C55E]" style={{ fontSize: '13px' }}>
                          {formatPrice(Math.round(d.originalPrice * (1 - d.discountPct / 100)))}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {d.startsAt && d.endsAt ? (
                        <div>
                          <p className="font-body text-[#6B7280]" style={{ fontSize: '10.5px' }}>{d.startsAt}</p>
                          <p className="font-body text-[#374151]" style={{ fontSize: '10.5px' }}>→ {d.endsAt}</p>
                        </div>
                      ) : (
                        <span className="font-body text-[#1F2937]" style={{ fontSize: '11px' }}>—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggle(d.id, 'active')}>
                        {d.active
                          ? <div className="w-9 h-5 rounded-full relative" style={{ background: 'linear-gradient(90deg, #7C3AED, #06B6D4)' }}>
                              <div className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-white" />
                            </div>
                          : <div className="w-9 h-5 rounded-full relative" style={{ background: '#1A1A28', border: '1px solid rgba(255,255,255,0.1)' }}>
                              <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-[#374151]" />
                            </div>}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggle(d.id, 'featured')}>
                        <TrendingDown style={{ width: '15px', height: '15px', color: d.featured ? '#EF4444' : '#1F2937' }} />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        className="font-body text-[#7C3AED] hover:text-[#9D60FA] transition-colors whitespace-nowrap"
                        style={{ fontSize: '11.5px' }}
                      >
                        Изменить
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
