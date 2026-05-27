'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, Search, CreditCard, Zap, KeyRound,
  PackageOpen, Users, HelpCircle, MessageCircle, ArrowRight,
} from 'lucide-react';

/* ── Data ─────────────────────────────────────────────────── */
const CATEGORIES = [
  { id: 'all',      label: 'Все вопросы', icon: HelpCircle  },
  { id: 'payment',  label: 'Оплата',      icon: CreditCard  },
  { id: 'delivery', label: 'Доставка',    icon: Zap         },
  { id: 'keys',     label: 'Ключи',       icon: KeyRound    },
  { id: 'cases',    label: 'Mystery Case',icon: PackageOpen },
  { id: 'account',  label: 'Аккаунт',     icon: Users       },
];

interface FaqItem {
  cat: string;
  q:   string;
  a:   string;
}

const FAQS: FaqItem[] = [
  // Payment
  {
    cat: 'payment',
    q: 'Какие способы оплаты доступны?',
    a: 'Мы принимаем Click, Payme, UzCard, HUMO и Uzum Bank. Все платежи обрабатываются безопасно через зашифрованное соединение.',
  },
  {
    cat: 'payment',
    q: 'Могу ли я получить возврат средств?',
    a: 'Возврат возможен, если ключ оказался нерабочим или уже использован. Напишите в поддержку в течение 48 часов после покупки — мы вернём деньги или заменим товар.',
  },
  {
    cat: 'payment',
    q: 'Почему оплата не проходит?',
    a: 'Убедитесь, что на карте достаточно средств и не превышен дневной лимит. Если проблема сохраняется — попробуйте другой способ оплаты или обратитесь в поддержку.',
  },
  {
    cat: 'payment',
    q: 'Что такое Arcane Coins?',
    a: 'Arcane Coins — наша программа лояльности. За каждую покупку начисляется 1% суммы в монетах. Ими можно оплатить до 30% стоимости следующего заказа.',
  },
  // Delivery
  {
    cat: 'delivery',
    q: 'Как быстро я получу ключ?',
    a: 'Товары с пометкой «Мгновенно» доставляются автоматически сразу после оплаты — обычно в течение 10–30 секунд. Ключ придёт на email и будет доступен в личном кабинете.',
  },
  {
    cat: 'delivery',
    q: 'Ключ не пришёл на email, что делать?',
    a: 'Проверьте папку «Спам» — письмо иногда попадает туда. Если письма нет совсем, зайдите в раздел «Мои заказы» в личном кабинете — ключ отображается там. Если и там нет — пишите в поддержку.',
  },
  {
    cat: 'delivery',
    q: 'Есть ли доставка физических копий?',
    a: 'Нет, ARCANE.UZ работает только с цифровыми ключами. Это позволяет обеспечить мгновенную доставку без ожидания.',
  },
  // Keys
  {
    cat: 'keys',
    q: 'Для каких регионов работают ключи?',
    a: 'Большинство товаров активируются в регионе RU/CIS (Узбекистан, Россия и другие страны СНГ). Регион всегда указан на странице товара — проверяйте перед покупкой.',
  },
  {
    cat: 'keys',
    q: 'Как активировать ключ Steam?',
    a: 'Откройте Steam → меню «Игры» → «Активировать продукт Steam» → введите ключ. Либо перейдите на store.steampowered.com/account/registerkey и активируйте через браузер.',
  },
  {
    cat: 'keys',
    q: 'Как активировать ключ Xbox / Microsoft Store?',
    a: 'Перейдите на redeem.microsoft.com, войдите в аккаунт Microsoft и введите 25-значный ключ. Контент автоматически добавится в вашу библиотеку.',
  },
  {
    cat: 'keys',
    q: 'Ключ выдаёт ошибку при активации, что делать?',
    a: 'Убедитесь, что регион вашего аккаунта совпадает с регионом ключа (RU/CIS). Если регион верный и ошибка сохраняется — обратитесь в поддержку с фотографией экрана с ошибкой.',
  },
  {
    cat: 'keys',
    q: 'Могу ли я активировать ключ в другой стране?',
    a: 'Ключи RU/CIS работают только в соответствующих регионах. Если вы находитесь за пределами СНГ, активация может не сработать без VPN с IP этих стран.',
  },
  // Mystery Case
  {
    cat: 'cases',
    q: 'Что такое Mystery Case?',
    a: 'Mystery Case — случайный набор игр по выгодной цене. Вы не знаете содержимое до открытия, но гарантированная суммарная ценность всегда выше цены кейса.',
  },
  {
    cat: 'cases',
    q: 'Можно ли вернуть содержимое кейса?',
    a: 'После открытия кейс возврату не подлежит — содержимое генерируется случайно и сразу передаётся вам. Исключение — технически нерабочий ключ.',
  },
  {
    cat: 'cases',
    q: 'Насколько честен алгоритм кейсов?',
    a: 'Каждый кейс имеет опубликованную таблицу шансов — вы видите вероятность каждой категории редкости перед покупкой. Алгоритм использует криптографически безопасный генератор случайных чисел.',
  },
  // Account
  {
    cat: 'account',
    q: 'Как посмотреть историю заказов?',
    a: 'Перейдите в профиль → раздел «Заказы». Там отображаются все покупки с ключами активации и статусами.',
  },
  {
    cat: 'account',
    q: 'Как работает реферальная программа?',
    a: 'Пригласите друга по своей реферальной ссылке из профиля — когда он совершит первую покупку, вы оба получите бонус в Arcane Coins.',
  },
  {
    cat: 'account',
    q: 'Как удалить аккаунт?',
    a: 'Напишите в поддержку с темой «Удаление аккаунта» с почты, привязанной к аккаунту. Мы удалим его в течение 72 часов.',
  },
];

/* ── Accordion item ───────────────────────────────────────── */
function AccordionItem({ item, idx }: { item: FaqItem; idx: number }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.035, duration: 0.3 }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: '#0D0D16',
        border: `1px solid ${open ? 'rgba(124,58,237,0.35)' : 'rgba(255,255,255,0.07)'}`,
        transition: 'border-color 0.2s',
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="font-heading font-medium text-white" style={{ fontSize: '14px', lineHeight: '1.4' }}>
          {item.q}
        </span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.22 }} className="flex-shrink-0">
          <ChevronDown style={{ width: '16px', height: '16px', color: open ? '#A78BFA' : '#4B5563' }} />
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
              <div className="h-px mb-4" style={{ background: 'rgba(124,58,237,0.18)' }} />
              <p className="font-body text-[#9CA3AF]" style={{ fontSize: '13.5px', lineHeight: '1.75' }}>
                {item.a}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── Page ─────────────────────────────────────────────────── */
export default function FaqPage() {
  const [activeCat, setActiveCat] = useState('all');
  const [query,     setQuery]     = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FAQS.filter(item => {
      if (activeCat !== 'all' && item.cat !== activeCat) return false;
      if (!q) return true;
      return item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q);
    });
  }, [activeCat, query]);

  return (
    <div className="min-h-screen" style={{ background: '#05040B', paddingTop: '120px' }}>

      {/* Grid bg */}
      <div className="fixed inset-0 pointer-events-none"
           style={{
             backgroundImage: 'linear-gradient(rgba(124,58,237,1) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,1) 1px, transparent 1px)',
             backgroundSize: '52px 52px', opacity: 0.016,
           }} />

      <div className="relative max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-20">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-5"
               style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.22)' }}>
            <HelpCircle style={{ width: '12px', height: '12px', color: '#A78BFA' }} />
            <span className="font-heading font-semibold text-[#A78BFA]"
                  style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              FAQ
            </span>
          </div>
          <h1 className="font-heading font-bold text-white mb-3"
              style={{ fontSize: 'clamp(26px, 4vw, 38px)' }}>
            Часто задаваемые вопросы
          </h1>
          <p className="font-body text-[#6B7280]" style={{ fontSize: '15px' }}>
            {FAQS.length} ответов на самые популярные вопросы
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ width: '15px', height: '15px', color: '#4B5563' }}
          />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Поиск по вопросам..."
            className="w-full rounded-2xl pl-10 pr-4 py-3 font-body text-white outline-none placeholder:text-[#1F2937]"
            style={{
              background: '#0D0D16',
              border: '1px solid rgba(255,255,255,0.08)',
              fontSize: '13.5px',
              transition: 'border-color 0.2s',
            }}
            onFocus={e  => (e.currentTarget.style.borderColor = 'rgba(124,58,237,0.4)')}
            onBlur={e   => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
          />
        </div>

        {/* Category pills */}
        <div className="flex gap-2 flex-wrap mb-8">
          {CATEGORIES.map(cat => {
            const active = activeCat === cat.id;
            const Icon   = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCat(cat.id)}
                className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-body transition-all duration-200"
                style={{
                  fontSize:   '12px',
                  background: active ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.04)',
                  border:     `1px solid ${active ? 'rgba(124,58,237,0.35)' : 'rgba(255,255,255,0.07)'}`,
                  color:      active ? '#A78BFA' : '#6B7280',
                }}
              >
                <Icon style={{ width: '11px', height: '11px' }} />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Items */}
        <AnimatePresence mode="wait">
          {filtered.length > 0 ? (
            <motion.div
              key={`${activeCat}-${query}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-2.5"
            >
              {filtered.map((item, i) => (
                <AccordionItem key={item.q} item={item} idx={i} />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <HelpCircle className="w-10 h-10 mx-auto mb-4" style={{ color: '#1F2937' }} />
              <p className="font-heading font-semibold text-[#374151] mb-1" style={{ fontSize: '15px' }}>
                Ничего не найдено
              </p>
              <p className="font-body text-[#1F2937]" style={{ fontSize: '13px' }}>
                Попробуйте другой запрос или напишите нам
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Contact CTA */}
        <div className="mt-12 rounded-2xl p-7 text-center"
             style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.18)' }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
               style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)' }}>
            <MessageCircle style={{ width: '20px', height: '20px', color: '#A78BFA' }} />
          </div>
          <h3 className="font-heading font-bold text-white mb-2" style={{ fontSize: '17px' }}>
            Не нашли ответ?
          </h3>
          <p className="font-body text-[#6B7280] mb-5" style={{ fontSize: '13.5px' }}>
            Наша поддержка отвечает менее чем за 5 минут
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <a
              href="https://t.me/arcaneuz_support"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 font-heading font-semibold text-white transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #06B6D4, #0891B2)', fontSize: '13px' }}
            >
              <MessageCircle style={{ width: '14px', height: '14px' }} />
              Telegram
            </a>
            <Link
              href="/support"
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 font-heading font-semibold text-white transition-all hover:opacity-90"
              style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', fontSize: '13px', color: '#A78BFA' }}
            >
              Создать тикет
              <ArrowRight style={{ width: '13px', height: '13px' }} />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
