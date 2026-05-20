'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
  Search, Plus, Star, Zap, Check, X, Eye, EyeOff,
  ChevronDown, Filter, ToggleLeft, ToggleRight, Edit2,
} from 'lucide-react';
import { ADMIN_PRODUCTS } from '@/lib/admin/mockAdminData';
import { formatPrice } from '@/lib/utils';
import type { AdminProduct } from '@/lib/admin/adminTypes';

const DELIVERY_COLORS: Record<string, string> = {
  instant:            '#22C55E',
  steam_gift:         '#66C0F4',
  telegram_activation:'#06B6D4',
  offline_activation: '#F59E0B',
  manual_delivery:    '#9D60FA',
};
const DELIVERY_LABELS: Record<string, string> = {
  instant:            'Instant',
  steam_gift:         'Steam Gift',
  telegram_activation:'Telegram',
  offline_activation: 'Offline',
  manual_delivery:    'Manual',
};

export default function AdminProductsPage() {
  const [search, setSearch]         = useState('');
  const [filterCat, setFilterCat]   = useState('all');
  const [products, setProducts]     = useState<AdminProduct[]>(ADMIN_PRODUCTS);
  const [editId, setEditId]         = useState<string | null>(null);
  const [editForm, setEditForm]     = useState<Partial<AdminProduct>>({});

  const categories = ['all', ...Array.from(new Set(ADMIN_PRODUCTS.map(p => p.category)))];

  const filtered = useMemo(() => {
    let list = products;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    }
    if (filterCat !== 'all') list = list.filter(p => p.category === filterCat);
    return list;
  }, [products, search, filterCat]);

  const toggleFeatured = (id: string) =>
    setProducts(prev => prev.map(p => p.id === id ? { ...p, featured: !p.featured } : p));

  const toggleStock = (id: string) =>
    setProducts(prev => prev.map(p => p.id === id ? { ...p, inStock: !p.inStock } : p));

  const startEdit = (p: AdminProduct) => {
    setEditId(p.id);
    setEditForm({ title: p.title, price: p.price, discount: p.discount ?? 0, deliveryType: p.deliveryType });
  };

  const saveEdit = () => {
    if (!editId) return;
    setProducts(prev => prev.map(p => p.id === editId ? { ...p, ...editForm } : p));
    setEditId(null);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6"
      >
        <div>
          <p className="font-pixel mb-1" style={{ fontSize: '8px', color: '#06B6D4', letterSpacing: '0.14em' }}>УПРАВЛЕНИЕ</p>
          <h1 className="font-heading font-bold text-white" style={{ fontSize: '22px' }}>Продукты</h1>
          <p className="font-body text-[#4B5563]" style={{ fontSize: '12px' }}>{products.length} товаров в каталоге</p>
        </div>
        <button
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 font-heading font-semibold text-white transition-all"
          style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', fontSize: '13px', boxShadow: '0 0 16px rgba(124,58,237,0.3)' }}
        >
          <Plus style={{ width: '14px', height: '14px' }} />
          Добавить продукт
        </button>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap gap-3 mb-5"
      >
        {/* Search */}
        <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 flex-1 min-w-48"
             style={{ background: '#0D0D1A', border: '1px solid rgba(255,255,255,0.07)' }}>
          <Search style={{ width: '14px', height: '14px', color: '#374151', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Поиск продуктов..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent outline-none text-white font-body flex-1 placeholder:text-[#1F2937]"
            style={{ fontSize: '13px' }}
          />
          {search && <button onClick={() => setSearch('')}><X style={{ width: '12px', height: '12px', color: '#374151' }} /></button>}
        </div>

        {/* Category filter */}
        <div className="flex items-center gap-2 rounded-xl px-3 py-2.5"
             style={{ background: '#0D0D1A', border: '1px solid rgba(255,255,255,0.07)' }}>
          <Filter style={{ width: '13px', height: '13px', color: '#374151' }} />
          <select
            value={filterCat}
            onChange={e => setFilterCat(e.target.value)}
            className="bg-transparent outline-none font-body text-[#9CA3AF] cursor-pointer"
            style={{ fontSize: '13px' }}
          >
            <option value="all">Все категории</option>
            {categories.slice(1).map(c => (
              <option key={c} value={c} style={{ background: '#0D0D1A' }}>{c}</option>
            ))}
          </select>
          <ChevronDown style={{ width: '12px', height: '12px', color: '#374151' }} />
        </div>

        <div className="flex items-center gap-2 rounded-xl px-3 py-2 ml-auto"
             style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)' }}>
          <span className="font-body text-[#9D60FA]" style={{ fontSize: '12px' }}>Найдено: {filtered.length}</span>
        </div>
      </motion.div>

      {/* Products Table */}
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
                {['Продукт', 'Категория', 'Платформы', 'Цена', 'Скидка', 'Доставка', 'Рейтинг', 'Продажи', 'Статус', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-body text-[#374151] whitespace-nowrap" style={{ fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.map((product, i) => {
                  const isEditing = editId === product.id;
                  return (
                    <motion.tr
                      key={product.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: i * 0.04 }}
                      className="group"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                    >
                      {/* Product */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-12 rounded-lg overflow-hidden flex-shrink-0">
                            <Image src={product.image} alt="" fill unoptimized className="object-cover" />
                          </div>
                          <div className="min-w-0">
                            {isEditing ? (
                              <input
                                value={editForm.title ?? ''}
                                onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                                className="bg-[#09090E] border border-[#7C3AED]/40 rounded-lg px-2 py-1 text-white font-body outline-none"
                                style={{ fontSize: '12px', width: '180px' }}
                              />
                            ) : (
                              <p className="font-body text-white line-clamp-1" style={{ fontSize: '13px' }}>{product.title}</p>
                            )}
                            <p className="font-body text-[#374151] truncate" style={{ fontSize: '10.5px' }}>{product.subtitle}</p>
                          </div>
                        </div>
                      </td>
                      {/* Category */}
                      <td className="px-4 py-3">
                        <span className="font-body text-[#6B7280] capitalize" style={{ fontSize: '12px' }}>{product.category}</span>
                      </td>
                      {/* Platforms */}
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {product.platform.slice(0, 2).map(p => (
                            <span key={p} className="font-pixel rounded px-1.5 py-0.5"
                                  style={{ fontSize: '6.5px', background: 'rgba(124,58,237,0.08)', color: '#9D60FA', border: '1px solid rgba(124,58,237,0.18)' }}>
                              {p}
                            </span>
                          ))}
                        </div>
                      </td>
                      {/* Price */}
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editForm.price ?? 0}
                            onChange={e => setEditForm(f => ({ ...f, price: +e.target.value }))}
                            className="bg-[#09090E] border border-[#7C3AED]/40 rounded-lg px-2 py-1 text-white font-body outline-none w-24"
                            style={{ fontSize: '12px' }}
                          />
                        ) : (
                          <p className="font-heading font-semibold text-white" style={{ fontSize: '13px' }}>
                            {(product.price / 1000).toFixed(0)}K
                          </p>
                        )}
                      </td>
                      {/* Discount */}
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editForm.discount ?? 0}
                            onChange={e => setEditForm(f => ({ ...f, discount: +e.target.value }))}
                            className="bg-[#09090E] border border-[#EF4444]/40 rounded-lg px-2 py-1 text-white font-body outline-none w-16"
                            style={{ fontSize: '12px' }}
                          />
                        ) : product.discount ? (
                          <span className="font-pixel rounded px-2 py-0.5 text-white"
                                style={{ fontSize: '7.5px', background: 'linear-gradient(135deg, #EF4444, #B91C1C)', letterSpacing: '0.04em' }}>
                            -{product.discount}%
                          </span>
                        ) : (
                          <span className="font-body text-[#1F2937]" style={{ fontSize: '12px' }}>—</span>
                        )}
                      </td>
                      {/* Delivery */}
                      <td className="px-4 py-3">
                        <span
                          className="font-body rounded-lg px-2 py-1"
                          style={{
                            fontSize: '10.5px',
                            color: DELIVERY_COLORS[product.deliveryType] ?? '#6B7280',
                            background: `${DELIVERY_COLORS[product.deliveryType] ?? '#6B7280'}12`,
                            border: `1px solid ${DELIVERY_COLORS[product.deliveryType] ?? '#6B7280'}25`,
                          }}
                        >
                          {DELIVERY_LABELS[product.deliveryType] ?? product.deliveryType}
                        </span>
                      </td>
                      {/* Rating */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Star style={{ width: '11px', height: '11px', color: '#F59E0B', fill: '#F59E0B' }} />
                          <span className="font-body text-[#9CA3AF]" style={{ fontSize: '12px' }}>{product.rating}</span>
                        </div>
                      </td>
                      {/* Sales */}
                      <td className="px-4 py-3">
                        <p className="font-body text-[#6B7280]" style={{ fontSize: '12px' }}>{product.totalSales}</p>
                      </td>
                      {/* Status toggles */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleFeatured(product.id)}
                            title="Featured"
                            className="transition-all duration-200"
                          >
                            <Zap style={{ width: '14px', height: '14px', color: product.featured ? '#F59E0B' : '#1F2937' }} />
                          </button>
                          <button
                            onClick={() => toggleStock(product.id)}
                            title={product.inStock ? 'В наличии' : 'Нет в наличии'}
                            className="transition-all duration-200"
                          >
                            {product.inStock
                              ? <Eye style={{ width: '14px', height: '14px', color: '#22C55E' }} />
                              : <EyeOff style={{ width: '14px', height: '14px', color: '#374151' }} />}
                          </button>
                        </div>
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={saveEdit}
                              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200"
                              style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', color: '#22C55E' }}
                            >
                              <Check style={{ width: '12px', height: '12px' }} />
                            </button>
                            <button
                              onClick={() => setEditId(null)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200"
                              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#F87171' }}
                            >
                              <X style={{ width: '12px', height: '12px' }} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEdit(product)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200"
                            style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)', color: '#9D60FA' }}
                          >
                            <Edit2 style={{ width: '12px', height: '12px' }} />
                          </button>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
