'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart, CreditCard, ArrowLeft, ChevronRight,
  Trash2, Tag, Check, Shield, Zap, Package, Mail, AtSign,
} from 'lucide-react';
import { products } from '@/lib/mockData';
import { formatPrice } from '@/lib/utils';

import CheckoutInput    from '@/components/checkout/CheckoutInput';
import PaymentMethods   from '@/components/checkout/PaymentMethods';
import DeliveryTypes    from '@/components/checkout/DeliveryTypes';
import ProcessingOverlay from '@/components/checkout/ProcessingOverlay';
import SuccessScreen    from '@/components/checkout/SuccessScreen';

/* ── Mock cart ────────────────────────────────────────── */
const INITIAL_CART = [
  { product: products[0], quantity: 1, platform: 'PC'  },
  { product: products[1], quantity: 1, platform: 'PS5' },
];

const STEPS = ['cart', 'payment', 'processing', 'success'] as const;
type Step = typeof STEPS[number];

/* ── Section card wrapper ─────────────────────────────── */
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl overflow-hidden ${className}`}
      style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      {children}
    </div>
  );
}

function CardHeader({ icon, title, count }: { icon: React.ReactNode; title: string; count?: number }) {
  return (
    <div
      className="flex items-center gap-3 px-5 py-4"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.055)' }}
    >
      <div className="text-[#7C3AED]">{icon}</div>
      <span className="font-heading font-semibold text-white" style={{ fontSize: '14px' }}>
        {title}
        {count !== undefined && (
          <span className="ml-2 font-pixel text-[#4B5563]" style={{ fontSize: '8px' }}>
            ({count})
          </span>
        )}
      </span>
    </div>
  );
}

/* ── Step progress indicator ──────────────────────────── */
function StepIndicator({ current }: { current: Step }) {
  const visibleSteps = [
    { id: 'cart',    label: 'Корзина' },
    { id: 'payment', label: 'Оплата'  },
  ] as const;

  return (
    <div className="flex items-center gap-3">
      {visibleSteps.map((s, i) => {
        const isDone = (current === 'payment' || current === 'success' || current === 'processing') && s.id === 'cart';
        const isCurrent = current === s.id;
        return (
          <div key={s.id} className="flex items-center gap-3">
            <div
              className="flex items-center gap-2 font-heading font-semibold"
              style={{ fontSize: '13px', color: isCurrent ? '#E2E8F0' : isDone ? '#7C3AED' : '#374151' }}
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: isCurrent
                    ? 'linear-gradient(135deg, #7C3AED, #06B6D4)'
                    : isDone
                    ? '#7C3AED'
                    : '#0D0D16',
                  border: !isCurrent && !isDone ? '1px solid rgba(255,255,255,0.08)' : 'none',
                  boxShadow: isCurrent ? '0 0 12px rgba(124,58,237,0.5)' : 'none',
                }}
              >
                {isDone ? (
                  <Check style={{ width: '12px', height: '12px', color: '#fff' }} />
                ) : (
                  <span style={{ fontSize: '10px', color: isCurrent ? '#fff' : '#4B5563' }}>
                    {i + 1}
                  </span>
                )}
              </div>
              {s.label}
            </div>
            {i < visibleSteps.length - 1 && (
              <ChevronRight style={{ width: '14px', height: '14px', color: '#1F2937' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Promo code input ─────────────────────────────────── */
function PromoSection({
  code, setCode, applied, onApply,
}: { code: string; setCode: (v: string) => void; applied: boolean; onApply: () => void }) {
  return (
    <Card>
      <CardHeader icon={<Tag className="w-4 h-4" />} title="Промокод" />
      <div className="p-5">
        <div className="flex gap-2.5">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="ARCANE10"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              disabled={applied}
              className="w-full font-body text-white outline-none transition-all duration-200 placeholder:text-[#2D2D44]"
              style={{
                background: '#07070D',
                border: `1px solid ${applied ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: '12px',
                padding: '11px 14px',
                fontSize: '13.5px',
                letterSpacing: '0.05em',
              }}
            />
          </div>
          <motion.button
            whileHover={{ scale: applied ? 1 : 1.02 }}
            whileTap={{ scale: applied ? 1 : 0.97 }}
            onClick={onApply}
            disabled={applied || !code}
            className="relative overflow-hidden rounded-xl font-heading font-semibold text-white flex-shrink-0 px-5"
            style={{
              background: applied
                ? 'rgba(34,197,94,0.15)'
                : !code
                ? '#0D0D16'
                : 'linear-gradient(135deg, #7C3AED, #5B21B6)',
              border: applied
                ? '1px solid rgba(34,197,94,0.35)'
                : '1px solid rgba(124,58,237,0.3)',
              fontSize: '13px',
              color: applied ? '#22C55E' : !code ? '#374151' : '#fff',
              cursor: applied || !code ? 'not-allowed' : 'pointer',
              boxShadow: !applied && code ? '0 0 16px rgba(124,58,237,0.3)' : 'none',
            }}
          >
            {applied ? (
              <span className="flex items-center gap-1.5">
                <Check style={{ width: '14px', height: '14px' }} />
                Применён
              </span>
            ) : 'Применить'}
          </motion.button>
        </div>
        {applied && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-body text-[#22C55E] mt-2"
            style={{ fontSize: '11.5px' }}
          >
            ✓ Скидка 10% применена
          </motion.p>
        )}
      </div>
    </Card>
  );
}

/* ── Arcane Coins toggle ──────────────────────────────── */
function CoinsSection({
  active, onToggle, discount,
}: { active: boolean; onToggle: () => void; discount: number }) {
  return (
    <Card>
      <div className="p-5 flex items-center justify-between gap-4">
        {/* Left */}
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ boxShadow: active ? '0 0 16px rgba(124,58,237,0.5)' : 'none' }}
            transition={{ duration: 0.3 }}
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: active
                ? 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(6,182,212,0.2))'
                : 'rgba(124,58,237,0.08)',
              border: `1px solid ${active ? 'rgba(124,58,237,0.4)' : 'rgba(124,58,237,0.18)'}`,
            }}
          >
            <Zap style={{ width: '16px', height: '16px', color: '#9D60FA' }} />
          </motion.div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-semibold text-white" style={{ fontSize: '13.5px' }}>
                Arcane Coins
              </span>
              <span
                className="font-pixel rounded-full"
                style={{
                  fontSize: '7.5px',
                  color: '#9D60FA',
                  background: 'rgba(124,58,237,0.12)',
                  border: '1px solid rgba(124,58,237,0.22)',
                  padding: '2px 7px',
                  letterSpacing: '0.06em',
                }}
              >
                1 250
              </span>
            </div>
            <p className="font-body text-[#6B7280] mt-0.5" style={{ fontSize: '11px' }}>
              {active ? `Скидка: −${formatPrice(discount)}` : `Доступно: −${formatPrice(discount)}`}
            </p>
          </div>
        </div>

        {/* Toggle */}
        <motion.button
          animate={{ background: active ? 'linear-gradient(90deg, #7C3AED, #06B6D4)' : '#1A1A28' }}
          transition={{ duration: 0.25 }}
          onClick={onToggle}
          className="relative w-11 h-6 rounded-full flex-shrink-0 cursor-pointer"
          style={{ border: `1px solid ${active ? 'transparent' : 'rgba(255,255,255,0.1)'}` }}
        >
          <motion.div
            animate={{ x: active ? 21 : 2 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="absolute top-[3px] w-4 h-4 bg-white rounded-full"
            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.4)' }}
          />
        </motion.button>
      </div>
    </Card>
  );
}

/* ── Order summary sidebar ────────────────────────────── */
function OrderSummary({
  items, subtotal, promoDiscount, coinsDiscount, total,
  step, onNext, onBack, processing,
}: {
  items: typeof INITIAL_CART;
  subtotal: number; promoDiscount: number; coinsDiscount: number; total: number;
  step: Step; onNext: () => void; onBack?: () => void; processing: boolean;
}) {
  const coinsToEarn = Math.round(total / 1000);

  return (
    <div className="sticky top-[132px]">
      <Card>
        {/* Header */}
        <div
          className="px-5 py-4 flex items-center justify-between"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.055)' }}
        >
          <span
            className="font-heading font-semibold text-[#9CA3AF]"
            style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase' }}
          >
            Ваш заказ
          </span>
          <span className="font-pixel text-[#4B5563]" style={{ fontSize: '7.5px' }}>
            {items.length} позиции
          </span>
        </div>

        {/* Items */}
        <div className="px-5 py-4 space-y-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.055)' }}>
          {items.map((item) => (
            <div key={item.product.id} className="flex items-center gap-3">
              <div className="relative w-10 h-12 rounded-xl overflow-hidden flex-shrink-0">
                <Image src={item.product.image} alt={item.product.title} fill className="object-cover" unoptimized />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-heading font-semibold text-white line-clamp-1" style={{ fontSize: '12.5px' }}>
                  {item.product.title}
                </p>
                <p className="font-body text-[#4B5563] mt-0.5" style={{ fontSize: '10.5px' }}>
                  {item.platform} · RU/CIS
                </p>
              </div>
              <span className="font-heading font-bold text-white flex-shrink-0" style={{ fontSize: '12.5px' }}>
                {formatPrice(item.product.price)}
              </span>
            </div>
          ))}
        </div>

        {/* Price breakdown */}
        <div className="px-5 py-4 space-y-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.055)' }}>
          <div className="flex justify-between">
            <span className="font-body text-[#6B7280]" style={{ fontSize: '13px' }}>Подытог</span>
            <span className="font-body text-[#9CA3AF]" style={{ fontSize: '13px' }}>{formatPrice(subtotal)}</span>
          </div>
          <AnimatePresence>
            {promoDiscount > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex justify-between"
              >
                <span className="font-body text-[#22C55E]" style={{ fontSize: '13px' }}>Промокод −10%</span>
                <span className="font-body text-[#22C55E]" style={{ fontSize: '13px' }}>−{formatPrice(promoDiscount)}</span>
              </motion.div>
            )}
            {coinsDiscount > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex justify-between"
              >
                <span className="font-body text-[#9D60FA] flex items-center gap-1" style={{ fontSize: '13px' }}>
                  <Zap style={{ width: '11px', height: '11px' }} />Arcane Coins
                </span>
                <span className="font-body text-[#9D60FA]" style={{ fontSize: '13px' }}>−{formatPrice(coinsDiscount)}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Total */}
        <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.055)' }}>
          <div className="flex items-baseline justify-between">
            <span className="font-heading font-bold text-white">К оплате</span>
            <motion.span
              key={total}
              initial={{ scale: 1.05 }}
              animate={{ scale: 1 }}
              className="font-heading font-bold text-white"
              style={{ fontSize: '20px' }}
            >
              {formatPrice(total)}
            </motion.span>
          </div>

          {/* Coins to earn */}
          <div
            className="flex items-center gap-2 mt-3 rounded-xl px-3 py-2"
            style={{ background: 'rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.15)' }}
          >
            <Zap style={{ width: '12px', height: '12px', color: '#9D60FA', flexShrink: 0 }} />
            <span className="font-body text-[#9D60FA]" style={{ fontSize: '11.5px' }}>
              Получите +{coinsToEarn} Arcane Coins
            </span>
          </div>
        </div>

        {/* CTA */}
        <div className="p-4 space-y-2.5">
          <motion.button
            whileHover={!processing && items.length > 0 ? { scale: 1.015 } : {}}
            whileTap={!processing && items.length > 0 ? { scale: 0.985 } : {}}
            onClick={onNext}
            disabled={items.length === 0 || processing}
            className="group relative w-full flex items-center justify-center gap-2 rounded-xl font-heading font-semibold text-white overflow-hidden transition-all duration-200"
            style={{
              background: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 60%, #06B6D4 130%)',
              padding: '14px 20px',
              fontSize: '14px',
              letterSpacing: '0.025em',
              boxShadow: items.length > 0
                ? '0 0 0 1px rgba(124,58,237,0.4), 0 4px 24px rgba(124,58,237,0.3)'
                : 'none',
              opacity: items.length === 0 ? 0.4 : 1,
              cursor: items.length === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            <span
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 55%)' }}
            />
            <CreditCard style={{ width: '16px', height: '16px' }} className="relative z-10" />
            <span className="relative z-10">
              {step === 'cart' ? 'К оплате' : `Оплатить ${formatPrice(total)}`}
            </span>
            <ChevronRight style={{ width: '16px', height: '16px' }} className="relative z-10" />
          </motion.button>

          {onBack && step === 'payment' && (
            <button
              onClick={onBack}
              className="w-full flex items-center justify-center gap-2 rounded-xl font-heading font-medium transition-all duration-200"
              style={{
                background: '#09090E',
                border: '1px solid rgba(255,255,255,0.07)',
                padding: '11px 20px',
                fontSize: '13px',
                color: '#4B5563',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.color = '#9CA3AF';
                el.style.borderColor = 'rgba(255,255,255,0.12)';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.color = '#4B5563';
                el.style.borderColor = 'rgba(255,255,255,0.07)';
              }}
            >
              <ArrowLeft style={{ width: '14px', height: '14px' }} />
              Назад в корзину
            </button>
          )}

          {/* Security badge */}
          <div className="flex items-center justify-center gap-2 pt-1">
            <Shield style={{ width: '12px', height: '12px', color: '#22C55E' }} />
            <span className="font-body text-[#374151]" style={{ fontSize: '11px' }}>
              SSL-шифрование · Безопасная оплата
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ══════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════ */
export default function CheckoutPage() {
  const [step, setStep]           = useState<Step>('cart');
  const [items, setItems]         = useState(INITIAL_CART);
  const [payMethod, setPayMethod] = useState('payme');
  const [delivery, setDelivery]   = useState('instant');
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [useCoins, setUseCoins]   = useState(false);
  const [email, setEmail]         = useState('');
  const [telegram, setTelegram]   = useState('');
  const [emailError, setEmailError] = useState('');
  const orderNumber = useRef(`ARC-${Math.floor(10000 + Math.random() * 90000)}`).current;

  const subtotal      = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const promoDiscount = promoApplied ? Math.round(subtotal * 0.1) : 0;
  const coinsDiscount = useCoins ? 12500 : 0;
  const total         = Math.max(0, subtotal - promoDiscount - coinsDiscount);

  const validateEmail = (val: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  const handlePromo = () => {
    if (promoCode === 'ARCANE10') setPromoApplied(true);
  };

  const handleNext = () => {
    if (step === 'cart') {
      if (!validateEmail(email)) {
        setEmailError('Введите корректный email');
        return;
      }
      setEmailError('');
      setStep('payment');
    } else if (step === 'payment') {
      setStep('processing');
    }
  };

  const removeItem = (id: string) =>
    setItems((prev) => prev.filter((i) => i.product.id !== id));

  /* ── Success / Processing ── */
  if (step === 'success') {
    return <SuccessScreen items={items} total={total} email={email} orderNumber={orderNumber} />;
  }

  return (
    <>
      {/* Processing overlay */}
      <AnimatePresence>
        {step === 'processing' && (
          <ProcessingOverlay key="processing" onComplete={() => setStep('success')} />
        )}
      </AnimatePresence>

      <div className="min-h-screen" style={{ background: '#05040B', paddingTop: '120px' }}>
        {/* Section ambient glow */}
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 70% 40% at 50% 0%, rgba(124,58,237,0.05) 0%, transparent 70%)',
          }}
        />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

          {/* Page header */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mb-8"
          >
            <Link
              href="/catalog"
              className="inline-flex items-center gap-2 font-body mb-4 transition-colors duration-200 text-[#4B5563] hover:text-[#9CA3AF]"
              style={{ fontSize: '13px' }}
            >
              <ArrowLeft style={{ width: '14px', height: '14px' }} />
              Продолжить покупки
            </Link>

            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <p
                  className="font-heading font-semibold text-[#7C3AED] mb-1"
                  style={{ fontSize: '11px', letterSpacing: '0.13em', textTransform: 'uppercase' }}
                >
                  Arcane Store
                </p>
                <h1 className="font-heading font-bold text-white" style={{ fontSize: 'clamp(22px, 3vw, 30px)' }}>
                  Оформление заказа
                </h1>
              </div>
              <StepIndicator current={step} />
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-[1fr_360px] gap-5">

            {/* ── LEFT: Main content ── */}
            <div className="min-w-0">
              <AnimatePresence mode="wait">

                {/* ═══ CART STEP ═══ */}
                {step === 'cart' && (
                  <motion.div
                    key="cart"
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 16 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="space-y-4"
                  >
                    {/* Cart items */}
                    <Card>
                      <CardHeader
                        icon={<ShoppingCart className="w-4 h-4" />}
                        title="Корзина"
                        count={items.length}
                      />
                      {items.length === 0 ? (
                        <div className="p-10 text-center">
                          <Package
                            className="mx-auto mb-3 text-[#1F2937]"
                            style={{ width: '36px', height: '36px' }}
                          />
                          <p className="font-body text-[#4B5563] mb-3" style={{ fontSize: '14px' }}>
                            Корзина пуста
                          </p>
                          <Link
                            href="/catalog"
                            className="font-body text-[#7C3AED] hover:text-[#9D60FA] transition-colors"
                            style={{ fontSize: '13px' }}
                          >
                            Перейти в каталог →
                          </Link>
                        </div>
                      ) : (
                        <div className="divide-y divide-white/[0.05]">
                          {items.map((item) => (
                            <div key={item.product.id} className="flex gap-4 px-5 py-4">
                              <div className="relative w-14 h-18 rounded-xl overflow-hidden flex-shrink-0"
                                   style={{ height: '72px' }}>
                                <Image src={item.product.image} alt={item.product.title} fill
                                  className="object-cover" unoptimized />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <p className="font-body text-[#374151] mb-0.5" style={{ fontSize: '11px' }}>
                                      {item.product.subtitle}
                                    </p>
                                    <h3 className="font-heading font-semibold text-white line-clamp-1"
                                        style={{ fontSize: '14px' }}>
                                      {item.product.title}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span
                                        className="font-pixel rounded"
                                        style={{
                                          fontSize: '7.5px',
                                          color: '#9D60FA',
                                          background: 'rgba(124,58,237,0.1)',
                                          border: '1px solid rgba(124,58,237,0.2)',
                                          padding: '1.5px 5px',
                                          letterSpacing: '0.06em',
                                        }}
                                      >
                                        {item.platform}
                                      </span>
                                      <span className="font-body text-[#374151]" style={{ fontSize: '10.5px' }}>
                                        RU/CIS · Мгновенно
                                      </span>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => removeItem(item.product.id)}
                                    className="p-1.5 rounded-lg transition-all duration-200 text-[#374151] hover:text-[#F87171] hover:bg-red-400/10 flex-shrink-0"
                                  >
                                    <Trash2 style={{ width: '14px', height: '14px' }} />
                                  </button>
                                </div>
                                <div className="flex items-center justify-end mt-2">
                                  <span className="font-heading font-bold text-white" style={{ fontSize: '15px' }}>
                                    {formatPrice(item.product.price)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>

                    {/* Delivery types */}
                    <Card>
                      <CardHeader icon={<Zap className="w-4 h-4" />} title="Способ получения" />
                      <div className="p-5">
                        <DeliveryTypes selected={delivery} onSelect={setDelivery} />
                      </div>
                    </Card>

                    {/* Email */}
                    <Card>
                      <CardHeader icon={<Mail className="w-4 h-4" />} title="Данные получения" />
                      <div className="p-5 space-y-3.5">
                        <CheckoutInput
                          label="Email для ключей активации"
                          type="email"
                          placeholder="your@email.com"
                          value={email}
                          onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                          icon={<Mail style={{ width: '15px', height: '15px' }} />}
                          error={emailError}
                          success={!!email && validateEmail(email)}
                          hint="Ключ активации придёт сразу после оплаты"
                        />
                        <CheckoutInput
                          label="Telegram (необязательно)"
                          type="text"
                          placeholder="@username"
                          value={telegram}
                          onChange={(e) => setTelegram(e.target.value)}
                          icon={<AtSign style={{ width: '15px', height: '15px' }} />}
                          hint="Для уведомлений и поддержки"
                        />
                      </div>
                    </Card>

                    {/* Promo */}
                    <PromoSection
                      code={promoCode}
                      setCode={setPromoCode}
                      applied={promoApplied}
                      onApply={handlePromo}
                    />

                    {/* Arcane Coins */}
                    <CoinsSection
                      active={useCoins}
                      onToggle={() => setUseCoins(!useCoins)}
                      discount={coinsDiscount || 12500}
                    />
                  </motion.div>
                )}

                {/* ═══ PAYMENT STEP ═══ */}
                {step === 'payment' && (
                  <motion.div
                    key="payment"
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="space-y-4"
                  >
                    {/* Payment methods */}
                    <Card>
                      <CardHeader icon={<CreditCard className="w-4 h-4" />} title="Способ оплаты" />
                      <div className="p-5">
                        <PaymentMethods selected={payMethod} onSelect={setPayMethod} />
                      </div>
                    </Card>

                    {/* Security badge */}
                    <div
                      className="flex items-center gap-3.5 rounded-2xl p-4"
                      style={{
                        background: 'rgba(34,197,94,0.05)',
                        border: '1px solid rgba(34,197,94,0.18)',
                      }}
                    >
                      <Shield style={{ width: '18px', height: '18px', color: '#22C55E', flexShrink: 0 }} />
                      <div>
                        <p className="font-heading font-semibold text-white" style={{ fontSize: '13px' }}>
                          Безопасная оплата
                        </p>
                        <p className="font-body text-[#4B5563] mt-0.5" style={{ fontSize: '11.5px' }}>
                          SSL-шифрование. Мы не храним платёжные данные.
                        </p>
                      </div>
                    </div>

                    {/* Supported methods note */}
                    <p className="font-body text-[#374151] text-center" style={{ fontSize: '11.5px' }}>
                      Поддерживаются Click, Payme, UzCard, HUMO, Uzum Bank
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── RIGHT: Summary ── */}
            <div>
              <OrderSummary
                items={items}
                subtotal={subtotal}
                promoDiscount={promoDiscount}
                coinsDiscount={coinsDiscount}
                total={total}
                step={step}
                onNext={handleNext}
                onBack={() => setStep('cart')}
                processing={step === 'processing'}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
