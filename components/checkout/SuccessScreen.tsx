'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Check, Send, ArrowRight, Zap } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import type { Product } from '@/lib/types';

interface CartItem { product: Product; quantity: number; platform: string }

interface SuccessScreenProps {
  items: CartItem[];
  total: number;
  email: string;
  orderNumber: string;
}

/* ── Burst particles ──────────────────────────────────── */
const BURST = Array.from({ length: 12 }, (_, i) => {
  const angle = (i / 12) * 360;
  const dist  = 60 + (i % 3) * 20;
  return {
    id: i,
    x: Math.cos((angle * Math.PI) / 180) * dist,
    y: Math.sin((angle * Math.PI) / 180) * dist,
    color: i % 3 === 0 ? '#7C3AED' : i % 3 === 1 ? '#06B6D4' : '#F59E0B',
    size: 2 + (i % 3),
  };
});

/* ── Animated coin counter ───────────────────────────── */
function CoinCounter({ target }: { target: number }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let frame = 0;
    const total = 60;
    const id = setInterval(() => {
      frame++;
      const t = frame / total;
      setCount(Math.round(t < 1 ? target * (1 - Math.pow(1 - t, 3)) : target));
      if (frame >= total) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
  }, [target]);
  return <>{count.toLocaleString('ru')}</>;
}

export default function SuccessScreen({ items, total, email, orderNumber }: SuccessScreenProps) {
  const coinsEarned = Math.round(total / 1000);

  return (
    <div className="min-h-screen flex items-start justify-center pt-10 pb-20 px-4"
         style={{ background: '#05040B' }}>
      {/* Grid background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(124,58,237,1) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,1) 1px, transparent 1px)',
          backgroundSize: '52px 52px',
          opacity: 0.02,
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        {/* ── Success icon with burst ── */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            {/* Burst particles */}
            {BURST.map((p) => (
              <motion.div
                key={p.id}
                initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                animate={{ x: p.x, y: p.y, opacity: [0, 0.9, 0], scale: [0, 1.2, 0] }}
                transition={{ duration: 0.7, delay: 0.2 + p.id * 0.02, ease: 'easeOut' }}
                className="absolute rounded-full pointer-events-none"
                style={{
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                  background: p.color,
                  left: '50%',
                  top: '50%',
                  boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
                }}
              />
            ))}

            {/* Outer ring pulse */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0.8 }}
              animate={{ scale: 1.8, opacity: 0 }}
              transition={{ duration: 0.9, ease: 'easeOut', delay: 0.15 }}
              className="absolute inset-0 rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.4), transparent 70%)' }}
            />

            {/* Icon circle */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22, delay: 0.1 }}
              className="relative w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
                boxShadow: '0 0 40px rgba(124,58,237,0.5), 0 0 80px rgba(124,58,237,0.2)',
              }}
            >
              <Check className="w-9 h-9 text-white" strokeWidth={2.5} />
            </motion.div>
          </div>
        </div>

        {/* ── Order header ── */}
        <div className="text-center mb-7">
          <div
            className="font-pixel text-[#7C3AED]/60 mb-2"
            style={{ fontSize: '8px', letterSpacing: '0.12em' }}
          >
            ЗАКАЗ #{orderNumber}
          </div>
          <h1
            className="font-heading font-bold text-white mb-2"
            style={{ fontSize: 'clamp(24px, 4vw, 32px)' }}
          >
            Оплата прошла!
          </h1>
          <p className="font-body text-[#6B7280]" style={{ fontSize: '14px', lineHeight: '1.6' }}>
            Ключи активации отправлены на{' '}
            <span className="text-[#9D60FA]">{email || 'your@email.com'}</span>
          </p>
        </div>

        {/* ── Order items card ── */}
        <div
          className="rounded-2xl overflow-hidden mb-4"
          style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div
            className="px-5 py-3.5 flex items-center justify-between"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
          >
            <span className="font-heading font-semibold text-[#9CA3AF]"
                  style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Детали заказа
            </span>
          </div>

          <div className="divide-y divide-white/[0.05]">
            {items.map((item) => (
              <div key={item.product.id} className="flex items-center gap-3.5 px-5 py-3.5">
                <div className="relative w-10 h-12 rounded-xl overflow-hidden flex-shrink-0">
                  <Image src={item.product.image} alt={item.product.title} fill
                    className="object-cover" unoptimized />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-heading font-semibold text-white line-clamp-1"
                     style={{ fontSize: '13px' }}>{item.product.title}</p>
                  <p className="font-body text-[#4B5563] mt-0.5" style={{ fontSize: '11px' }}>
                    {item.platform} · RU/CIS
                  </p>
                </div>
                <p className="font-heading font-bold text-white flex-shrink-0"
                   style={{ fontSize: '13px' }}>{formatPrice(item.product.price)}</p>
              </div>
            ))}
          </div>

          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
          >
            <span className="font-heading font-bold text-white">Итого</span>
            <span className="font-heading font-bold text-white" style={{ fontSize: '18px' }}>
              {formatPrice(total)}
            </span>
          </div>
        </div>

        {/* ── Arcane Coins earned ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl p-4 mb-4 flex items-center gap-4"
          style={{
            background: 'rgba(124,58,237,0.08)',
            border: '1px solid rgba(124,58,237,0.22)',
            boxShadow: '0 0 24px rgba(124,58,237,0.08)',
          }}
        >
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(6,182,212,0.2))',
              border: '1px solid rgba(124,58,237,0.3)',
            }}
          >
            <Zap className="w-5 h-5 text-[#9D60FA]" />
          </div>
          <div>
            <p className="font-heading font-semibold text-white" style={{ fontSize: '14px' }}>
              +<CoinCounter target={coinsEarned} /> Arcane Coins
            </p>
            <p className="font-body text-[#6B7280]" style={{ fontSize: '12px' }}>
              Начислены на ваш аккаунт
            </p>
          </div>
        </motion.div>

        {/* ── Telegram support CTA ── */}
        <motion.a
          href="https://t.me/arcaneuz_support"
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          whileHover={{ scale: 1.01 }}
          className="flex items-center gap-3.5 rounded-2xl p-4 mb-5 cursor-pointer"
          style={{
            background: 'rgba(6,182,212,0.06)',
            border: '1px solid rgba(6,182,212,0.18)',
          }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: 'rgba(6,182,212,0.12)',
              border: '1px solid rgba(6,182,212,0.25)',
            }}
          >
            <Send className="w-4 h-4 text-[#06B6D4]" />
          </div>
          <div className="flex-1">
            <p className="font-heading font-semibold text-white" style={{ fontSize: '13px' }}>
              Нужна помощь с активацией?
            </p>
            <p className="font-body text-[#4B5563]" style={{ fontSize: '11px' }}>
              @arcaneuz_support · ответ за 5 мин
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-[#06B6D4]" />
        </motion.a>

        {/* ── CTA buttons ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75 }}
          className="flex gap-3"
        >
          <Link
            href="/catalog"
            className="flex-1 group relative inline-flex items-center justify-center gap-2 rounded-xl font-heading font-semibold text-white overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 60%, #06B6D4 130%)',
              padding: '13px 20px',
              fontSize: '14px',
              boxShadow: '0 0 0 1px rgba(124,58,237,0.4), 0 4px 20px rgba(124,58,237,0.3)',
            }}
          >
            <span
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 55%)' }}
            />
            <span className="relative z-10">Продолжить покупки</span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl font-heading font-medium transition-all duration-200"
            style={{
              background: '#0D0D16',
              border: '1px solid rgba(255,255,255,0.08)',
              padding: '13px 18px',
              fontSize: '14px',
              color: '#6B7280',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.color = '#E2E8F0';
              el.style.borderColor = 'rgba(255,255,255,0.14)';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.color = '#6B7280';
              el.style.borderColor = 'rgba(255,255,255,0.08)';
            }}
          >
            Главная
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
