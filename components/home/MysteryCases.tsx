'use client';

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { CASES_LIST } from '@/lib/casesData';
import { CaseCard } from '@/components/cases/CaseCard';
import Link from 'next/link';

export default function MysteryCases() {
  return (
    <section className="py-16 sm:py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0F] via-[#0C0A1A] to-[#0A0A0F]" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% 45%, rgba(124,58,237,0.07) 0%, transparent 70%)',
        }}
      />
      {/* Grid texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(124,58,237,1) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,1) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          opacity: 0.018,
        }}
      />
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background:
            'linear-gradient(90deg, transparent 5%, rgba(124,58,237,0.4) 40%, rgba(6,182,212,0.25) 65%, transparent 95%)',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-14"
        >
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-5"
            style={{
              background: 'rgba(124,58,237,0.1)',
              border: '1px solid rgba(124,58,237,0.28)',
            }}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#9D60FA]" />
            <span
              className="font-heading font-semibold text-[#9D60FA]"
              style={{ fontSize: '11px', letterSpacing: '0.13em', textTransform: 'uppercase' }}
            >
              Mystery Cases
            </span>
          </div>

          <h2
            className="font-heading font-bold text-white mb-3 leading-tight"
            style={{ fontSize: 'clamp(26px, 3.5vw, 40px)' }}
          >
            Открой свой{' '}
            <span
              style={{
                background: 'linear-gradient(90deg, #9D60FA 0%, #06B6D4 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              фантомный кейс
            </span>
          </h2>

          <p
            className="font-body mx-auto"
            style={{ fontSize: '15px', color: '#6B7280', maxWidth: '440px', lineHeight: '1.7' }}
          >
            Гарантированная ценность внутри каждого кейса — игры, ключи и Arcane Coins.
          </p>
        </motion.div>

        {/* Cases grid — items-stretch ensures equal card heights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-stretch">
          {CASES_LIST.map((c, i) => (
            <motion.div
              key={c.id}
              className="flex"
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              <CaseCard caseConfig={c} showDrops={false} className="w-full" />
            </motion.div>
          ))}
        </div>

        {/* CTA link */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center mt-10"
        >
          <Link
            href="/cases"
            className="inline-flex items-center gap-2 text-sm font-bold text-accent-cyan/70
                       hover:text-accent-cyan transition-colors uppercase tracking-widest"
          >
            Все кейсы и живые дропы →
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
