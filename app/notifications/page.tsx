'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Bell, ShoppingBag, Zap, Heart, Star, AlertCircle,
  Clock, Check, Trash2, CheckCheck, ArrowLeft,
} from 'lucide-react';
import { useUser } from '@/lib/userContext';
import { useRouter } from 'next/navigation';

/* ── helpers ──────────────────────────────────────────── */
function relativeTime(ts: number) {
  const diff = Date.now() - ts;
  if (diff < 60_000)     return 'только что';
  if (diff < 3_600_000)  return `${Math.floor(diff / 60_000)} мин назад`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} ч назад`;
  if (diff < 604_800_000)return `${Math.floor(diff / 86_400_000)} д назад`;
  return new Date(ts).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

type NotifType = 'order' | 'coins' | 'wishlist' | 'event' | 'level' | 'system' | 'preorder' | 'review';

const ICONS: Record<NotifType, { icon: typeof Bell; color: string; bg: string }> = {
  order:    { icon: ShoppingBag,  color: '#22C55E', bg: 'rgba(34,197,94,0.1)'   },
  coins:    { icon: Zap,          color: '#F59E0B', bg: 'rgba(245,158,11,0.1)'  },
  wishlist: { icon: Heart,        color: '#EF4444', bg: 'rgba(239,68,68,0.1)'   },
  event:    { icon: Star,         color: '#9D60FA', bg: 'rgba(157,96,250,0.1)'  },
  level:    { icon: AlertCircle,  color: '#06B6D4', bg: 'rgba(6,182,212,0.1)'   },
  system:   { icon: Bell,         color: '#6B7280', bg: 'rgba(107,114,128,0.1)' },
  preorder: { icon: Clock,        color: '#F59E0B', bg: 'rgba(245,158,11,0.1)'  },
  review:   { icon: Star,         color: '#9D60FA', bg: 'rgba(157,96,250,0.1)'  },
};

const FALLBACK = { icon: Bell, color: '#6B7280', bg: 'rgba(107,114,128,0.1)' };

interface Notif {
  id: string; type: string; title: string;
  body: string; href: string | null;
  read: boolean; time: number;
}

export default function NotificationsPage() {
  const { isLoggedIn, notifications: ctxNotifs, unreadCount,
          markNotificationRead, markAllRead } = useUser();
  const router = useRouter();

  const [notifs, setNotifs]       = useState<Notif[]>([]);
  const [loading, setLoading]     = useState(true);
  const [deleting, setDeleting]   = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn) { router.replace('/login'); return; }
  }, [isLoggedIn, router]);

  const load = useCallback(async () => {
    try {
      const res  = await fetch('/api/notifications');
      const data = await res.json();
      setNotifs(data.notifications ?? []);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // keep in sync with context updates
  useEffect(() => {
    if (ctxNotifs.length) setNotifs(ctxNotifs as Notif[]);
  }, [ctxNotifs]);

  const handleRead = async (id: string) => {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    markNotificationRead(id);
    await fetch('/api/notifications', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
  };

  const handleReadAll = async () => {
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
    markAllRead();
    await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    await fetch('/api/notifications', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setNotifs(prev => prev.filter(n => n.id !== id));
    setDeleting(null);
  };

  const unread = notifs.filter(n => !n.read).length;

  return (
    <div className="min-h-screen" style={{ background: '#04040A', paddingTop: '96px', paddingBottom: '80px' }}>
      <div className="max-w-2xl mx-auto px-4">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl text-[#4B5563] hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <ArrowLeft style={{ width: '16px', height: '16px' }} />
          </button>
          <div className="flex-1">
            <h1 className="font-heading font-bold text-white" style={{ fontSize: '22px' }}>
              Уведомления
            </h1>
            {unread > 0 && (
              <p className="font-body text-[#6B7280]" style={{ fontSize: '13px' }}>
                {unread} непрочитанных
              </p>
            )}
          </div>
          {unread > 0 && (
            <button
              onClick={handleReadAll}
              className="flex items-center gap-1.5 font-body text-[#7C3AED] hover:text-[#9D60FA] transition-colors"
              style={{ fontSize: '12px' }}
            >
              <CheckCheck style={{ width: '13px', height: '13px' }} />
              Прочитать все
            </button>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="rounded-2xl p-4 animate-pulse"
                   style={{ background: 'rgba(255,255,255,0.03)', height: '80px' }} />
            ))}
          </div>
        ) : notifs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                 style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.15)' }}>
              <Bell style={{ width: '24px', height: '24px', color: '#4B5563' }} />
            </div>
            <p className="font-heading font-semibold text-white mb-1" style={{ fontSize: '16px' }}>
              Уведомлений нет
            </p>
            <p className="font-body text-[#4B5563]" style={{ fontSize: '13px' }}>
              Здесь появятся новости о заказах, монетах и акциях
            </p>
            <Link href="/catalog"
                  className="mt-6 font-heading font-semibold text-white rounded-xl px-5 py-2.5"
                  style={{ background: 'linear-gradient(135deg,#7C3AED,#06B6D4)', fontSize: '13px' }}>
              Перейти в каталог
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {notifs.map((n, i) => {
                const cfg = ICONS[n.type as NotifType] ?? FALLBACK;
                const Icon = cfg.icon;
                const inner = (
                  <motion.div
                    key={n.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.03 }}
                    onClick={() => !n.read && handleRead(n.id)}
                    className="flex items-start gap-3 rounded-2xl p-4 relative cursor-pointer group"
                    style={{
                      background: n.read ? 'rgba(255,255,255,0.02)' : 'rgba(124,58,237,0.06)',
                      border:     `1px solid ${n.read ? 'rgba(255,255,255,0.05)' : 'rgba(124,58,237,0.18)'}`,
                      transition: 'background 0.2s, border-color 0.2s',
                    }}
                  >
                    {!n.read && (
                      <span className="absolute top-3.5 right-3.5 w-1.5 h-1.5 rounded-full bg-[#7C3AED]"
                            style={{ boxShadow: '0 0 6px rgba(124,58,237,0.8)' }} />
                    )}

                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                         style={{ background: cfg.bg, border: `1px solid ${cfg.color}25` }}>
                      <Icon style={{ width: '16px', height: '16px', color: cfg.color }} />
                    </div>

                    <div className="flex-1 min-w-0 pr-6">
                      <p className="font-heading font-semibold text-white mb-0.5 truncate"
                         style={{ fontSize: '13.5px', color: n.read ? '#9CA3AF' : '#fff' }}>
                        {n.title}
                      </p>
                      <p className="font-body text-[#4B5563] line-clamp-2" style={{ fontSize: '12px', lineHeight: '1.5' }}>
                        {n.body}
                      </p>
                      <p className="font-body mt-1" style={{ fontSize: '11px', color: '#374151' }}>
                        {relativeTime(n.time)}
                      </p>
                    </div>

                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(n.id); }}
                      disabled={deleting === n.id}
                      className="absolute top-3 right-3 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-[#4B5563] hover:text-[#F87171]"
                    >
                      {deleting === n.id
                        ? <Check style={{ width: '12px', height: '12px' }} />
                        : <Trash2 style={{ width: '12px', height: '12px' }} />
                      }
                    </button>
                  </motion.div>
                );

                return n.href ? (
                  <Link key={n.id} href={n.href} onClick={() => handleRead(n.id)}>
                    {inner}
                  </Link>
                ) : (
                  <div key={n.id}>{inner}</div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
