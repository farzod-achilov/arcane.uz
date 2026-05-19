'use client';

import { motion } from 'framer-motion';
import { Send, MessageCircle, Clock, Shield, Headphones, Zap } from 'lucide-react';

const features = [
  { icon: Zap,         text: 'Ответ за 5 минут',  sub: 'среднее время' },
  { icon: Clock,       text: '24 / 7',             sub: 'без выходных'  },
  { icon: Shield,      text: 'Безопасно',          sub: 'проверено'     },
  { icon: Headphones,  text: 'На русском',         sub: 'живые агенты'  },
];

export default function TelegramSupport() {
  return (
    <section className="py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative rounded-3xl overflow-hidden"
        >

          {/* ── Background layers ── */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(135deg, #0C0B18 0%, #090D18 50%, #080B14 100%)',
            }}
          />
          {/* Left cyan glow */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 55% 100% at -5% 50%, rgba(6,182,212,0.11) 0%, transparent 70%)',
            }}
          />
          {/* Right purple glow */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 50% 100% at 105% 50%, rgba(124,58,237,0.09) 0%, transparent 70%)',
            }}
          />
          {/* Subtle grid */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(rgba(6,182,212,1) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,1) 1px, transparent 1px)',
              backgroundSize: '44px 44px',
              opacity: 0.018,
            }}
          />
          {/* Border ring */}
          <div
            className="absolute inset-0 rounded-3xl pointer-events-none"
            style={{ border: '1px solid rgba(6,182,212,0.14)' }}
          />
          {/* Top highlight line */}
          <div
            className="absolute top-0 left-0 right-0 h-px pointer-events-none"
            style={{
              background:
                'linear-gradient(90deg, transparent 5%, rgba(6,182,212,0.5) 35%, rgba(6,182,212,0.7) 55%, rgba(124,58,237,0.35) 80%, transparent 95%)',
            }}
          />

          {/* Decorative large ring — far right */}
          <div
            className="absolute -right-20 top-1/2 -translate-y-1/2 w-80 h-80 rounded-full pointer-events-none"
            style={{
              border: '1px solid rgba(6,182,212,0.07)',
              boxShadow: 'inset 0 0 40px rgba(6,182,212,0.04)',
            }}
          />
          <div
            className="absolute -right-6 top-1/2 -translate-y-1/2 w-52 h-52 rounded-full pointer-events-none"
            style={{ border: '1px solid rgba(6,182,212,0.05)' }}
          />

          {/* ── Content ── */}
          <div className="relative flex flex-col lg:flex-row items-center justify-between gap-10 p-9 sm:p-12 lg:p-14">

            {/* LEFT — text + badges */}
            <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left">

              {/* Top label */}
              <div className="inline-flex items-center gap-3 mb-6">
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: 'rgba(6,182,212,0.1)',
                    border: '1px solid rgba(6,182,212,0.25)',
                    boxShadow: '0 0 20px rgba(6,182,212,0.12)',
                  }}
                >
                  <Send className="w-5 h-5 text-[#06B6D4]" />
                </div>
                <div className="flex flex-col items-start gap-0.5">
                  <span
                    className="font-heading font-semibold text-[#06B6D4]"
                    style={{ fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase' }}
                  >
                    Telegram Support
                  </span>
                  {/* Online indicator */}
                  <div className="flex items-center gap-1.5">
                    <motion.span
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1.8, repeat: Infinity }}
                      className="w-1.5 h-1.5 rounded-full bg-[#22C55E]"
                      style={{ boxShadow: '0 0 5px rgba(34,197,94,0.8)' }}
                    />
                    <span
                      className="font-body text-[#22C55E]"
                      style={{ fontSize: '11px' }}
                    >
                      Онлайн сейчас
                    </span>
                  </div>
                </div>
              </div>

              {/* Headline */}
              <h2 className="font-heading font-bold text-white mb-3" style={{ fontSize: 'clamp(24px, 3vw, 34px)', lineHeight: 1.2 }}>
                Нужна помощь?{' '}
                <span
                  style={{
                    color: '#22D3EE',
                    textShadow: '0 0 20px rgba(6,182,212,0.35)',
                  }}
                >
                  Мы рядом
                </span>
              </h2>

              {/* Description */}
              <p
                className="font-body leading-relaxed max-w-md mb-8"
                style={{ fontSize: '14px', color: '#6B7280', lineHeight: '1.7' }}
              >
                Команда поддержки помогает с покупками, активацией ключей и любыми вопросами. Быстро, честно, на вашем языке.
              </p>

              {/* Feature badges */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-2">
                {features.map((f, i) => (
                  <motion.div
                    key={f.text}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.15 + i * 0.08, ease: 'easeOut' }}
                    className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl"
                    style={{
                      background: 'rgba(6,182,212,0.06)',
                      border: '1px solid rgba(6,182,212,0.13)',
                    }}
                  >
                    <f.icon
                      className="w-[14px] h-[14px] flex-shrink-0"
                      style={{ color: '#06B6D4' }}
                    />
                    <div className="flex flex-col items-start leading-none">
                      <span
                        className="font-heading font-semibold text-[#E2E8F0]"
                        style={{ fontSize: '12px' }}
                      >
                        {f.text}
                      </span>
                      <span
                        className="font-body text-[#4B5563] mt-0.5"
                        style={{ fontSize: '10px', letterSpacing: '0.04em' }}
                      >
                        {f.sub}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* RIGHT — CTA */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.25, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center gap-5 shrink-0"
            >
              {/* CTA card */}
              <div
                className="flex flex-col items-center gap-4 px-8 py-7 rounded-2xl"
                style={{
                  background: 'rgba(6,182,212,0.05)',
                  border: '1px solid rgba(6,182,212,0.16)',
                  boxShadow: '0 0 40px rgba(6,182,212,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
                  minWidth: '240px',
                }}
              >
                {/* CTA button */}
                <motion.a
                  href="https://t.me/arcaneuz_support"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="group relative inline-flex items-center gap-3 w-full justify-center overflow-hidden rounded-xl font-heading font-semibold text-white"
                  style={{
                    background: 'linear-gradient(135deg, #06B6D4 0%, #0E9CB8 60%, #0891B2 100%)',
                    padding: '14px 28px',
                    fontSize: '14px',
                    letterSpacing: '0.025em',
                    boxShadow:
                      '0 0 0 1px rgba(6,182,212,0.4), 0 4px 24px rgba(6,182,212,0.35), inset 0 1px 0 rgba(255,255,255,0.15)',
                  }}
                >
                  {/* Shine on hover */}
                  <span
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{
                      background:
                        'linear-gradient(135deg, rgba(255,255,255,0.14) 0%, transparent 55%)',
                    }}
                  />
                  <MessageCircle className="w-[18px] h-[18px] relative z-10 flex-shrink-0" />
                  <span className="relative z-10">Написать в Telegram</span>
                </motion.a>

                {/* Handle */}
                <p
                  className="font-body text-[#4B5563]"
                  style={{ fontSize: '12px', letterSpacing: '0.03em' }}
                >
                  @arcaneuz_support
                </p>

                {/* Divider */}
                <div
                  className="w-full h-px"
                  style={{
                    background:
                      'linear-gradient(90deg, transparent, rgba(6,182,212,0.15), transparent)',
                  }}
                />

                {/* Trust stat */}
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center">
                    <span
                      className="font-heading font-bold text-[#22D3EE]"
                      style={{ fontSize: '16px', lineHeight: 1 }}
                    >
                      &lt; 5 мин
                    </span>
                    <span
                      className="font-body text-[#4B5563] mt-1"
                      style={{ fontSize: '10px', letterSpacing: '0.06em' }}
                    >
                      СРЕДНЕЕ ВРЕМЯ
                    </span>
                  </div>
                  <div
                    className="w-px h-8 self-center"
                    style={{ background: 'rgba(6,182,212,0.12)' }}
                  />
                  <div className="flex flex-col items-center">
                    <span
                      className="font-heading font-bold text-[#22D3EE]"
                      style={{ fontSize: '16px', lineHeight: 1 }}
                    >
                      24 / 7
                    </span>
                    <span
                      className="font-body text-[#4B5563] mt-1"
                      style={{ fontSize: '10px', letterSpacing: '0.06em' }}
                    >
                      БЕЗ ВЫХОДНЫХ
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
