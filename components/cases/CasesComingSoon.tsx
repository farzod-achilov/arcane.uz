'use client';

import { motion } from 'framer-motion';
import { Wrench, ChevronRight } from 'lucide-react';
import Link from 'next/link';

/**
 * Заглушка раздела кейсов на время разработки (NEXT_PUBLIC_CASES_COMING_SOON).
 * Показывается вместо лобби /cases и страниц машин /cases/[id]:
 * тизер в стиле раздела, без цен и без возможности открытия.
 */
export default function CasesComingSoon() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'transparent' }}>

      {/* Atmosphere */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full blur-[160px] opacity-20"
          style={{ backgroundColor: '#7C3AED' }} />
        <div className="absolute bottom-[10%] left-[12%] w-[380px] h-[380px] rounded-full blur-[140px] opacity-10"
          style={{ backgroundColor: '#00E5FF' }} />
        <div className="absolute top-[25%] right-[8%] w-[340px] h-[340px] rounded-full blur-[120px] opacity-10"
          style={{ backgroundColor: '#FF00AA' }} />
        {/* Scanlines */}
        <div className="absolute inset-0 opacity-[0.016]"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,1) 2px,rgba(255,255,255,1) 3px)', backgroundSize: '100% 3px' }} />
        {/* Grid */}
        <div className="absolute inset-0 opacity-[0.012]"
          style={{ backgroundImage: 'linear-gradient(rgba(124,58,237,1) 1px,transparent 1px),linear-gradient(90deg,rgba(124,58,237,1) 1px,transparent 1px)', backgroundSize: '64px 64px' }} />
      </div>

      <div className="relative z-10 text-center px-4 py-24 max-w-xl mx-auto">

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full mb-8"
          style={{ background: 'rgba(255,200,87,0.07)', border: '1px solid rgba(255,200,87,0.25)' }}>
          <motion.div animate={{ rotate: [0, -14, 0, 14, 0] }} transition={{ duration: 2.4, repeat: Infinity }}>
            <Wrench className="w-3.5 h-3.5 text-amber-400/80" />
          </motion.div>
          <span className="font-pixel" style={{ fontSize: 9, color: 'rgba(255,200,87,0.85)', letterSpacing: '0.2em' }}>
            В РАЗРАБОТКЕ
          </span>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="font-heading font-black leading-none mb-5"
          style={{ fontSize: 'clamp(44px,7vw,80px)', letterSpacing: '-0.02em' }}>
          <span className="text-white">ARCANE</span>{' '}
          <span style={{
            background: 'linear-gradient(90deg, #7C3AED 0%, #FF00AA 50%, #00E5FF 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            filter: 'drop-shadow(0 0 30px rgba(124,58,237,0.5))',
          }}>DROP</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25, duration: 0.5 }}
          className="font-body text-white/40 mx-auto mb-8"
          style={{ fontSize: 16, maxWidth: 440, lineHeight: 1.7 }}>
          Аркадные машины с наградами почти готовы. Мы дорабатываем систему —
          запуск совсем скоро.
        </motion.p>

        <motion.p
          className="font-pixel mb-10"
          style={{ fontSize: 9, color: 'rgba(124,58,237,0.55)', letterSpacing: '0.22em' }}
          animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2.4, repeat: Infinity }}>
          ◆ COMING SOON ◆
        </motion.p>

        {/* CTA → каталог */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Link href="/catalog"
            className="inline-flex items-center gap-2 px-7 rounded-xl font-heading font-bold text-white"
            style={{
              height: 52, lineHeight: '52px', fontSize: 14,
              background: 'linear-gradient(135deg, rgba(124,58,237,0.25) 0%, rgba(124,58,237,0.1) 100%)',
              border: '1px solid rgba(124,58,237,0.4)',
              boxShadow: '0 0 30px rgba(124,58,237,0.25)',
            }}>
            А пока — в каталог игр
            <ChevronRight className="w-4 h-4 opacity-60" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
