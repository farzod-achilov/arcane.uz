'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
  Search, RefreshCw, CheckCircle2, Clock, ChevronDown,
  ChevronUp, Send, Key, User, Package, Filter, X,
  Zap, Hand, AlertTriangle, History,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { OrderStatusBadge, DeliveryTypeBadge } from '@/components/admin/DeliveryBadge';

/* ── Types ─────────────────────────────────────────────── */
interface GameItem {
  id: string; title: string; cover: string | null;
  slug: string; deliveryType: 'AUTO' | 'MANUAL';
}
interface OrderItem { id: string; price: number; keyValue: string | null; deliveredAt: string | null; game: GameItem }
interface AuditEntry { id: string; action: string; actor: string; note: string | null; createdAt: string }
interface AdminOrder {
  id: string; totalPrice: number; status: string;
  deliveredAt: string | null; deliveredBy: string | null; deliveryNote: string | null;
  createdAt: string; updatedAt: string;
  user: { id: string; username: string; email: string };
  items: OrderItem[];
  delivery_logs: AuditEntry[];
}

type StatusFilter = 'ALL' | 'WAITING_MANUAL' | 'PAID' | 'COMPLETED' | 'CANCELLED';

/* ── Complete Order Modal ──────────────────────────────── */
function CompleteModal({
  order, onClose, onDone,
}: { order: AdminOrder; onClose: () => void; onDone: () => void }) {
  const [keyValue,     setKeyValue]     = useState('');
  const [deliveryNote, setDeliveryNote] = useState('');
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');

  const submit = async () => {
    setLoading(true); setError('');
    try {
      const res  = await fetch(`/api/orders/${order.id}/manual-complete`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ keyValue: keyValue.trim() || undefined, deliveryNote: deliveryNote.trim() || undefined }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error ?? 'Ошибка'); return; }
      onDone();
    } catch { setError('Ошибка сети'); }
    finally   { setLoading(false); }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.94, y: 16 }} animate={{ scale: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl p-6"
        style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.08)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.12)' }}>
            <CheckCircle2 className="w-5 h-5 text-[#22C55E]" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-white">Завершить заказ</h3>
            <p className="font-body text-xs" style={{ color: '#4B5563' }}>
              {order.items.map(i => i.game.title).join(', ')}
            </p>
          </div>
          <button onClick={onClose} className="ml-auto text-gray-600 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Game key */}
        <div className="mb-4">
          <label className="block font-pixel mb-2" style={{ fontSize: '7px', color: '#4B5563', letterSpacing: '0.1em' }}>
            КЛЮЧ АКТИВАЦИИ (опционально)
          </label>
          <div className="relative">
            <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#4B5563' }} />
            <input
              type="text"
              placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX"
              value={keyValue}
              onChange={e => setKeyValue(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl font-body text-sm text-white outline-none"
              style={{ background: '#12121A', border: '1px solid rgba(255,255,255,0.07)' }}
              onFocus={e  => (e.currentTarget.style.borderColor = 'rgba(34,197,94,0.4)')}
              onBlur={e   => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
            />
          </div>
        </div>

        {/* Note */}
        <div className="mb-5">
          <label className="block font-pixel mb-2" style={{ fontSize: '7px', color: '#4B5563', letterSpacing: '0.1em' }}>
            ПРИМЕЧАНИЕ (опционально)
          </label>
          <textarea
            placeholder="Ключ выдан вручную через Steam..."
            value={deliveryNote}
            onChange={e => setDeliveryNote(e.target.value)}
            rows={3}
            className="w-full px-4 py-2.5 rounded-xl font-body text-sm text-white outline-none resize-none"
            style={{ background: '#12121A', border: '1px solid rgba(255,255,255,0.07)' }}
          />
        </div>

        {error && (
          <p className="mb-4 text-sm font-body text-[#EF4444] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl font-heading font-semibold text-sm transition-all"
            style={{ background: 'rgba(255,255,255,0.04)', color: '#6B7280', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            Отмена
          </button>
          <button
            onClick={submit} disabled={loading}
            className="flex-1 py-2.5 rounded-xl font-heading font-bold text-sm text-white transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #22C55E, #16A34A)' }}
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Завершить
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Order Row ─────────────────────────────────────────── */
function OrderRow({ order, onComplete, onRefresh }: {
  order: AdminOrder;
  onComplete: (o: AdminOrder) => void;
  onRefresh:  () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const game   = order.items[0]?.game;
  const isWait = order.status === 'WAITING_MANUAL' || order.status === 'PAID';

  return (
    <div
      className="rounded-xl overflow-hidden transition-all duration-200"
      style={{ background: '#0D0D16', border: `1px solid ${isWait ? 'rgba(251,146,60,0.2)' : 'rgba(255,255,255,0.06)'}` }}
    >
      {/* Main row */}
      <div className="flex items-center gap-4 p-4">
        {/* Cover */}
        <div className="relative w-12 h-16 rounded-lg overflow-hidden flex-shrink-0"
             style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
          {game?.cover ? (
            <Image src={game.cover} alt={game.title} fill unoptimized className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: '#12121A' }}>
              <Package className="w-5 h-5" style={{ color: '#374151' }} />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="font-heading font-semibold text-white truncate" style={{ fontSize: '13.5px' }}>
              {order.items.map(i => i.game.title).join(', ')}
            </span>
            {game && <DeliveryTypeBadge type={game.deliveryType} />}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-body text-xs flex items-center gap-1" style={{ color: '#4B5563' }}>
              <User className="w-3 h-3" />
              {order.user.username}
            </span>
            <span className="font-body text-xs" style={{ color: '#374151' }}>{order.user.email}</span>
            <span className="font-body text-xs" style={{ color: '#374151' }}>
              {new Date(order.createdAt).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        {/* Price */}
        <div className="text-right flex-shrink-0">
          <p className="font-heading font-bold text-white" style={{ fontSize: '15px' }}>{formatPrice(order.totalPrice)}</p>
          <p className="font-body text-xs mt-0.5" style={{ color: '#374151' }}>#{order.id.slice(0, 8)}</p>
        </div>

        {/* Status */}
        <div className="flex-shrink-0">
          <OrderStatusBadge status={order.status as never} />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {isWait && (
            <button
              onClick={() => onComplete(order)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-heading font-semibold text-white text-xs transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #22C55E, #16A34A)', boxShadow: '0 0 12px rgba(34,197,94,0.3)' }}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Завершить
            </button>
          )}
          <button
            onClick={() => setExpanded(p => !p)}
            className="p-1.5 rounded-lg transition-colors hover:text-white"
            style={{ color: '#4B5563' }}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded: details + audit log */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
          >
            <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Items */}
              <div>
                <p className="font-pixel mb-3" style={{ fontSize: '7px', color: '#4B5563', letterSpacing: '0.1em' }}>
                  ТОВАРЫ
                </p>
                {order.items.map(item => (
                  <div key={item.id} className="flex items-center justify-between py-2"
                       style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <span className="font-body text-sm text-white">{item.game.title}</span>
                    <div className="text-right">
                      {item.keyValue ? (
                        <code className="font-mono text-xs px-2 py-0.5 rounded"
                              style={{ background: 'rgba(34,197,94,0.1)', color: '#22C55E', letterSpacing: '0.05em' }}>
                          {item.keyValue}
                        </code>
                      ) : (
                        <span className="font-body text-xs" style={{ color: '#4B5563' }}>— ключ не выдан</span>
                      )}
                    </div>
                  </div>
                ))}

                {order.deliveredBy && (
                  <div className="mt-3 p-3 rounded-lg" style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}>
                    <p className="font-body text-xs" style={{ color: '#22C55E' }}>
                      ✓ Выдан: <b>{order.deliveredBy}</b>
                      {order.deliveredAt && ` · ${new Date(order.deliveredAt).toLocaleString('ru-RU')}`}
                    </p>
                    {order.deliveryNote && (
                      <p className="font-body text-xs mt-1" style={{ color: '#4B5563' }}>{order.deliveryNote}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Audit log */}
              <div>
                <p className="font-pixel mb-3" style={{ fontSize: '7px', color: '#4B5563', letterSpacing: '0.1em' }}>
                  ИСТОРИЯ ДОСТАВКИ
                </p>
                {order.delivery_logs.length === 0 ? (
                  <p className="font-body text-xs" style={{ color: '#374151' }}>Нет записей</p>
                ) : (
                  <div className="space-y-2">
                    {order.delivery_logs.map(log => (
                      <div key={log.id} className="flex items-start gap-2.5">
                        <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                             style={{ background: log.action.includes('COMPLETE') ? '#22C55E' : log.action.includes('FAIL') ? '#EF4444' : '#7C3AED' }} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-pixel" style={{ fontSize: '8px', color: '#9D60FA', letterSpacing: '0.06em' }}>
                              {log.action}
                            </span>
                            <span className="font-body" style={{ fontSize: '10px', color: '#374151' }}>
                              {log.actor !== 'system' ? log.actor : ''}
                            </span>
                          </div>
                          {log.note && (
                            <p className="font-body text-xs mt-0.5" style={{ color: '#6B7280' }}>{log.note}</p>
                          )}
                          <p className="font-body" style={{ fontSize: '10px', color: '#374151' }}>
                            {new Date(log.createdAt).toLocaleString('ru-RU')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Stats Card ────────────────────────────────────────── */
function StatCard({ label, value, color, icon: Icon }: {
  label: string; value: number; color: string; icon: React.ElementType;
}) {
  return (
    <div className="rounded-xl p-4" style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <span className="font-body text-sm" style={{ color: '#6B7280' }}>{label}</span>
      </div>
      <p className="font-heading font-bold text-white" style={{ fontSize: '26px', lineHeight: 1 }}>{value}</p>
    </div>
  );
}

/* ── Main Page ─────────────────────────────────────────── */
export default function DeliveriesPage() {
  const [orders,       setOrders]       = useState<AdminOrder[]>([]);
  const [total,        setTotal]        = useState(0);
  const [stats,        setStats]        = useState<Record<string, number>>({});
  const [loading,      setLoading]      = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('WAITING_MANUAL');
  const [q,            setQ]            = useState('');
  const [completing,   setCompleting]   = useState<AdminOrder | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const sp  = new URLSearchParams();
      if (statusFilter !== 'ALL') sp.set('status', statusFilter);
      if (q.trim())               sp.set('q', q.trim());
      const res  = await fetch(`/api/orders/manual?${sp}`);
      const data = await res.json();
      if (data.ok) {
        setOrders(data.orders);
        setTotal(data.total);
        const statsMap: Record<string, number> = {};
        for (const s of (data.stats ?? [])) statsMap[s.status] = s._count._all;
        setStats(statsMap);
      }
    } finally { setLoading(false); }
  }, [statusFilter, q]);

  useEffect(() => { load(); }, [load]);

  const STATUS_TABS: { key: StatusFilter; label: string }[] = [
    { key: 'WAITING_MANUAL', label: 'Ждут доставки' },
    { key: 'PAID',           label: 'Оплачены'      },
    { key: 'COMPLETED',      label: 'Выполнены'     },
    { key: 'ALL',            label: 'Все'           },
  ];

  return (
    <div className="min-h-screen p-6" style={{ background: '#07070F' }}>
      {/* Header */}
      <div className="mb-8">
        <p className="font-pixel mb-1" style={{ fontSize: '8px', color: '#7C3AED', letterSpacing: '0.15em' }}>
          ◆ ADMIN
        </p>
        <div className="flex items-center justify-between">
          <h1 className="font-heading font-bold text-3xl text-white">Доставка заказов</h1>
          <button
            onClick={load}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-body text-sm transition-all"
            style={{ background: '#12121A', border: '1px solid rgba(255,255,255,0.07)', color: '#6B7280' }}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Обновить
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Ждут доставки" value={stats['WAITING_MANUAL'] ?? 0} color="#FB923C" icon={Clock}      />
        <StatCard label="Оплачены"       value={stats['PAID']           ?? 0} color="#F59E0B" icon={Zap}        />
        <StatCard label="Выполнены"      value={stats['COMPLETED']      ?? 0} color="#22C55E" icon={CheckCircle2}/>
        <StatCard label="Всего"          value={total}                        color="#7C3AED" icon={Package}    />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#4B5563' }} />
          <input
            type="text"
            placeholder="Поиск по пользователю, игре, ID заказа..."
            value={q}
            onChange={e => setQ(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl font-body text-sm text-white outline-none"
            style={{ background: '#12121A', border: '1px solid rgba(255,255,255,0.07)' }}
          />
          {q && (
            <button onClick={() => setQ('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Status filter tabs */}
        <div className="flex items-center rounded-xl p-1 gap-1"
             style={{ background: '#12121A', border: '1px solid rgba(255,255,255,0.07)' }}>
          {STATUS_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className="px-3 py-1.5 rounded-lg font-body text-xs transition-all whitespace-nowrap"
              style={{
                background: statusFilter === tab.key ? '#7C3AED' : 'transparent',
                color:      statusFilter === tab.key ? '#fff'    : '#6B7280',
              }}
            >
              {tab.label}
              {tab.key === 'WAITING_MANUAL' && (stats['WAITING_MANUAL'] ?? 0) > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-white font-bold"
                      style={{ fontSize: '9px', background: '#FB923C' }}>
                  {stats['WAITING_MANUAL']}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Orders list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl animate-pulse"
                 style={{ background: '#0D0D16', animationDelay: `${i * 60}ms` }} />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="p-5 rounded-2xl mb-4"
               style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.06)' }}>
            <CheckCircle2 className="w-10 h-10" style={{ color: '#22C55E' }} />
          </div>
          <h3 className="font-heading font-bold text-xl text-white mb-2">
            {statusFilter === 'WAITING_MANUAL' ? 'Нет заказов для доставки' : 'Заказы не найдены'}
          </h3>
          <p className="font-body text-sm" style={{ color: '#4B5563' }}>
            {statusFilter === 'WAITING_MANUAL' ? 'Все заказы выполнены!' : 'Попробуйте изменить фильтры'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => (
            <OrderRow
              key={order.id}
              order={order}
              onComplete={setCompleting}
              onRefresh={load}
            />
          ))}
          <p className="text-center font-body text-xs pt-2" style={{ color: '#374151' }}>
            Показано {orders.length} из {total}
          </p>
        </div>
      )}

      {/* Complete modal */}
      <AnimatePresence>
        {completing && (
          <CompleteModal
            order={completing}
            onClose={() => setCompleting(null)}
            onDone={() => { setCompleting(null); load(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
