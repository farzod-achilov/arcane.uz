'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart, CreditCard, ArrowLeft, ChevronRight,
  Trash2, Tag, Check, Shield, Zap, Package, Mail, AtSign,
  CheckCircle2, ArrowRight, Loader2, AlertCircle,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';

import CheckoutInput     from '@/components/checkout/CheckoutInput';
import PaymentMethods    from '@/components/checkout/PaymentMethods';
import ProcessingOverlay from '@/components/checkout/ProcessingOverlay';
import { useCart } from '@/lib/cartContext';

/* ── Types ────────────────────────────────────────────── */
interface CheckoutItem {
  gameId:       string;
  title:        string;
  cover:        string | null;
  priceUzs:     number;
  deliveryType: 'AUTO' | 'MANUAL';
}

const STEPS = ['cart', 'payment', 'processing', 'success'] as const;
type Step = typeof STEPS[number];

/* ── Helpers ─────────────────────────────────────────── */
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl overflow-hidden ${className}`}
         style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.07)' }}>
      {children}
    </div>
  );
}

function CardHeader({ icon, title, count }: { icon: React.ReactNode; title: string; count?: number }) {
  return (
    <div className="flex items-center gap-3 px-5 py-4"
         style={{ borderBottom: '1px solid rgba(255,255,255,0.055)' }}>
      <div className="text-[#7C3AED]">{icon}</div>
      <span className="font-heading font-semibold text-white" style={{ fontSize: '14px' }}>
        {title}
        {count !== undefined && (
          <span className="ml-2 font-pixel text-[#4B5563]" style={{ fontSize: '8px' }}>({count})</span>
        )}
      </span>
    </div>
  );
}

function StepIndicator({ current }: { current: Step }) {
  const visibleSteps = [
    { id: 'cart',    label: 'Корзина' },
    { id: 'payment', label: 'Оплата'  },
  ] as const;
  return (
    <div className="flex items-center gap-3">
      {visibleSteps.map((s, i) => {
        const isDone    = (current === 'payment' || current === 'success' || current === 'processing') && s.id === 'cart';
        const isCurrent = current === s.id;
        return (
          <div key={s.id} className="flex items-center gap-3">
            <div className="flex items-center gap-2 font-heading font-semibold"
                 style={{ fontSize: '13px', color: isCurrent ? '#E2E8F0' : isDone ? '#7C3AED' : '#374151' }}>
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                   style={{
                     background: isCurrent ? 'linear-gradient(135deg, #7C3AED, #06B6D4)' : isDone ? '#7C3AED' : '#0D0D16',
                     border: !isCurrent && !isDone ? '1px solid rgba(255,255,255,0.08)' : 'none',
                     boxShadow: isCurrent ? '0 0 12px rgba(124,58,237,0.5)' : 'none',
                   }}>
                {isDone
                  ? <Check style={{ width: '12px', height: '12px', color: '#fff' }} />
                  : <span style={{ fontSize: '10px', color: isCurrent ? '#fff' : '#4B5563' }}>{i + 1}</span>}
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

/* ── Delivery badge (replaces DeliveryInfoCard) ──────── */
function DeliveryBadge({ type }: { type: 'AUTO' | 'MANUAL' }) {
  return (
    <span
      className="inline-flex items-center gap-1 font-pixel rounded"
      style={{
        fontSize: '7px', letterSpacing: '0.05em', padding: '2px 6px',
        color:      type === 'AUTO' ? '#22C55E'            : '#A78BFA',
        background: type === 'AUTO' ? 'rgba(34,197,94,0.1)' : 'rgba(167,139,250,0.1)',
        border:     type === 'AUTO' ? '1px solid rgba(34,197,94,0.25)' : '1px solid rgba(167,139,250,0.25)',
      }}
    >
      <Zap style={{ width: '8px', height: '8px' }} />
      {type === 'AUTO' ? 'Авто-доставка' : 'Ручная доставка'}
    </span>
  );
}

/* ── Order summary sidebar ────────────────────────────── */
function OrderSummary({
  items, subtotal, coinsDiscount, total, step, onNext, onBack, submitting,
}: {
  items: CheckoutItem[]; subtotal: number; coinsDiscount: number; total: number;
  step: Step; onNext: () => void; onBack?: () => void; submitting: boolean;
}) {
  const coinsToEarn = Math.round(total / 1000);
  return (
    <div className="sticky top-[132px]">
      <Card>
        <div className="px-5 py-4 flex items-center justify-between"
             style={{ borderBottom: '1px solid rgba(255,255,255,0.055)' }}>
          <span className="font-heading font-semibold text-[#9CA3AF]"
                style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Ваш заказ
          </span>
          <span className="font-pixel text-[#4B5563]" style={{ fontSize: '7.5px' }}>
            {items.length} поз.
          </span>
        </div>

        {/* Items */}
        <div className="px-5 py-4 space-y-3"
             style={{ borderBottom: '1px solid rgba(255,255,255,0.055)' }}>
          {items.map(item => (
            <div key={item.gameId} className="flex items-center gap-3">
              <div className="relative w-10 h-12 rounded-xl overflow-hidden flex-shrink-0">
                {item.cover
                  ? <Image src={item.cover} alt={item.title} fill className="object-cover" unoptimized />
                  : <div className="w-full h-full flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.1)' }}>
                      <Package style={{ width: '14px', height: '14px', color: '#6B7280' }} />
                    </div>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-heading font-semibold text-white line-clamp-1" style={{ fontSize: '12.5px' }}>
                  {item.title}
                </p>
                <DeliveryBadge type={item.deliveryType} />
              </div>
              <span className="font-heading font-bold text-white flex-shrink-0" style={{ fontSize: '12.5px' }}>
                {formatPrice(item.priceUzs)}
              </span>
            </div>
          ))}
        </div>

        {/* Price breakdown */}
        <div className="px-5 py-4 space-y-2"
             style={{ borderBottom: '1px solid rgba(255,255,255,0.055)' }}>
          <div className="flex justify-between">
            <span className="font-body text-[#6B7280]" style={{ fontSize: '13px' }}>Подытог</span>
            <span className="font-body text-[#9CA3AF]" style={{ fontSize: '13px' }}>{formatPrice(subtotal)}</span>
          </div>
          <AnimatePresence>
            {coinsDiscount > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="flex justify-between">
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
            <motion.span key={total} initial={{ scale: 1.05 }} animate={{ scale: 1 }}
              className="font-heading font-bold text-white" style={{ fontSize: '20px' }}>
              {formatPrice(total)}
            </motion.span>
          </div>
          <div className="flex items-center gap-2 mt-3 rounded-xl px-3 py-2"
               style={{ background: 'rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.15)' }}>
            <Zap style={{ width: '12px', height: '12px', color: '#9D60FA', flexShrink: 0 }} />
            <span className="font-body text-[#9D60FA]" style={{ fontSize: '11.5px' }}>
              Получите +{coinsToEarn} Arcane Coins
            </span>
          </div>
        </div>

        {/* CTA */}
        <div className="p-4 space-y-2.5">
          <motion.button
            whileHover={!submitting && items.length > 0 ? { scale: 1.015 } : {}}
            whileTap={!submitting && items.length > 0 ? { scale: 0.985 } : {}}
            onClick={onNext}
            disabled={items.length === 0 || submitting}
            className="group relative w-full flex items-center justify-center gap-2 rounded-xl font-heading font-semibold text-white overflow-hidden transition-all duration-200"
            style={{
              background: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 60%, #06B6D4 130%)',
              padding: '14px 20px', fontSize: '14px', letterSpacing: '0.025em',
              boxShadow: items.length > 0 ? '0 0 0 1px rgba(124,58,237,0.4), 0 4px 24px rgba(124,58,237,0.3)' : 'none',
              opacity: items.length === 0 ? 0.4 : 1,
              cursor: items.length === 0 || submitting ? 'not-allowed' : 'pointer',
            }}
          >
            {submitting
              ? <Loader2 style={{ width: '16px', height: '16px' }} className="animate-spin" />
              : <CreditCard style={{ width: '16px', height: '16px' }} />}
            <span>{step === 'cart' ? 'К оплате' : submitting ? 'Создаём заказ...' : `Оплатить ${formatPrice(total)}`}</span>
            {!submitting && <ChevronRight style={{ width: '16px', height: '16px' }} />}
          </motion.button>

          {onBack && step === 'payment' && (
            <button
              onClick={onBack}
              className="w-full flex items-center justify-center gap-2 rounded-xl font-heading font-medium transition-all duration-200"
              style={{ background: '#09090E', border: '1px solid rgba(255,255,255,0.07)', padding: '11px 20px', fontSize: '13px', color: '#4B5563' }}
            >
              <ArrowLeft style={{ width: '14px', height: '14px' }} />
              Назад в корзину
            </button>
          )}

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

/* ── Success screen ───────────────────────────────────── */
function SuccessView({ orderId, items, total, email }: {
  orderId: string; items: CheckoutItem[]; total: number; email: string;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="min-h-screen flex items-center justify-center px-4" style={{ background: '#05040B', paddingTop: '120px' }}>
      <div className="max-w-lg w-full text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, delay: 0.2 }}
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(34,197,94,0.1))', border: '1px solid rgba(34,197,94,0.3)', boxShadow: '0 0 40px rgba(34,197,94,0.2)' }}>
          <CheckCircle2 style={{ width: '36px', height: '36px', color: '#22C55E' }} />
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          <p className="font-pixel text-[#7C3AED] mb-2" style={{ fontSize: '9px', letterSpacing: '0.14em' }}>ЗАКАЗ СОЗДАН</p>
          <h1 className="font-heading font-bold text-white mb-2" style={{ fontSize: '28px' }}>Спасибо за покупку!</h1>
          <p className="font-body text-[#4B5563] mb-6" style={{ fontSize: '13px' }}>
            Заказ <span className="text-[#7C3AED]">#{orderId.slice(0, 8)}</span> создан · Ключ придёт на <span className="text-white">{email}</span>
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="rounded-2xl p-5 mb-6 text-left"
          style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.07)' }}>
          {items.map(item => (
            <div key={item.gameId} className="flex items-center gap-3">
              <div className="relative w-10 h-12 rounded-lg overflow-hidden flex-shrink-0">
                {item.cover
                  ? <Image src={item.cover} alt={item.title} fill unoptimized className="object-cover" />
                  : <div className="w-full h-full" style={{ background: 'rgba(124,58,237,0.1)' }} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-body text-white" style={{ fontSize: '13px' }}>{item.title}</p>
                <DeliveryBadge type={item.deliveryType} />
              </div>
              <span className="font-heading font-bold text-[#22C55E]" style={{ fontSize: '14px' }}>
                {formatPrice(item.priceUzs)}
              </span>
            </div>
          ))}
          <div className="mt-4 pt-4 flex items-center justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <span className="font-body text-[#6B7280]" style={{ fontSize: '13px' }}>Итого</span>
            <span className="font-heading font-bold text-white" style={{ fontSize: '16px' }}>{formatPrice(total)}</span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-3">
          <Link href="/library"
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-heading font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', boxShadow: '0 0 20px rgba(124,58,237,0.3)' }}>
            Моя библиотека <ArrowRight style={{ width: '15px', height: '15px' }} />
          </Link>
          <Link href="/catalog"
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-heading font-semibold"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#6B7280' }}>
            Продолжить покупки
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   INNER PAGE (uses hooks)
══════════════════════════════════════════ */
function CheckoutInner() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const { gameIds, removeGame, clear: clearCart } = useCart();

  const [step, setStep]               = useState<Step>('cart');
  const [items, setItems]             = useState<CheckoutItem[]>([]);
  const [loadingGame, setLoadingGame] = useState(true);
  const [payMethod, setPayMethod]     = useState('payme');
  const [useCoins, setUseCoins]       = useState(false);
  const [email, setEmail]             = useState('');
  const [telegram, setTelegram]       = useState('');
  const [emailError, setEmailError]   = useState('');
  const [submitting, setSubmitting]   = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [orderId, setOrderId]         = useState('');
  const [uzsBalance, setUzsBalance]   = useState(0);

  const userArcCoins = (session?.user as { arcCoins?: number })?.arcCoins ?? 0;

  // Fetch UZS balance
  useEffect(() => {
    if (!session?.user) return;
    fetch('/api/user/balance')
      .then(r => r.json())
      .then(d => setUzsBalance(d.balanceUzs ?? 0))
      .catch(() => {});
  }, [session]);

  // Pre-fill email from session
  useEffect(() => {
    if (session?.user?.email && !email) setEmail(session.user.email);
  }, [session]);

  // Load games: from URL param (buy-now) or from cart
  useEffect(() => {
    const urlGameId = searchParams.get('gameId');
    const idsToLoad = urlGameId ? [urlGameId] : gameIds;

    if (idsToLoad.length === 0) { setLoadingGame(false); return; }

    setLoadingGame(true);
    Promise.all(
      idsToLoad.map(id =>
        fetch(`/api/arcane/games/${id}`)
          .then(r => r.json())
          .catch(() => null)
      )
    )
      .then(results => {
        type GameData = { id: string; title: string; cover: string | null; priceUzs: number | null; deliveryType: string };
        const loaded = results
          .filter((d): d is { success: true; data: GameData } => d?.success && !!d.data)
          .map(d => ({
            gameId:       d.data.id,
            title:        d.data.title,
            cover:        d.data.cover,
            priceUzs:     d.data.priceUzs ?? 0,
            deliveryType: (d.data.deliveryType as 'AUTO' | 'MANUAL') ?? 'MANUAL',
          }));
        setItems(loaded);
      })
      .finally(() => setLoadingGame(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, gameIds.join(',')]); // join to avoid infinite loop on array ref

  const subtotal      = items.reduce((s, i) => s + i.priceUzs, 0);
  const coinsDiscount = useCoins ? Math.min(userArcCoins, Math.round(subtotal * 0.1)) : 0;
  const total         = Math.max(0, subtotal - coinsDiscount);

  const validateEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const handleNext = async () => {
    if (step === 'cart') {
      if (!validateEmail(email)) { setEmailError('Введите корректный email'); return; }
      setEmailError('');
      setStep('payment');
    } else if (step === 'payment') {
      if (!session?.user) return;
      setSubmitting(true);
      setSubmitError('');
      try {
        const res  = await fetch('/api/orders', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            userId:        (session.user as { id: string }).id,
            items:         items.map(i => ({ gameId: i.gameId })),
            paymentMethod: payMethod === 'balance' ? 'balance' : undefined,
          }),
        });
        const data = await res.json() as { success?: boolean; order?: { id: string }; error?: string; code?: string };
        if (data.success && data.order) {
          setOrderId(data.order.id);
          if (payMethod === 'balance') setUzsBalance(prev => Math.max(0, prev - total));
          clearCart();
          setStep('processing');
        } else {
          setSubmitError(data.error ?? 'Ошибка создания заказа');
        }
      } catch {
        setSubmitError('Ошибка сети');
      } finally {
        setSubmitting(false);
      }
    }
  };

  const removeItem = (gameId: string) => {
    setItems(prev => prev.filter(i => i.gameId !== gameId));
    removeGame(gameId);
  };

  // Auth guard
  if (status === 'loading' || loadingGame) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#05040B' }}>
        <Loader2 style={{ width: '24px', height: '24px', color: '#7C3AED' }} className="animate-spin" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    const gameId = searchParams.get('gameId') ?? '';
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#05040B' }}>
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
               style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}>
            <Shield style={{ width: '28px', height: '28px', color: '#7C3AED' }} />
          </div>
          <h2 className="font-heading font-bold text-white mb-2" style={{ fontSize: '20px' }}>Нужен аккаунт</h2>
          <p className="font-body text-[#4B5563] mb-6" style={{ fontSize: '13px' }}>Войдите, чтобы оформить заказ</p>
          <Link
            href={`/login?callbackUrl=${encodeURIComponent('/checkout' + (gameId ? '?gameId=' + gameId : ''))}`}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-heading font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)' }}
          >
            Войти
          </Link>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return <SuccessView orderId={orderId} items={items} total={total} email={email} />;
  }

  return (
    <>
      <AnimatePresence>
        {step === 'processing' && (
          <ProcessingOverlay key="processing" onComplete={() => setStep('success')} />
        )}
      </AnimatePresence>

      <div className="min-h-screen" style={{ background: '#05040B', paddingTop: '120px' }}>
        <div className="fixed inset-0 pointer-events-none"
             style={{ background: 'radial-gradient(ellipse 70% 40% at 50% 0%, rgba(124,58,237,0.05) 0%, transparent 70%)' }} />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="mb-8">
            <Link href="/catalog"
              className="inline-flex items-center gap-2 font-body mb-4 transition-colors duration-200 text-[#4B5563] hover:text-[#9CA3AF]"
              style={{ fontSize: '13px' }}>
              <ArrowLeft style={{ width: '14px', height: '14px' }} />
              Продолжить покупки
            </Link>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <p className="font-heading font-semibold text-[#7C3AED] mb-1"
                   style={{ fontSize: '11px', letterSpacing: '0.13em', textTransform: 'uppercase' }}>
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
            {/* LEFT */}
            <div className="min-w-0">
              <AnimatePresence mode="wait">
                {/* ═══ CART STEP ═══ */}
                {step === 'cart' && (
                  <motion.div key="cart"
                    initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} className="space-y-4">
                    {/* Cart items */}
                    <Card>
                      <CardHeader icon={<ShoppingCart className="w-4 h-4" />} title="Корзина" count={items.length} />
                      {items.length === 0 ? (
                        <div className="p-10 text-center">
                          <Package className="mx-auto mb-3 text-[#1F2937]" style={{ width: '36px', height: '36px' }} />
                          <p className="font-body text-[#4B5563] mb-3" style={{ fontSize: '14px' }}>Корзина пуста</p>
                          <Link href="/catalog" className="font-body text-[#7C3AED] hover:text-[#9D60FA] transition-colors" style={{ fontSize: '13px' }}>
                            Перейти в каталог →
                          </Link>
                        </div>
                      ) : (
                        <div className="divide-y divide-white/[0.05]">
                          {items.map(item => (
                            <div key={item.gameId} className="flex gap-4 px-5 py-4">
                              <div className="relative w-14 rounded-xl overflow-hidden flex-shrink-0" style={{ height: '72px' }}>
                                {item.cover
                                  ? <Image src={item.cover} alt={item.title} fill className="object-cover" unoptimized />
                                  : <div className="w-full h-full flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.1)' }}>
                                      <Package style={{ width: '20px', height: '20px', color: '#6B7280' }} />
                                    </div>}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <h3 className="font-heading font-semibold text-white line-clamp-1" style={{ fontSize: '14px' }}>
                                      {item.title}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-1">
                                      <DeliveryBadge type={item.deliveryType} />
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => removeItem(item.gameId)}
                                    className="p-1.5 rounded-lg transition-all duration-200 text-[#374151] hover:text-[#F87171] hover:bg-red-400/10 flex-shrink-0">
                                    <Trash2 style={{ width: '14px', height: '14px' }} />
                                  </button>
                                </div>
                                <div className="flex items-center justify-end mt-2">
                                  <span className="font-heading font-bold text-white" style={{ fontSize: '15px' }}>
                                    {formatPrice(item.priceUzs)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>

                    {/* Email + Telegram */}
                    <Card>
                      <CardHeader icon={<Mail className="w-4 h-4" />} title="Данные получения" />
                      <div className="p-5 space-y-3.5">
                        <CheckoutInput
                          label="Email для ключей активации"
                          type="email"
                          placeholder="your@email.com"
                          value={email}
                          onChange={e => { setEmail(e.target.value); setEmailError(''); }}
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
                          onChange={e => setTelegram(e.target.value)}
                          icon={<AtSign style={{ width: '15px', height: '15px' }} />}
                          hint="Для уведомлений и поддержки"
                        />
                      </div>
                    </Card>

                    {/* Arcane Coins toggle */}
                    {userArcCoins > 0 && (
                      <Card>
                        <div className="p-5 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <motion.div
                              animate={{ boxShadow: useCoins ? '0 0 16px rgba(124,58,237,0.5)' : 'none' }}
                              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{
                                background: useCoins ? 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(6,182,212,0.2))' : 'rgba(124,58,237,0.08)',
                                border: `1px solid ${useCoins ? 'rgba(124,58,237,0.4)' : 'rgba(124,58,237,0.18)'}`,
                              }}>
                              <Zap style={{ width: '16px', height: '16px', color: '#9D60FA' }} />
                            </motion.div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-heading font-semibold text-white" style={{ fontSize: '13.5px' }}>Arcane Coins</span>
                                <span className="font-pixel rounded-full px-2 py-0.5"
                                      style={{ fontSize: '7.5px', color: '#9D60FA', background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.22)' }}>
                                  {userArcCoins.toLocaleString('ru')}
                                </span>
                              </div>
                              <p className="font-body text-[#6B7280] mt-0.5" style={{ fontSize: '11px' }}>
                                {useCoins ? `Скидка: −${formatPrice(coinsDiscount)}` : `Доступно: −${formatPrice(Math.min(userArcCoins, Math.round(subtotal * 0.1)))}`}
                              </p>
                            </div>
                          </div>
                          <motion.button
                            animate={{ background: useCoins ? 'linear-gradient(90deg, #7C3AED, #06B6D4)' : '#1A1A28' }}
                            onClick={() => setUseCoins(v => !v)}
                            className="relative w-11 h-6 rounded-full flex-shrink-0 cursor-pointer"
                            style={{ border: `1px solid ${useCoins ? 'transparent' : 'rgba(255,255,255,0.1)'}` }}>
                            <motion.div
                              animate={{ x: useCoins ? 21 : 2 }}
                              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                              className="absolute top-[3px] w-4 h-4 bg-white rounded-full"
                              style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.4)' }} />
                          </motion.button>
                        </div>
                      </Card>
                    )}
                  </motion.div>
                )}

                {/* ═══ PAYMENT STEP ═══ */}
                {step === 'payment' && (
                  <motion.div key="payment"
                    initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} className="space-y-4">
                    <Card>
                      <CardHeader icon={<CreditCard className="w-4 h-4" />} title="Способ оплаты" />
                      <div className="p-5">
                        <PaymentMethods
                        selected={payMethod}
                        onSelect={setPayMethod}
                        balanceUzs={uzsBalance}
                        total={total}
                      />
                      </div>
                    </Card>

                    {submitError && (
                      <div className="flex items-center gap-3 rounded-2xl px-4 py-3"
                           style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                        <AlertCircle style={{ width: '15px', height: '15px', color: '#EF4444', flexShrink: 0 }} />
                        <p className="font-body text-[#F87171]" style={{ fontSize: '13px' }}>{submitError}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-3.5 rounded-2xl p-4"
                         style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.18)' }}>
                      <Shield style={{ width: '18px', height: '18px', color: '#22C55E', flexShrink: 0 }} />
                      <div>
                        <p className="font-heading font-semibold text-white" style={{ fontSize: '13px' }}>Безопасная оплата</p>
                        <p className="font-body text-[#4B5563] mt-0.5" style={{ fontSize: '11.5px' }}>
                          SSL-шифрование. Мы не храним платёжные данные.
                        </p>
                      </div>
                    </div>
                    <p className="font-body text-[#374151] text-center" style={{ fontSize: '11.5px' }}>
                      Поддерживаются Click, Payme, UzCard, HUMO, Uzum Bank
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* RIGHT: Summary */}
            <div>
              <OrderSummary
                items={items}
                subtotal={subtotal}
                coinsDiscount={coinsDiscount}
                total={total}
                step={step}
                onNext={handleNext}
                onBack={() => setStep('cart')}
                submitting={submitting}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Page entry (wraps in Suspense for useSearchParams) ── */
export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#05040B' }}>
        <Loader2 style={{ width: '24px', height: '24px', color: '#7C3AED' }} className="animate-spin" />
      </div>
    }>
      <CheckoutInner />
    </Suspense>
  );
}
