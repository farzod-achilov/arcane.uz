'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Package, ShoppingBag, Users, Tag,
  Zap, Gift, MessageSquare, BarChart2,
  ChevronLeft, ChevronRight, Shield, LogOut, KeyRound, TrendingUp, Gamepad2, Truck, Wallet, Ticket, Layers, Star, Image, CreditCard,
} from 'lucide-react';
import { useT } from '@/lib/i18n';

export default function AdminSidebar({
  collapsed, onToggle,
}: {
  collapsed: boolean;
  onToggle:  () => void;
}) {
  const pathname = usePathname();
  const { t }    = useT();

  const NAV_ITEMS = [
    { href: '/admin',                     label: t.nav.dashboard,    icon: LayoutDashboard, color: '#7C3AED' },
    { href: '/admin/products',            label: t.nav.products,     icon: Package,         color: '#06B6D4' },
    { href: '/admin/keys',                label: t.nav.keys,         icon: KeyRound,        color: '#22C55E' },
    { href: '/admin/orders',              label: t.nav.orders,       icon: ShoppingBag,     color: '#F59E0B' },
    { href: '/admin/deliveries',          label: 'Доставка',         icon: Truck,           color: '#22C55E' },
    { href: '/admin/users',               label: t.nav.users,        icon: Users,           color: '#06B6D4' },
    { href: '/admin/discounts',           label: t.nav.discounts,    icon: Tag,             color: '#EF4444' },
    { href: '/admin/coins',               label: t.nav.coins,        icon: Zap,             color: '#F59E0B' },
    { href: '/admin/cases',               label: t.nav.cases,        icon: Gift,            color: '#9D60FA' },
    { href: '/admin/deposits',            label: 'Пополнения',       icon: Wallet,          color: '#06B6D4' },
    { href: '/admin/cards',               label: 'Карты (P2P)',      icon: CreditCard,      color: '#7C3AED' },
    { href: '/admin/promo-codes',         label: 'Промокоды',        icon: Ticket,          color: '#22C55E' },
    { href: '/admin/price-control',       label: t.nav.priceControl, icon: TrendingUp,      color: '#22C55E' },
    { href: '/admin/smart-pricing',       label: t.nav.smartPricing, icon: BarChart2,       color: '#F59E0B' },
    { href: '/admin/smart-pricing/games', label: t.nav.gamePricing,  icon: Gamepad2,        color: '#9D60FA' },
    { href: '/admin/bulk-pricing',        label: 'Массовые цены',    icon: Layers,          color: '#7C3AED' },
    { href: '/admin/steam-import',        label: 'Steam Import',     icon: Gamepad2,        color: '#1E90FF' },
    { href: '/admin/banners',             label: 'Баннеры',          icon: Image,           color: '#7C3AED' },
    { href: '/admin/reviews',              label: 'Отзывы',           icon: Star,            color: '#F59E0B' },
    { href: '/admin/support',             label: t.nav.support,      icon: MessageSquare,   color: '#06B6D4' },
    { href: '/admin/analytics',           label: t.nav.analytics,    icon: BarChart2,       color: '#7C3AED' },
  ];

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 224 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col h-full overflow-hidden relative flex-shrink-0"
      style={{
        background: 'linear-gradient(180deg, #080812 0%, #06060F 100%)',
        borderRight: '1px solid rgba(124,58,237,0.12)',
      }}
    >
      {/* Top glow */}
      <div className="absolute top-0 left-0 right-0 h-px pointer-events-none"
           style={{ background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.4), transparent)' }} />
      <div className="absolute top-0 left-0 right-0 h-48 pointer-events-none"
           style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.06) 0%, transparent 70%)' }} />

      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 flex-shrink-0"
           style={{ borderBottom: '1px solid rgba(124,58,237,0.1)' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
             style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', boxShadow: '0 0 12px rgba(124,58,237,0.5)' }}>
          <Shield style={{ width: '14px', height: '14px', color: '#fff' }} />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }} className="overflow-hidden">
              <p className="font-heading font-bold text-white" style={{ fontSize: '13px', whiteSpace: 'nowrap' }}>ARCANE.UZ</p>
              <p className="font-pixel text-[#374151]" style={{ fontSize: '6px', letterSpacing: '0.12em', whiteSpace: 'nowrap' }}>ADMIN PANEL</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-2.5 mx-2 my-0.5 rounded-xl transition-all duration-200 group relative overflow-hidden"
              style={{
                background:  active ? `${item.color}12` : 'transparent',
                borderLeft:  `2px solid ${active ? item.color : 'transparent'}`,
              }}
              title={collapsed ? item.label : undefined}
            >
              <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    style={{ background: `${item.color}08` }} />
              <item.icon style={{
                width: '16px', height: '16px',
                color: active ? item.color : '#4B5563',
                flexShrink: 0, transition: 'color 0.2s', position: 'relative', zIndex: 1,
              }} className="group-hover:!text-[#9CA3AF]" />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.18 }}
                    className="font-body relative z-10 whitespace-nowrap"
                    style={{ fontSize: '13px', color: active ? '#E2E8F0' : '#6B7280' }}>
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {active && (
                <motion.div layoutId="adminNavDot"
                  className="ml-auto flex-shrink-0 w-1.5 h-1.5 rounded-full relative z-10"
                  style={{
                    background: item.color,
                    boxShadow: `0 0 6px ${item.color}`,
                    display: collapsed ? 'none' : 'block',
                  }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Profile */}
      <div className="flex-shrink-0 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        {!collapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="mx-3 mt-2 p-3 rounded-xl"
            style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.15)' }}>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 font-heading font-bold text-white"
                   style={{ background: 'linear-gradient(135deg, #7C3AED, #06B6D4)', fontSize: '11px' }}>
                A
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-heading font-semibold text-white truncate" style={{ fontSize: '12px' }}>Admin</p>
                <p className="font-body text-[#374151] truncate" style={{ fontSize: '10px' }}>admin@arcane.uz</p>
              </div>
              <LogOut style={{ width: '13px', height: '13px', color: '#374151', flexShrink: 0 }} />
            </div>
          </motion.div>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="absolute -right-3.5 top-20 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200"
        style={{
          background: '#0D0D1A',
          border: '1px solid rgba(124,58,237,0.25)',
          boxShadow: '0 0 10px rgba(124,58,237,0.12)',
          color: '#4B5563',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#7C3AED'; (e.currentTarget as HTMLElement).style.boxShadow = '0 0 14px rgba(124,58,237,0.3)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#4B5563'; (e.currentTarget as HTMLElement).style.boxShadow = '0 0 10px rgba(124,58,237,0.12)'; }}
      >
        {collapsed
          ? <ChevronRight style={{ width: '13px', height: '13px' }} />
          : <ChevronLeft  style={{ width: '13px', height: '13px' }} />}
      </button>
    </motion.aside>
  );
}
