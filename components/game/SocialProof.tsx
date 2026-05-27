'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, ShoppingBag, Flame } from 'lucide-react';

interface Props {
  gameId:     string;
  stockStore: number;
  isManual:   boolean;
}

/* Deterministic but realistic-looking number seeded by gameId + today's date */
function seededRandom(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(h) / 2147483647;
}

function getDailySeed(gameId: string) {
  const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
  return `${gameId}-${today}`;
}

export default function SocialProof({ gameId, stockStore, isManual }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;

  const r1 = seededRandom(getDailySeed(gameId));
  const r2 = seededRandom(getDailySeed(gameId + 'cart'));
  const r3 = seededRandom(getDailySeed(gameId + 'hour'));

  const viewsToday  = Math.round(48 + r1 * 220);   // 48–268
  const inCartNow   = Math.round(3  + r2 * 24);    // 3–27
  const lastHour    = Math.round(1  + r3 * 14);    // 1–15
  const lowStock    = !isManual && stockStore > 0 && stockStore <= 5;

  const items = [
    {
      icon:  Eye,
      color: '#06B6D4',
      bg:    'rgba(6,182,212,0.08)',
      text:  `${viewsToday} чел. смотрели сегодня`,
      pulse: false,
    },
    {
      icon:  ShoppingBag,
      color: '#A78BFA',
      bg:    'rgba(167,139,250,0.08)',
      text:  `${inCartNow} добавили в корзину`,
      pulse: false,
    },
    ...(lowStock ? [{
      icon:  Flame,
      color: '#F97316',
      bg:    'rgba(249,115,22,0.1)',
      text:  `Осталось ${stockStore} шт.`,
      pulse: true,
    }] : [
      {
        icon:  Flame,
        color: '#F59E0B',
        bg:    'rgba(245,158,11,0.08)',
        text:  `${lastHour} куплено за час`,
        pulse: false,
      },
    ]),
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="flex flex-col gap-1.5"
      >
        {items.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.35 + i * 0.07 }}
              className="flex items-center gap-2 rounded-xl px-3 py-2"
              style={{ background: item.bg }}
            >
              {item.pulse ? (
                <span className="relative flex-shrink-0" style={{ width: '10px', height: '10px' }}>
                  <span className="absolute inset-0 rounded-full animate-ping"
                        style={{ background: item.color, opacity: 0.5 }} />
                  <Icon style={{ width: '10px', height: '10px', color: item.color, position: 'relative' }} />
                </span>
              ) : (
                <Icon style={{ width: '11px', height: '11px', color: item.color, flexShrink: 0 }} />
              )}
              <span className="font-body" style={{ fontSize: '11.5px', color: '#9CA3AF' }}>
                {item.text}
              </span>
            </motion.div>
          );
        })}
      </motion.div>
    </AnimatePresence>
  );
}
