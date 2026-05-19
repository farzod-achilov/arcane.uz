'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

const METHODS = [
  {
    id: 'click',
    name: 'Click',
    label: 'CLICK',
    sub: 'Онлайн-банкинг',
    accent: '#1D6BCE',
    popular: false,
  },
  {
    id: 'payme',
    name: 'Payme',
    label: 'PAYME',
    sub: 'Мгновенный платёж',
    accent: '#EC1C24',
    popular: true,
  },
  {
    id: 'uzcard',
    name: 'UzCard',
    label: 'UZCARD',
    sub: 'Карта UzCard',
    accent: '#0FA84B',
    popular: false,
  },
  {
    id: 'humo',
    name: 'HUMO',
    label: 'HUMO',
    sub: 'Карта HUMO',
    accent: '#F59E0B',
    popular: false,
  },
  {
    id: 'uzum',
    name: 'Uzum Bank',
    label: 'UZUM',
    sub: 'Uzum Bank',
    accent: '#7C3AED',
    popular: false,
  },
] as const;

type MethodId = typeof METHODS[number]['id'];

interface PaymentMethodsProps {
  selected: MethodId | string;
  onSelect: (id: string) => void;
}

export default function PaymentMethods({ selected, onSelect }: PaymentMethodsProps) {
  return (
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
            {/* Popular badge */}
            {m.popular && (
              <span
                className="absolute top-0 right-0 font-pixel text-white rounded-bl-xl rounded-tr-xl"
                style={{
                  fontSize: '7px',
                  background: `linear-gradient(135deg, #7C3AED, #06B6D4)`,
                  padding: '3px 8px',
                  letterSpacing: '0.06em',
                }}
              >
                ТОП
              </span>
            )}

            {/* Brand label */}
            <div
              className="font-pixel mb-2"
              style={{
                fontSize: '11px',
                color: isActive ? m.accent : '#9CA3AF',
                letterSpacing: '0.08em',
                textShadow: isActive ? `0 0 10px ${m.accent}60` : 'none',
              }}
            >
              {m.label}
            </div>

            {/* Color bar */}
            <div
              className="w-8 h-0.5 rounded-full mb-2.5"
              style={{
                background: m.accent,
                opacity: isActive ? 1 : 0.4,
                boxShadow: isActive ? `0 0 8px ${m.accent}` : 'none',
              }}
            />

            {/* Sub label */}
            <p
              className="font-body"
              style={{ fontSize: '11px', color: isActive ? '#9CA3AF' : '#374151' }}
            >
              {m.sub}
            </p>

            {/* Active check */}
            {isActive && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="absolute bottom-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                style={{
                  background: m.accent,
                  boxShadow: `0 0 8px ${m.accent}80`,
                }}
              >
                <Check style={{ width: '10px', height: '10px', color: '#fff' }} />
              </motion.div>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
