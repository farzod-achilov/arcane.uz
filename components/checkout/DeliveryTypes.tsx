'use client';

import { motion } from 'framer-motion';
import { Zap, Gift, MessageSquare, Monitor, Check } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const TYPES = [
  {
    id: 'instant',
    icon: Zap,
    label: 'Мгновенно',
    desc: 'Ключ на email сразу после оплаты',
    time: '0–5 мин',
    accent: '#22C55E',
    popular: true,
  },
  {
    id: 'steam-gift',
    icon: Gift,
    label: 'Steam Подарок',
    desc: 'Игра добавляется как подарок в Steam',
    time: '1–3 ч',
    accent: '#06B6D4',
    popular: false,
  },
  {
    id: 'manual',
    icon: MessageSquare,
    label: 'Через Telegram',
    desc: 'Менеджер свяжется с вами в Telegram',
    time: '~30 мин',
    accent: '#9D60FA',
    popular: false,
  },
  {
    id: 'offline',
    icon: Monitor,
    label: 'Офлайн',
    desc: 'Активация в нашем офисе',
    time: '1–24 ч',
    accent: '#F59E0B',
    popular: false,
  },
] as const;

type DeliveryId = typeof TYPES[number]['id'];

interface DeliveryTypesProps {
  selected: string;
  onSelect: (id: string) => void;
}

export default function DeliveryTypes({ selected, onSelect }: DeliveryTypesProps) {
  return (
    <div className="grid sm:grid-cols-2 gap-2.5">
      {TYPES.map((t, i) => {
        const Icon = t.icon as LucideIcon;
        const isActive = selected === t.id;
        return (
          <motion.button
            key={t.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.985 }}
            onClick={() => onSelect(t.id)}
            className="relative flex items-start gap-3 p-4 rounded-2xl text-left overflow-hidden transition-all duration-250"
            style={{
              background: isActive ? `${t.accent}10` : '#09090E',
              border: `1px solid ${isActive ? `${t.accent}45` : 'rgba(255,255,255,0.07)'}`,
              boxShadow: isActive ? `0 0 18px ${t.accent}18` : 'none',
            }}
          >
            {/* Popular */}
            {t.popular && !isActive && (
              <span
                className="absolute top-2.5 right-2.5 font-pixel"
                style={{
                  fontSize: '6.5px',
                  color: t.accent,
                  letterSpacing: '0.06em',
                  background: `${t.accent}15`,
                  border: `1px solid ${t.accent}30`,
                  padding: '2px 5px',
                  borderRadius: '4px',
                }}
              >
                РЕКОМЕНДУЕМ
              </span>
            )}

            {/* Icon */}
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200"
              style={{
                background: `${t.accent}14`,
                border: `1px solid ${t.accent}28`,
                boxShadow: isActive ? `0 0 14px ${t.accent}30` : 'none',
              }}
            >
              <Icon style={{ width: '15px', height: '15px', color: t.accent }} />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p
                className="font-heading font-semibold mb-0.5"
                style={{ fontSize: '13px', color: isActive ? '#E2E8F0' : '#9CA3AF' }}
              >
                {t.label}
              </p>
              <p
                className="font-body leading-snug"
                style={{ fontSize: '11px', color: '#374151', lineHeight: '1.45' }}
              >
                {t.desc}
              </p>
              <span
                className="font-pixel mt-1.5 inline-block"
                style={{
                  fontSize: '7.5px',
                  color: isActive ? t.accent : '#4B5563',
                  letterSpacing: '0.06em',
                }}
              >
                {t.time}
              </span>
            </div>

            {/* Check */}
            {isActive && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 self-center"
                style={{
                  background: t.accent,
                  boxShadow: `0 0 8px ${t.accent}70`,
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
