'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Search, Bell, ExternalLink, ChevronRight,
  LayoutDashboard, Package, ShoppingBag, Users,
  Tag, Zap, Gift, MessageSquare, BarChart2, TrendingUp, Gamepad2, KeyRound,
} from 'lucide-react';
import { ADMIN_STATS } from '@/lib/admin/mockAdminData';
import { useT } from '@/lib/i18n';

const BREADCRUMB_ICONS: Record<string, React.ElementType> = {
  '/admin':                     LayoutDashboard,
  '/admin/products':            Package,
  '/admin/keys':                KeyRound,
  '/admin/orders':              ShoppingBag,
  '/admin/users':               Users,
  '/admin/discounts':           Tag,
  '/admin/coins':               Zap,
  '/admin/cases':               Gift,
  '/admin/price-control':       TrendingUp,
  '/admin/smart-pricing':       BarChart2,
  '/admin/smart-pricing/games': Gamepad2,
  '/admin/support':             MessageSquare,
  '/admin/analytics':           BarChart2,
};

export default function AdminTopbar() {
  const pathname              = usePathname();
  const { t, lang, setLang } = useT();
  const [search, setSearch]   = useState('');
  const [notifOpen, setNotif] = useState(false);

  const BREADCRUMB_LABELS: Record<string, string> = {
    '/admin':                     t.nav.dashboard,
    '/admin/products':            t.nav.products,
    '/admin/keys':                t.nav.keys,
    '/admin/orders':              t.nav.orders,
    '/admin/users':               t.nav.users,
    '/admin/discounts':           t.nav.discounts,
    '/admin/coins':               t.nav.coins,
    '/admin/cases':               t.nav.cases,
    '/admin/price-control':       t.nav.priceControl,
    '/admin/smart-pricing':       t.nav.smartPricing,
    '/admin/smart-pricing/games': t.nav.gamePricing,
    '/admin/support':             t.nav.support,
    '/admin/analytics':           t.nav.analytics,
  };

  const label = BREADCRUMB_LABELS[pathname] ?? 'Admin';
  const Icon  = BREADCRUMB_ICONS[pathname]  ?? LayoutDashboard;

  return (
    <header
      className="flex items-center justify-between gap-4 px-5 h-16 flex-shrink-0 relative"
      style={{
        background: 'rgba(6,5,11,0.95)',
        borderBottom: '1px solid rgba(124,58,237,0.1)',
        backdropFilter: 'blur(16px)',
      }}
    >
      {/* Bottom glow */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.25) 30%, rgba(6,182,212,0.2) 70%, transparent)' }}
      />

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 min-w-0">
        <Link href="/admin" className="font-body text-[#374151] hover:text-[#6B7280] transition-colors whitespace-nowrap" style={{ fontSize: '12px' }}>
          ARCANE
        </Link>
        <ChevronRight style={{ width: '12px', height: '12px', color: '#1F2937', flexShrink: 0 }} />
        <div className="flex items-center gap-1.5">
          <Icon style={{ width: '13px', height: '13px', color: '#7C3AED', flexShrink: 0 }} />
          <span className="font-heading font-semibold text-white whitespace-nowrap" style={{ fontSize: '13px' }}>
            {label}
          </span>
        </div>
      </div>

      {/* Right zone */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Language switcher */}
        <div className="flex items-center rounded-xl overflow-hidden"
             style={{ background: '#09090E', border: '1px solid rgba(255,255,255,0.07)' }}>
          {(['ru', 'en'] as const).map(l => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className="px-3 py-2 font-heading font-bold transition-all duration-200"
              style={{
                fontSize:   '11px',
                color:      lang === l ? '#fff' : '#374151',
                background: lang === l ? 'rgba(124,58,237,0.3)' : 'transparent',
                letterSpacing: '0.05em',
              }}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="hidden sm:flex items-center gap-2 rounded-xl px-3 py-2 w-48"
             style={{ background: '#09090E', border: '1px solid rgba(255,255,255,0.06)' }}>
          <Search style={{ width: '13px', height: '13px', color: '#374151', flexShrink: 0 }} />
          <input
            type="text"
            placeholder={t.topbar.search}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent outline-none text-white placeholder:text-[#1F2937] w-full font-body"
            style={{ fontSize: '12px' }}
          />
        </div>

        {/* Link to storefront */}
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:flex items-center gap-1.5 rounded-xl px-3 py-2 transition-all duration-200"
          style={{ background: '#09090E', border: '1px solid rgba(255,255,255,0.06)', color: '#4B5563', fontSize: '12px' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#9CA3AF'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#4B5563'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'; }}
        >
          <ExternalLink style={{ width: '12px', height: '12px' }} />
          <span className="font-body">{t.topbar.site}</span>
        </a>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotif(v => !v)}
            className="relative p-2 rounded-xl transition-all duration-200"
            style={{ background: '#09090E', border: '1px solid rgba(255,255,255,0.06)', color: '#4B5563' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#9CA3AF'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#4B5563'; }}
          >
            <Bell style={{ width: '15px', height: '15px' }} />
            {ADMIN_STATS.openTickets > 0 && (
              <motion.span
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-white font-bold"
                style={{ fontSize: '8px', background: '#EF4444', boxShadow: '0 0 8px rgba(239,68,68,0.6)' }}
              >
                {ADMIN_STATS.openTickets}
              </motion.span>
            )}
          </button>

          {/* Notification dropdown */}
          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full right-0 mt-2 w-72 rounded-2xl overflow-hidden z-50"
                style={{ background: '#0D0D1A', border: '1px solid rgba(124,58,237,0.2)', boxShadow: '0 16px 40px rgba(0,0,0,0.6)' }}
              >
                <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span className="font-heading font-semibold text-white" style={{ fontSize: '13px' }}>{t.topbar.notifications}</span>
                  <span
                    className="font-pixel rounded-md px-1.5 py-0.5"
                    style={{ fontSize: '7px', color: '#EF4444', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
                  >
                    {ADMIN_STATS.openTickets} {t.topbar.newBadge}
                  </span>
                </div>
                {[
                  { text: 'Новый тикет: Ключ не активируется', time: '2 мин', color: '#EF4444' },
                  { text: 'Заказ #ARC-45229 требует Steam Gift', time: '8 мин', color: '#F59E0B' },
                  { text: 'Ошибка оплаты Click - проверьте', time: '22 мин', color: '#EF4444' },
                  { text: '+6,390,000 сум выручки сегодня', time: '1 ч', color: '#22C55E' },
                ].map((n, i) => (
                  <div key={i} className="flex items-start gap-3 px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: n.color, boxShadow: `0 0 4px ${n.color}` }} />
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-[#9CA3AF] text-xs leading-relaxed">{n.text}</p>
                      <p className="font-body text-[#374151]" style={{ fontSize: '10px' }}>{n.time} назад</p>
                    </div>
                  </div>
                ))}
                <div className="px-4 py-3">
                  <Link href="/admin/support" onClick={() => setNotif(false)} className="font-body text-[#7C3AED] hover:text-[#9D60FA] transition-colors" style={{ fontSize: '12px' }}>
                    Смотреть все тикеты →
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Admin badge */}
        <div
          className="hidden sm:flex items-center gap-2 rounded-xl px-3 py-2"
          style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.18)' }}
        >
          <div
            className="w-5 h-5 rounded-md flex items-center justify-center font-heading font-bold text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #06B6D4)', fontSize: '10px' }}
          >
            A
          </div>
          <span className="font-body text-[#C4B5FD]" style={{ fontSize: '12px' }}>Admin</span>
        </div>
      </div>
    </header>
  );
}
