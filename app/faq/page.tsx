'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const FAQS = [
  {
    q: 'Как быстро я получу ключ активации?',
    a: 'После успешной оплаты ключ активации приходит мгновенно на указанный email. Обычно это занимает от 10 секунд до 5 минут.',
  },
  {
    q: 'Какие способы оплаты доступны?',
    a: 'Мы принимаем Click, Payme, UzCard, HUMO и Uzum Bank. Все платежи безопасны и зашифрованы.',
  },
  {
    q: 'Для каких регионов работают ключи?',
    a: 'Большинство ключей работают в регионе RU/CIS (Россия, Узбекистан и другие страны СНГ). Регион указан на странице каждого товара.',
  },
  {
    q: 'Что такое Arcane Coins?',
    a: 'Arcane Coins — наша система лояльности. За каждую покупку вы получаете монеты (1% от суммы), которые можно использовать как скидку на следующие заказы.',
  },
  {
    q: 'Что делать если ключ не работает?',
    a: 'Если ключ не активируется, напишите нам в Telegram @arcaneuz_support. Мы заменим ключ или вернём деньги в течение 24 часов.',
  },
  {
    q: 'Как активировать ключ Steam?',
    a: 'Откройте Steam → нажмите «Игры» → «Активировать продукт Steam» → введите ключ. Также можно активировать через браузер на store.steampowered.com.',
  },
  {
    q: 'Есть ли доставка физических копий?',
    a: 'Нет, ARCANE.UZ работает только с цифровыми ключами. Это позволяет нам обеспечить мгновенную доставку.',
  },
  {
    q: 'Как работает Mystery Case?',
    a: 'Mystery Case — это набор случайных игр по выгодной цене. Содержимое генерируется случайным образом, но гарантированная ценность всегда выше цены кейса.',
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl overflow-hidden transition-all duration-200"
         style={{
           background: '#0D0D16',
           border: `1px solid ${open ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.07)'}`,
         }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="font-heading font-medium text-white" style={{ fontSize: '14.5px' }}>{q}</span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0"
        >
          <ChevronDown style={{ width: '16px', height: '16px', color: '#7C3AED' }} />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="px-5 pb-5 pt-0">
              <div className="h-px mb-4" style={{ background: 'rgba(124,58,237,0.15)' }} />
              <p className="font-body text-[#6B7280]" style={{ fontSize: '14px', lineHeight: '1.7' }}>{a}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FaqPage() {
  return (
    <div className="min-h-screen" style={{ background: '#05040B', paddingTop: '120px' }}>
      <div className="fixed inset-0 pointer-events-none"
           style={{
             backgroundImage: 'linear-gradient(rgba(124,58,237,1) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,1) 1px, transparent 1px)',
             backgroundSize: '52px 52px', opacity: 0.018,
           }} />

      <div className="relative max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="text-center mb-12">
          <p className="font-heading font-semibold text-[#7C3AED] mb-3"
             style={{ fontSize: '11px', letterSpacing: '0.13em', textTransform: 'uppercase' }}>
            FAQ
          </p>
          <h1 className="font-heading font-bold text-white mb-3"
              style={{ fontSize: 'clamp(24px, 4vw, 36px)' }}>
            Часто задаваемые вопросы
          </h1>
          <p className="font-body text-[#6B7280]" style={{ fontSize: '15px' }}>
            Не нашли ответ?{' '}
            <a href="https://t.me/arcaneuz_support" target="_blank" rel="noopener noreferrer"
               className="text-[#7C3AED] hover:text-[#9D60FA] transition-colors">
              Напишите нам в Telegram
            </a>
          </p>
        </div>

        <div className="space-y-2.5">
          {FAQS.map((item) => <FaqItem key={item.q} {...item} />)}
        </div>
      </div>
    </div>
  );
}
