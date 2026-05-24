'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
  Search, Plus, Star, Zap, Check, X, Eye, EyeOff,
  ChevronDown, Filter, Edit2, RefreshCw, Wifi, WifiOff,
  AlertCircle, CheckCircle2, Clock, KeyRound, Trash2,
} from 'lucide-react';
import { ADMIN_PRODUCTS } from '@/lib/admin/mockAdminData';
import { formatPrice } from '@/lib/utils';
import type { AdminProduct } from '@/lib/admin/adminTypes';
import type { GameStockInfo } from '@/lib/admin/adminKeysTypes';
import type { ArcaneGameListResponse } from '@/lib/arcaneApi';
import AddGameModal from '@/components/admin/keys/AddGameModal';

/* ── Digiseller Sync Panel ──────────────────────────────────── */
interface SyncState {
  status: 'idle' | 'syncing' | 'success' | 'error' | 'disabled';
  synced?: number;
  durationMs?: number;
  timestamp?: string;
  error?: string;
  enabled?: boolean;
}

function DigisellerSyncPanel() {
  const [sync, setSync] = useState<SyncState>({ status: 'idle' });

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/digiseller/sync');
      const data = await res.json();
      if (!data.enabled) {
        setSync({ status: 'disabled', enabled: false });
        return;
      }
      if (data.lastSync) {
        setSync({ status: 'success', enabled: true, synced: data.lastSync.synced, durationMs: data.lastSync.durationMs, timestamp: data.lastSync.timestamp });
      } else {
        setSync({ status: 'idle', enabled: true });
      }
    } catch {
      setSync({ status: 'idle', enabled: false });
    }
  }, []);

  const triggerSync = useCallback(async () => {
    setSync(s => ({ ...s, status: 'syncing' }));
    try {
      const res = await fetch('/api/digiseller/sync', { method: 'POST' });
      const data = await res.json();
      if (data.ok) {
        setSync({ status: 'success', enabled: true, synced: data.result?.synced ?? 0, durationMs: data.result?.durationMs ?? 0, timestamp: data.result?.timestamp });
      } else {
        setSync({ status: 'error', error: data.error ?? 'Sync failed', enabled: true });
      }
    } catch {
      setSync({ status: 'error', error: 'Network error', enabled: true });
    }
  }, []);

  useState(() => { checkStatus(); });

  const isDisabled = sync.status === 'disabled' || sync.enabled === false;
  const isSyncing  = sync.status === 'syncing';

  const statusColor = { idle: '#6B7280', syncing: '#7C3AED', success: '#22C55E', error: '#EF4444', disabled: '#1F2937' }[sync.status];
  const StatusIcon  = { idle: Wifi, syncing: RefreshCw, success: CheckCircle2, error: AlertCircle, disabled: WifiOff }[sync.status];

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
      className="rounded-2xl p-4 mb-5"
      style={{ background: '#0D0D1A', border: `1px solid ${statusColor}20`, boxShadow: isDisabled ? 'none' : `0 0 24px ${statusColor}08` }}
    >
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
               style={{ background: `${statusColor}12`, border: `1px solid ${statusColor}22` }}>
            <StatusIcon style={{ width: '16px', height: '16px', color: statusColor, animation: isSyncing ? 'spin 1s linear infinite' : undefined }} />
          </div>
          <div>
            <p className="font-heading font-semibold text-white" style={{ fontSize: '13px' }}>Digiseller Sync</p>
            <p className="font-body text-[#4B5563]" style={{ fontSize: '11px' }}>
              {isDisabled && 'Не настроен — добавьте DIGISELLER_SELLER_ID в .env.local'}
              {sync.status === 'idle'    && sync.enabled && 'Готов к синхронизации'}
              {sync.status === 'syncing' && 'Синхронизация продуктов…'}
              {sync.status === 'success' && `Синхронизировано ${sync.synced} продуктов за ${sync.durationMs}ms`}
              {sync.status === 'error'   && `Ошибка: ${sync.error}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {sync.timestamp && (
            <div className="flex items-center gap-1.5">
              <Clock style={{ width: '11px', height: '11px', color: '#374151' }} />
              <span className="font-body text-[#374151]" style={{ fontSize: '10.5px' }}>
                {new Date(sync.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )}
          <button
            onClick={triggerSync}
            disabled={isSyncing || isDisabled}
            className="flex items-center gap-2 rounded-xl px-4 py-2 font-heading font-semibold text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: isDisabled ? 'rgba(255,255,255,0.04)' : isSyncing ? 'rgba(124,58,237,0.15)' : 'linear-gradient(135deg, #7C3AED, #5B21B6)',
              border: isDisabled ? '1px solid rgba(255,255,255,0.07)' : undefined,
              fontSize: '12px', boxShadow: isSyncing || isDisabled ? 'none' : '0 0 14px rgba(124,58,237,0.3)',
            }}
          >
            <RefreshCw style={{ width: '13px', height: '13px', animation: isSyncing ? 'spin 1s linear infinite' : undefined }} />
            {isSyncing ? 'Синхронизация…' : 'Синхронизировать'}
          </button>
        </div>
      </div>
      {!isDisabled && (
        <div className="mt-3 pt-3 flex items-center gap-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: sync.enabled ? '#22C55E' : '#374151' }} />
            <span className="font-body text-[#374151]" style={{ fontSize: '10px' }}>
              Источник: {sync.enabled ? 'Digiseller API' : 'Mock Data'}
            </span>
          </div>
          <span className="font-body text-[#1F2937]" style={{ fontSize: '10px' }}>·</span>
          <span className="font-body text-[#1F2937]" style={{ fontSize: '10px' }}>Кэш: 5 мин</span>
          <span className="font-body text-[#1F2937]" style={{ fontSize: '10px' }}>·</span>
          <span className="font-body text-[#1F2937]" style={{ fontSize: '10px' }}>Автосинк: по запросу</span>
        </div>
      )}
    </motion.div>
  );
}

/* ── Helpers ────────────────────────────────────────────────── */
const DELIVERY_COLORS: Record<string, string> = {
  instant: '#22C55E', steam_gift: '#66C0F4', telegram_activation: '#06B6D4',
  offline_activation: '#F59E0B', manual_delivery: '#9D60FA',
};
const DELIVERY_LABELS: Record<string, string> = {
  instant: 'Instant', steam_gift: 'Steam Gift', telegram_activation: 'Telegram',
  offline_activation: 'Offline', manual_delivery: 'Manual',
};

function arcaneToAdminProduct(g: ArcaneGameListResponse['data'][0]): AdminProduct {
  return {
    id:           g.id,
    title:        g.title,
    subtitle:     [g.developer, g.publisher].filter(Boolean).join(' · ') || '',
    image:        g.cover ?? `https://picsum.photos/seed/${g.id}/400/600`,
    category:     g.genres?.[0] ?? 'Игра',
    platform:     g.platforms ?? [],
    price:        g.priceUzs ?? 0,
    originalPrice: undefined,
    discount:     undefined,
    deliveryType: 'instant',
    featured:     false,
    preorder:     false,
    inStock:      g.isActive,
    totalSales:   0,
    totalRevenue: 0,
    rating:       g.rating ? Math.round(g.rating / 10) : 0,
  };
}

function stockInfoToAdminProduct(game: Partial<GameStockInfo> & { platforms?: string[]; priceUzs?: number; genres?: string[] }): AdminProduct {
  return {
    id:           game.gameId ?? String(Date.now()),
    title:        game.title ?? 'Новая игра',
    subtitle:     '',
    image:        game.cover ?? `https://picsum.photos/seed/${game.gameId ?? 'new'}/400/600`,
    category:     game.genres?.[0] ?? 'Игра',
    platform:     game.platforms ?? [],
    price:        game.priceUzs ?? 0,
    discount:     undefined,
    deliveryType: 'instant',
    featured:     false,
    preorder:     false,
    inStock:      game.isActive ?? true,
    totalSales:   0,
    totalRevenue: 0,
    rating:       0,
  };
}

/* ── Page ───────────────────────────────────────────────────── */
export default function AdminProductsPage() {
  const [search,       setSearch]       = useState('');
  const [filterCat,    setFilterCat]    = useState('all');
  const [mockProducts, setMockProducts] = useState<AdminProduct[]>(ADMIN_PRODUCTS);
  const [arcaneProds,  setArcaneProds]  = useState<AdminProduct[]>([]);
  const [apiLoading,   setApiLoading]   = useState(true);
  const [editId,       setEditId]       = useState<string | null>(null);
  const [editForm,     setEditForm]     = useState<Partial<AdminProduct>>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteId,     setDeleteId]     = useState<string | null>(null);
  const [deleting,     setDeleting]     = useState(false);

  // Fetch real games from arcane-api
  useEffect(() => {
    fetch('/api/arcane/games?limit=200')
      .then(r => r.json())
      .then((res: ArcaneGameListResponse) => {
        if (res.success && res.data?.length) {
          setArcaneProds(res.data.map(arcaneToAdminProduct));
        }
      })
      .catch(() => {})
      .finally(() => setApiLoading(false));
  }, []);

  // Merge: arcane-api takes priority, mock fills the rest (deduplicate by id)
  const products = useMemo(() => {
    if (arcaneProds.length === 0) return mockProducts;
    const arcaneIds = new Set(arcaneProds.map(p => p.id));
    const deduped = mockProducts.filter(p => !arcaneIds.has(p.id));
    return [...arcaneProds, ...deduped];
  }, [arcaneProds, mockProducts]);

  const categories = useMemo(
    () => ['all', ...Array.from(new Set(products.map(p => p.category)))],
    [products],
  );

  const filtered = useMemo(() => {
    let list = products;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    }
    if (filterCat !== 'all') list = list.filter(p => p.category === filterCat);
    return list;
  }, [products, search, filterCat]);

  const handleGameAdded = (game: Partial<GameStockInfo> & { platforms?: string[]; priceUzs?: number; genres?: string[] }) => {
    const newProd = stockInfoToAdminProduct(game);
    setArcaneProds(prev => [newProd, ...prev]);
  };

  const toggleFeatured = (id: string) =>
    setMockProducts(prev => prev.map(p => p.id === id ? { ...p, featured: !p.featured } : p));

  const toggleStock = (id: string) =>
    setMockProducts(prev => prev.map(p => p.id === id ? { ...p, inStock: !p.inStock } : p));

  const startEdit = (p: AdminProduct) => {
    setEditId(p.id);
    setEditForm({ title: p.title, price: p.price, discount: p.discount ?? 0, deliveryType: p.deliveryType });
  };

  const saveEdit = () => {
    if (!editId) return;
    setMockProducts(prev => prev.map(p => p.id === editId ? { ...p, ...editForm } : p));
    setArcaneProds(prev => prev.map(p => p.id === editId ? { ...p, ...editForm } : p));
    setEditId(null);
  };

  const handleDelete = async (id: string) => {
    const isArcane = arcaneProds.some(p => p.id === id);
    setDeleting(true);
    try {
      if (isArcane) {
        await fetch(`/api/arcane/games/${id}`, { method: 'DELETE' });
        setArcaneProds(prev => prev.filter(p => p.id !== id));
      } else {
        setMockProducts(prev => prev.filter(p => p.id !== id));
      }
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  return (
    <div className="p-6">
      <DigisellerSyncPanel />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6"
      >
        <div>
          <p className="font-pixel mb-1" style={{ fontSize: '8px', color: '#06B6D4', letterSpacing: '0.14em' }}>УПРАВЛЕНИЕ</p>
          <h1 className="font-heading font-bold text-white" style={{ fontSize: '22px' }}>Продукты</h1>
          <p className="font-body text-[#4B5563]" style={{ fontSize: '12px' }}>
            {apiLoading
              ? 'Загрузка...'
              : `${products.length} товаров · ${arcaneProds.length > 0 ? 'arcane-api + mock' : 'mock данные'}`}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 font-heading font-semibold text-white transition-all"
          style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', fontSize: '13px',
                   boxShadow: '0 0 16px rgba(124,58,237,0.3)' }}
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
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                 style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.12)' }}>
              <KeyRound style={{ width: '24px', height: '24px', color: '#374151' }} />
            </div>
            <div className="text-center">
              <p className="font-heading font-semibold text-white mb-1" style={{ fontSize: '15px' }}>
                {search || filterCat !== 'all' ? 'Ничего не найдено' : 'Нет продуктов'}
              </p>
              <p className="font-body text-[#4B5563]" style={{ fontSize: '12px' }}>
                {search || filterCat !== 'all'
                  ? 'Попробуйте изменить фильтры'
                  : 'Добавьте первый продукт с помощью кнопки выше'}
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                  {['Продукт', 'Категория', 'Платформы', 'Цена', 'Скидка', 'Доставка', 'Рейтинг', 'Продажи', 'Статус', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-body text-[#374151] whitespace-nowrap"
                        style={{ fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
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
                              {product.price > 0 ? `${(product.price / 1000).toFixed(0)}K` : '—'}
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
                            <button onClick={() => toggleFeatured(product.id)} title="Featured" className="transition-all duration-200">
                              <Zap style={{ width: '14px', height: '14px', color: product.featured ? '#F59E0B' : '#1F2937' }} />
                            </button>
                            <button onClick={() => toggleStock(product.id)} title={product.inStock ? 'В наличии' : 'Нет в наличии'} className="transition-all duration-200">
                              {product.inStock
                                ? <Eye    style={{ width: '14px', height: '14px', color: '#22C55E' }} />
                                : <EyeOff style={{ width: '14px', height: '14px', color: '#374151' }} />}
                            </button>
                          </div>
                        </td>
                        {/* Actions: Edit + Delete */}
                        <td className="px-4 py-3">
                          {deleteId === product.id ? (
                            <div className="flex items-center gap-1">
                              <span className="font-body text-[#EF4444] mr-1 whitespace-nowrap" style={{ fontSize: '10px' }}>Удалить?</span>
                              <button
                                onClick={() => handleDelete(product.id)}
                                disabled={deleting}
                                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 disabled:opacity-50"
                                style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)', color: '#EF4444' }}>
                                <Check style={{ width: '12px', height: '12px' }} />
                              </button>
                              <button
                                onClick={() => setDeleteId(null)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200"
                                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#6B7280' }}>
                                <X style={{ width: '12px', height: '12px' }} />
                              </button>
                            </div>
                          ) : isEditing ? (
                            <div className="flex items-center gap-1">
                              <button onClick={saveEdit}
                                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200"
                                style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', color: '#22C55E' }}>
                                <Check style={{ width: '12px', height: '12px' }} />
                              </button>
                              <button onClick={() => setEditId(null)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200"
                                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#F87171' }}>
                                <X style={{ width: '12px', height: '12px' }} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                              <button onClick={() => startEdit(product)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200"
                                style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)', color: '#9D60FA' }}>
                                <Edit2 style={{ width: '12px', height: '12px' }} />
                              </button>
                              <button onClick={() => { setEditId(null); setDeleteId(product.id); }}
                                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200"
                                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', color: '#EF4444' }}>
                                <Trash2 style={{ width: '12px', height: '12px' }} />
                              </button>
                            </div>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Add Game Modal */}
      <AnimatePresence>
        {showAddModal && (
          <AddGameModal
            onClose={() => setShowAddModal(false)}
            onSuccess={handleGameAdded}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
