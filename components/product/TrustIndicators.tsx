'use client';

import { motion } from 'framer-motion';
import { Users, Zap, Shield, MessageCircle, Award, Globe } from 'lucide-react';

const STATS = [
  {
    icon: Users,
    value: '50 000+',
    label: 'довольных покупателей',
    color: '#7C3AED',
    glow: 'rgba(124,58,237,0.2)',
  },
  {
    icon: Zap,
    value: '99.8%',
    label: 'мгновенных доставок',
    color: '#22C55E',
    glow: 'rgba(34,197,94,0.2)',
  },
  {
    icon: Shield,
    value: '100%',
    label: 'официальных ключей',
    color: '#06B6D4',
    glow: 'rgba(6,182,212,0.2)',
  },
  {
    icon: MessageCircle,
    value: '< 5 мин',
    label: 'время ответа поддержки',
    color: '#F59E0B',
    glow: 'rgba(245,158,11,0.2)',
  },
  {
    icon: Award,
    value: '4.9 ★',
    label: 'средняя оценка магазина',
    color: '#EF4444',
    glow: 'rgba(239,68,68,0.2)',
  },
  {
    icon: Globe,
    value: 'RU/CIS',
    label: 'регион активации',
    color: '#9D60FA',
    glow: 'rgba(157,96,250,0.2)',
  },
];

export default function TrustIndicators() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="relative rounded-2xl overflow-hidden my-10"
      style={{ background: '#0D0D16', border: '1px solid rgba(124,58,237,0.12)' }}
    >
      {/* Top glow line */}
      <div
        className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.5) 30%, rgba(6,182,212,0.4) 70%, transparent)' }}
      />
      {/* Grid texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(124,58,237,1) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,1) 1px, transparent 1px)',
          backgroundSize: '40px 40px', opacity: 0.015,
        }}
      />

      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-x divide-white/[0.05]">
        {STATS.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.07 }}
            className="flex flex-col items-center text-center px-4 py-5 group"
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center mb-2.5 transition-all duration-300 group-hover:scale-110"
              style={{
                background: `${s.color}12`,
                border: `1px solid ${s.color}25`,
                boxShadow: `0 0 0 0 ${s.glow}`,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = `0 0 16px ${s.glow}`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 0 ${s.glow}`;
              }}
            >
              <s.icon style={{ width: '15px', height: '15px', color: s.color }} />
            </div>
            <p
              className="font-pixel mb-1"
              style={{ fontSize: '10px', color: s.color, letterSpacing: '0.04em', textShadow: `0 0 10px ${s.glow}` }}
            >
              {s.value}
            </p>
            <p className="font-body text-[#4B5563] leading-tight" style={{ fontSize: '10px' }}>
              {s.label}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
