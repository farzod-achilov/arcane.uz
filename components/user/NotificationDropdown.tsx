'use client';

import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Bell, ShoppingBag, Zap, Heart, Star, AlertCircle, Clock, Check, X, MessageSquare } from 'lucide-react';
import { useUser } from '@/lib/userContext';

function relativeTime(ts: number) {
  const diff = Date.now() - ts;
  if (diff < 60_000)            return 'только что';
  if (diff < 3_600_000)         return `${Math.floor(diff / 60_000)} мин назад`;
  if (diff < 86_400_000)        return `${Math.floor(diff / 3_600_000)} ч назад`;
  return `${Math.floor(diff / 86_400_000)} д назад`;
}

const NOTIF_ICONS: Record<string, { icon: typeof Bell; color: string }> = {
  order:    { icon: ShoppingBag,   color: '#22C55E' },
  coins:    { icon: Zap,           color: '#F59E0B' },
  wishlist: { icon: Heart,         color: '#EF4444' },
  event:    { icon: Star,          color: '#9D60FA' },
  level:    { icon: AlertCircle,   color: '#06B6D4' },
  system:   { icon: Bell,          color: '#6B7280' },
  preorder: { icon: Clock,         color: '#F59E0B' },
  review:   { icon: MessageSquare, color: '#06B6D4' },
};

// неизвестный тип не должен ронять весь дропдаун
const DEFAULT_ICON = { icon: Bell, color: '#6B7280' };

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationDropdown({ isOpen, onClose }: Props) {
  const { notifications, unreadCount, markNotificationRead, markAllRead } = useUser();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={ref}
          key="notif-dropdown"
          initial={{ opacity: 0, y: -8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.97 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="absolute right-0 top-[calc(100%+8px)] w-80 sm:w-96 rounded-2xl overflow-hidden z-50"
          style={{
            background: '#0C0C18',
            border: '1px solid rgba(124,58,237,0.25)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.75), 0 0 0 1px rgba(124,58,237,0.08)',
          }}
        >
          {/* Top glow line */}
          <div className="absolute top-0 left-0 right-0 h-px"
               style={{ background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.6), rgba(6,182,212,0.4), transparent)' }} />

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5"
               style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex items-center gap-2">
              <Bell style={{ width: '14px', height: '14px', color: '#7C3AED' }} />
              <span className="font-heading font-semibold text-white" style={{ fontSize: '13px' }}>
                Уведомления
              </span>
              {unreadCount > 0 && (
                <span className="font-pixel rounded-full text-white"
                      style={{ fontSize: '7px', background: '#7C3AED',
                               padding: '2px 6px', boxShadow: '0 0 8px rgba(124,58,237,0.6)' }}>
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button onClick={markAllRead}
                      className="font-body text-[#7C3AED] hover:text-[#9D60FA] transition-colors flex items-center gap-1"
                      style={{ fontSize: '11px' }}>
                <Check style={{ width: '11px', height: '11px' }} />
                Все прочитаны
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[380px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="mx-auto mb-3 text-[#1F2937]" style={{ width: '28px', height: '28px' }} />
                <p className="font-body text-[#4B5563]" style={{ fontSize: '13px' }}>
                  Нет уведомлений
                </p>
              </div>
            ) : (
              notifications.slice(0, 8).map((n) => {
                const cfg = NOTIF_ICONS[n.type] ?? DEFAULT_ICON;
                const Icon = cfg.icon;
                return (
                  <Link
                    key={n.id}
                    href={n.href ?? '#'}
                    onClick={() => { markNotificationRead(n.id); onClose(); }}
                    className="flex items-start gap-3 px-4 py-3.5 transition-all duration-150 group"
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.03)',
                      background: n.read ? 'transparent' : 'rgba(124,58,237,0.03)',
                    }}
                  >
                    {/* Icon */}
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                         style={{ background: `${cfg.color}12`, border: `1px solid ${cfg.color}22` }}>
                      <Icon style={{ width: '13px', height: '13px', color: cfg.color }} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="font-heading font-semibold line-clamp-1"
                         style={{ fontSize: '12.5px', color: n.read ? '#6B7280' : '#E2E8F0' }}>
                        {n.title}
                      </p>
                      <p className="font-body text-[#4B5563] mt-0.5 line-clamp-2"
                         style={{ fontSize: '11.5px', lineHeight: '1.45' }}>
                        {n.body}
                      </p>
                    </div>

                    {/* Right */}
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <span className="font-body text-[#374151]" style={{ fontSize: '10px' }}>
                        {relativeTime(n.time)}
                      </span>
                      {!n.read && (
                        <div className="w-1.5 h-1.5 rounded-full bg-[#7C3AED]"
                             style={{ boxShadow: '0 0 5px rgba(124,58,237,0.8)' }} />
                      )}
                    </div>
                  </Link>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <Link href="/dashboard" onClick={onClose}
                  className="flex items-center justify-center py-3 font-body transition-colors text-[#4B5563] hover:text-[#9D60FA]"
                  style={{ fontSize: '12px' }}>
              Все уведомления
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
