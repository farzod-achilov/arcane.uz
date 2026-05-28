'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { Zap, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { SHOP_ITEMS } from '@/lib/arc-shop';

export default function ArcShopPage() {
  const { data: session, update } = useSession();
  const userCoins = (session?.user as { arcCoins?: number })?.arcCoins ?? 0;

  const [buying,  setBuying]  = useState<string | null>(null);
  const [result,  setResult]  = useState<{ itemId: string; promoCode?: string; addedBalance?: number } | null>(null);

  async function buy(itemId: string, cost: number) {
    if (userCoins < cost) {
      toast.error(`Недостаточно монет. Нужно ${cost} ARC`);
      return;
    }
    setBuying(itemId);
    try {
      const res  = await fetch('/api/arc-shop/buy', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ itemId }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? 'Ошибка'); return; }

      setResult({ itemId, promoCode: data.promoCode, addedBalance: data.addedBalance });
      await update(); // refresh session (arcCoins updated)
      toast.success('Куплено!');
    } finally { setBuying(null); }
  }

  return (
    <div className="min-h-screen" style={{ background: '#03020A', paddingTop: '120px', paddingBottom: '80px' }}>
      {/* Glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div style={{ position: 'absolute', top: '20%', left: '50%', width: '500px', height: '500px',
                      background: 'radial-gradient(circle, rgba(245,158,11,0.07) 0%, transparent 65%)',
                      filter: 'blur(60px)', transform: 'translate(-50%,-50%)' }} />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6">

        <Link href="/profile"
              className="inline-flex items-center gap-2 font-body text-[#4B5563] hover:text-[#9CA3AF] mb-6 transition-colors"
              style={{ fontSize: '13px' }}>
          <ArrowLeft style={{ width: '14px', height: '14px' }} />
          В профиль
        </Link>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }} className="mb-10">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-4"
               style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)' }}>
            <Zap style={{ width: '13px', height: '13px', color: '#F59E0B' }} />
            <span className="font-pixel text-[#F59E0B]" style={{ fontSize: '8px', letterSpacing: '0.1em' }}>
              МАГАЗИН МОНЕТ
            </span>
          </div>

          <h1 className="font-heading font-bold text-white mb-2" style={{ fontSize: 'clamp(24px, 4vw, 38px)' }}>
            ARC{' '}
            <span style={{ background: 'linear-gradient(90deg, #F59E0B, #EF4444)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Монеты
            </span>
          </h1>
          <p className="font-body text-[#6B7280]" style={{ fontSize: '15px' }}>
            Трать накопленные монеты на скидки и бонусы
          </p>

          {/* Balance */}
          <div className="inline-flex items-center gap-2 rounded-2xl px-5 py-3 mt-4"
               style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <Zap style={{ width: '16px', height: '16px', color: '#F59E0B' }} />
            <span className="font-heading font-bold text-white" style={{ fontSize: '20px' }}>
              {userCoins.toLocaleString('ru')}
            </span>
            <span className="font-body text-[#6B7280]" style={{ fontSize: '13px' }}>ARC Coins</span>
          </div>
        </motion.div>

        {/* Items grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SHOP_ITEMS.map((item, i) => {
            const canAfford = userCoins >= item.cost;
            const isBuying  = buying === item.id;
            const bought    = result?.itemId === item.id;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="rounded-2xl p-5 flex flex-col"
                style={{
                  background: '#0D0D16',
                  border: `1px solid ${canAfford ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.06)'}`,
                  opacity: canAfford ? 1 : 0.6,
                }}
              >
                <span style={{ fontSize: '32px', marginBottom: '12px' }}>{item.icon}</span>
                <p className="font-heading font-bold text-white mb-1" style={{ fontSize: '16px' }}>
                  {item.title}
                </p>
                <p className="font-body text-[#6B7280] flex-1 mb-4" style={{ fontSize: '12.5px' }}>
                  {item.description}
                </p>

                {/* Cost */}
                <div className="flex items-center gap-1.5 mb-3">
                  <Zap style={{ width: '13px', height: '13px', color: '#F59E0B' }} />
                  <span className="font-heading font-bold" style={{ fontSize: '16px', color: '#FCD34D' }}>
                    {item.cost.toLocaleString('ru')} ARC
                  </span>
                </div>

                {/* Result */}
                <AnimatePresence>
                  {bought && result && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mb-3 rounded-xl p-3"
                      style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <CheckCircle2 style={{ width: '13px', height: '13px', color: '#4ADE80' }} />
                        <span className="font-body text-[#4ADE80]" style={{ fontSize: '12px' }}>Куплено!</span>
                      </div>
                      {result.promoCode && (
                        <p className="font-pixel text-white" style={{ fontSize: '11px', letterSpacing: '0.08em' }}>
                          Код: {result.promoCode}
                        </p>
                      )}
                      {result.addedBalance && (
                        <p className="font-body text-[#4ADE80]" style={{ fontSize: '12px' }}>
                          +{result.addedBalance.toLocaleString('ru')} сум на баланс
                        </p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  onClick={() => buy(item.id, item.cost)}
                  disabled={!canAfford || isBuying || !!result}
                  className="w-full rounded-xl py-2.5 font-heading font-semibold text-white transition-all flex items-center justify-center gap-2"
                  style={{
                    fontSize: '13px',
                    background: canAfford && !result
                      ? 'linear-gradient(135deg, #D97706, #B45309)'
                      : 'rgba(255,255,255,0.05)',
                    cursor: canAfford && !result ? 'pointer' : 'not-allowed',
                    boxShadow: canAfford && !result ? '0 0 20px rgba(245,158,11,0.25)' : 'none',
                  }}
                >
                  {isBuying
                    ? <Loader2 style={{ width: '14px', height: '14px' }} className="animate-spin" />
                    : bought
                      ? <><CheckCircle2 style={{ width: '14px', height: '14px' }} /> Куплено</>
                      : canAfford ? 'Купить' : 'Не хватает монет'}
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* How to earn */}
        <div className="mt-10 rounded-2xl p-6"
             style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="font-heading font-semibold text-white mb-4" style={{ fontSize: '14px' }}>
            Как заработать ARC монеты
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { icon: '👋', text: 'Ежедневный вход — +10 ARC' },
              { icon: '🎮', text: 'Открыть каталог — +5 ARC' },
              { icon: '❤️', text: 'Добавить в вишлист — +15 ARC' },
              { icon: '⭐', text: 'Оставить отзыв — +50 ARC' },
              { icon: '🛒', text: 'Купить игру — +100 ARC' },
              { icon: '👥', text: 'Пригласить друга — +200-500 ARC' },
              { icon: '💳', text: 'Кэшбэк 2-6% с покупок' },
              { icon: '🎁', text: 'Приветственный бонус — +500 ARC' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-2">
                <span style={{ fontSize: '16px' }}>{icon}</span>
                <span className="font-body text-[#6B7280]" style={{ fontSize: '12.5px' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
