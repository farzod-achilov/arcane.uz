'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle } from 'lucide-react';
import type { FaqItem } from '@/lib/types';

const DEFAULT_FAQ: FaqItem[] = [
  {
    id: 'region',
    question: 'Это RU/CIS версия игры?',
    answer: 'Да, все ключи в нашем магазине предназначены для региона RU/CIS. Игры поддерживают русский язык и не требуют VPN для активации.',
  },
  {
    id: 'refund',
    question: 'Возможен ли возврат средств?',
    answer: 'Мы гарантируем работоспособность каждого ключа. Если ключ не активируется — мы заменим его или вернём деньги. Обратитесь в нашу поддержку в Telegram @arcaneuz_support.',
  },
  {
    id: 'delivery',
    question: 'Как быстро я получу ключ?',
    answer: 'Большинство ключей доставляются мгновенно (1–5 минут) автоматически на email после оплаты. Некоторые типы доставки (Steam Gift, Telegram-активация) занимают немного больше времени — всё указано на странице продукта.',
  },
  {
    id: 'activation',
    question: 'Как активировать ключ?',
    answer: 'Для Steam: Игры → Активировать продукт в Steam → введите ключ. Для Epic Games: Store → иконка профиля → Активировать код. Подробная инструкция также отправляется вместе с ключом на email.',
  },
  {
    id: 'vpn',
    question: 'Нужен ли VPN для активации?',
    answer: 'Нет! Ключи RU/CIS активируются без VPN. Просто войдите в Steam или Epic Games и введите код — всё работает напрямую.',
  },
  {
    id: 'preload',
    question: 'Можно ли предзагрузить игру?',
    answer: 'После активации ключа в Steam или Epic Games вы можете начать скачивание сразу. Если игра ещё не вышла (предзаказ) — скачивание станет доступно за несколько дней до релиза.',
  },
];

interface ProductFAQProps {
  faq?: FaqItem[];
}

export default function ProductFAQ({ faq }: ProductFAQProps) {
  const items = (faq && faq.length > 0) ? faq : DEFAULT_FAQ;
  const [open, setOpen] = useState<string | null>(items[0]?.id ?? null);

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="mb-12"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-px flex-1" style={{ background: 'rgba(245,158,11,0.15)' }} />
        <p className="font-pixel" style={{ fontSize: '9px', color: '#F59E0B', letterSpacing: '0.14em' }}>
          ЧАСТЫЕ ВОПРОСЫ
        </p>
        <div className="h-px flex-1" style={{ background: 'rgba(245,158,11,0.15)' }} />
      </div>
      <h2 className="font-heading font-bold text-white text-xl sm:text-2xl mb-6">
        FAQ
      </h2>

      <div className="space-y-2">
        {items.map((item, i) => {
          const isOpen = open === item.id;
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 6 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="rounded-2xl overflow-hidden"
              style={{
                background: isOpen ? 'rgba(124,58,237,0.06)' : '#0D0D16',
                border: `1px solid ${isOpen ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.06)'}`,
                boxShadow: isOpen ? '0 0 16px rgba(124,58,237,0.08)' : 'none',
                transition: 'all 0.25s ease',
              }}
            >
              {/* Question */}
              <button
                onClick={() => setOpen(isOpen ? null : item.id)}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{
                      background: isOpen ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${isOpen ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.07)'}`,
                    }}
                  >
                    <HelpCircle
                      style={{ width: '13px', height: '13px', color: isOpen ? '#9D60FA' : '#374151' }}
                    />
                  </div>
                  <span
                    className="font-heading font-semibold line-clamp-1"
                    style={{ fontSize: '13.5px', color: isOpen ? '#E2E8F0' : '#9CA3AF' }}
                  >
                    {item.question}
                  </span>
                </div>
                <motion.div
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex-shrink-0"
                >
                  <ChevronDown
                    style={{ width: '16px', height: '16px', color: isOpen ? '#7C3AED' : '#374151' }}
                  />
                </motion.div>
              </button>

              {/* Answer */}
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div
                      className="px-5 pb-5 pt-0"
                      style={{ borderTop: '1px solid rgba(124,58,237,0.1)' }}
                    >
                      <p
                        className="font-body text-[#6B7280] leading-relaxed pt-4"
                        style={{ fontSize: '13px', lineHeight: '1.65' }}
                      >
                        {item.answer}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}
