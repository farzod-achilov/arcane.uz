'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, Wallet, AlertCircle, Zap } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

const METHODS = [
  { id: 'click',  label: 'CLICK',  sub: 'Онлайн-банкинг',    accent: '#1D6BCE', popular: false },
  { id: 'payme',  label: 'PAYME',  sub: 'Мгновенный платёж', accent: '#EC1C24', popular: true  },
  { id: 'uzcard', label: 'UZCARD', sub: 'Карта UzCard',       accent: '#0FA84B', popular: false },
  { id: 'humo',   label: 'HUMO',   sub: 'Карта HUMO',         accent: '#F59E0B', popular: false },
  { id: 'uzum',   label: 'UZUM',   sub: 'Uzum Bank',           accent: '#7C3AED', popular: false },
] as const;

interface PaymentMethodsProps {
  selected:    string;
  onSelect:    (id: string) => void;
  balanceUzs?: number;
  total?:      number;
}

export default function PaymentMethods({
  selected, onSelect, balanceUzs = 0, total = 0,
}: PaymentMethodsProps) {
  const hasSufficientBalance = balanceUzs >= total && total > 0;
  const isBalanceSelected    = selected === 'balance';

  return (
    <div className="space-y-3">
      {/* ── Balance method (full width, prominent) ── */}
      <motion.button
        whileHover={hasSufficientBalance ? { scale: 1.01 } : {}}
        whileTap={hasSufficientBalance ? { scale: 0.99 } : {}}
        onClick={() => hasSufficientBalance && onSelect('balance')}
        disabled={!hasSufficientBalance}
        className="relative w-full flex items-center gap-4 p-4 rounded-2xl text-left overflow-hidden transition-all duration-250"
        style={{
          background: isBalanceSelected
            ? 'rgba(6,182,212,0.1)'
            : hasSufficientBalance
              ? '#09090E'
              : 'rgba(255,255,255,0.02)',
          border: `1px solid ${isBalanceSelected
            ? 'rgba(6,182,212,0.5)'
            : hasSufficientBalance
              ? 'rgba(6,182,212,0.2)'
              : 'rgba(255,255,255,0.05)'}`,
          boxShadow: isBalanceSelected ? '0 0 20px rgba(6,182,212,0.15)' : 'none',
          cursor: hasSufficientBalance ? 'pointer' : 'not-allowed',
          opacity: hasSufficientBalance ? 1 : 0.6,
        }}
      >
        {/* Icon */}
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
             style={{
               background: isBalanceSelected ? 'rgba(6,182,212,0.15)' : 'rgba(6,182,212,0.08)',
               border: `1px solid ${isBalanceSelected ? 'rgba(6,182,212,0.4)' : 'rgba(6,182,212,0.15)'}`,
             }}>
          <Wallet style={{ width: '16px', height: '16px', color: '#06B6D4' }} />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-pixel" style={{ fontSize: '11px', color: isBalanceSelected ? '#06B6D4' : '#9CA3AF', letterSpacing: '0.08em' }}>
              БАЛАНС СЧЁТА
            </span>
            {hasSufficientBalance && (
              <span className="font-pixel rounded px-1.5 py-0.5"
                    style={{ fontSize: '7px', color: '#22C55E', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', letterSpacing: '0.06em' }}>
                МГНОВЕННО
              </span>
            )}
          </div>
          {hasSufficientBalance ? (
            <p className="font-body" style={{ fontSize: '12px', color: '#4B5563' }}>
              Доступно: <span style={{ color: '#06B6D4' }}>{formatPrice(balanceUzs)}</span>
              {total > 0 && (
                <span style={{ color: '#374151' }}>
                  {' '}· Остаток: <span style={{ color: '#22C55E' }}>{formatPrice(balanceUzs - total)}</span>
                </span>
              )}
            </p>
          ) : (
            <div className="flex items-center gap-1.5">
              <AlertCircle style={{ width: '11px', height: '11px', color: '#F59E0B', flexShrink: 0 }} />
              <p className="font-body" style={{ fontSize: '11.5px', color: '#6B7280' }}>
                Недостаточно средств · Баланс: {formatPrice(balanceUzs)}
              </p>
              <Link
                href="/deposit"
                onClick={e => e.stopPropagation()}
                className="font-body underline transition-colors hover:opacity-80 ml-1"
                style={{ fontSize: '11.5px', color: '#7C3AED' }}
              >
                Пополнить →
              </Link>
            </div>
          )}
        </div>

        {/* Zap icon (instant) */}
        {hasSufficientBalance && !isBalanceSelected && (
          <Zap style={{ width: '14px', height: '14px', color: '#374151', flexShrink: 0 }} />
        )}

        {/* Active check */}
        {isBalanceSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: '#06B6D4', boxShadow: '0 0 8px rgba(6,182,212,0.6)' }}
          >
            <Check style={{ width: '10px', height: '10px', color: '#fff' }} />
          </motion.div>
        )}
      </motion.button>

      {/* ── Divider ── */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <span className="font-body text-[#374151]" style={{ fontSize: '11px' }}>или оплатить через</span>
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
      </div>

      {/* ── External methods grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {METHODS.map((m) => {
          const isActive = selected === m.id;
          return (
            <motion.button
              key={m.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onSelect(m.id)}
              className="relative flex flex-col items-start p-4 rounded-2xl text-left overflow-hidden transition-all duration-250"
              style={{
                background: isActive ? `${m.accent}12` : '#09090E',
                border: `1px solid ${isActive ? `${m.accent}50` : 'rgba(255,255,255,0.07)'}`,
                boxShadow: isActive ? `0 0 20px ${m.accent}20` : 'none',
              }}
            >
              {m.popular && (
                <span className="absolute top-0 right-0 font-pixel text-white rounded-bl-xl rounded-tr-xl"
                      style={{ fontSize: '7px', background: 'linear-gradient(135deg, #7C3AED, #06B6D4)', padding: '3px 8px', letterSpacing: '0.06em' }}>
                  ТОП
                </span>
              )}

              <div className="font-pixel mb-2"
                   style={{ fontSize: '11px', color: isActive ? m.accent : '#9CA3AF', letterSpacing: '0.08em',
                     textShadow: isActive ? `0 0 10px ${m.accent}60` : 'none' }}>
                {m.label}
              </div>
              <div className="w-8 h-0.5 rounded-full mb-2.5"
                   style={{ background: m.accent, opacity: isActive ? 1 : 0.4, boxShadow: isActive ? `0 0 8px ${m.accent}` : 'none' }} />
              <p className="font-body" style={{ fontSize: '11px', color: isActive ? '#9CA3AF' : '#374151' }}>
                {m.sub}
              </p>

              {isActive && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className="absolute bottom-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: m.accent, boxShadow: `0 0 8px ${m.accent}80` }}>
                  <Check style={{ width: '10px', height: '10px', color: '#fff' }} />
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
