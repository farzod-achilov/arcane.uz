'use client';

import { motion } from 'framer-motion';
import { Zap, Gift, Send, Monitor, Package, ExternalLink } from 'lucide-react';
import type { DeliveryType } from '@/lib/types';
import { DELIVERY_CONFIG } from '@/lib/deliveryConfig';

type Step = { icon: string; text: string };

const GUIDES: Record<DeliveryType, { title: string; steps: Step[]; supportNote?: string }> = {
  instant: {
    title: 'Мгновенная доставка — Steam / Epic Games',
    steps: [
      { icon: '1', text: 'Оплатите заказ через Payme, Click или UzCard' },
      { icon: '2', text: 'Ключ активации придёт на ваш email в течение 1–5 минут' },
      { icon: '3', text: 'Откройте Steam → Игры → Активировать продукт в Steam' },
      { icon: '4', text: 'Введите ключ и следуйте инструкциям на экране' },
      { icon: '5', text: 'Игра появится в вашей библиотеке — можно начинать скачивание!' },
    ],
  },
  steam_gift: {
    title: 'Steam Gift — подарок на аккаунт',
    steps: [
      { icon: '1', text: 'Оплатите заказ и укажите ваш Steam профиль или никнейм' },
      { icon: '2', text: 'Напишите нам в Telegram @arcaneuz_support ваш профиль Steam' },
      { icon: '3', text: 'Добавьте нашего менеджера в друзья Steam' },
      { icon: '4', text: 'Мы отправим игру как подарок — проверьте уведомления Steam' },
      { icon: '5', text: 'Примите подарок в Steam → игра появится в библиотеке' },
    ],
    supportNote: 'Необходимо добавить менеджера в друзья. Среднее время: 1–3 часа.',
  },
  telegram_activation: {
    title: 'Активация через Telegram',
    steps: [
      { icon: '1', text: 'Оплатите заказ и сохраните номер заказа' },
      { icon: '2', text: 'Напишите в @arcaneuz_support с номером заказа' },
      { icon: '3', text: 'Менеджер свяжется с вами в течение 30 минут' },
      { icon: '4', text: 'Следуйте инструкциям менеджера для активации' },
      { icon: '5', text: 'Подтвердите успешную активацию — игра доступна!' },
    ],
    supportNote: 'Поддержка работает 24/7. Среднее время: 30 минут.',
  },
  offline_activation: {
    title: 'Офлайн-активация',
    steps: [
      { icon: '1', text: 'Оплатите заказ и выберите удобное время' },
      { icon: '2', text: 'Свяжитесь с нами в Telegram для согласования' },
      { icon: '3', text: 'Наш специалист подключится удалённо или встретится лично' },
      { icon: '4', text: 'Активация займёт около 15–30 минут' },
      { icon: '5', text: 'Получите подтверждение успешной активации' },
    ],
    supportNote: 'Для корпоративных заказов — напишите нам отдельно.',
  },
  manual_delivery: {
    title: 'Ручная обработка заказа',
    steps: [
      { icon: '1', text: 'Оформите и оплатите предзаказ' },
      { icon: '2', text: 'Менеджер проверит заказ в течение 24 часов' },
      { icon: '3', text: 'В день выхода игры вы получите уведомление на email' },
      { icon: '4', text: 'Ключ будет доставлен согласно выбранному формату' },
      { icon: '5', text: 'Активируйте согласно инструкции в письме' },
    ],
    supportNote: 'По вопросам предзаказа пишите в @arcaneuz_support.',
  },
};

const ICONS: Record<DeliveryType, React.ElementType> = {
  instant: Zap,
  steam_gift: Gift,
  telegram_activation: Send,
  offline_activation: Monitor,
  manual_delivery: Package,
};

interface ActivationGuideProps {
  deliveryType: DeliveryType;
}

export default function ActivationGuide({ deliveryType }: ActivationGuideProps) {
  const guide  = GUIDES[deliveryType];
  const cfg    = DELIVERY_CONFIG[deliveryType];
  const Icon   = ICONS[deliveryType];

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="mb-12"
    >
      {/* Section header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-px flex-1" style={{ background: `${cfg.color}22` }} />
        <p className="font-pixel" style={{ fontSize: '9px', color: cfg.color, letterSpacing: '0.14em' }}>
          КАК АКТИВИРОВАТЬ
        </p>
        <div className="h-px flex-1" style={{ background: `${cfg.color}22` }} />
      </div>
      <h2 className="font-heading font-bold text-white text-xl sm:text-2xl mb-6">
        Инструкция по активации
      </h2>

      <div
        className="relative rounded-2xl overflow-hidden"
        style={{ background: '#0D0D16', border: `1px solid ${cfg.border}` }}
      >
        {/* Top line */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${cfg.color}60, transparent)` }}
        />
        {/* Ambient glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse 50% 60% at 5% 50%, ${cfg.glow} 0%, transparent 65%)` }}
        />

        <div className="relative z-10 p-6">
          {/* Guide header */}
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, boxShadow: `0 0 16px ${cfg.glow}` }}
            >
              <Icon style={{ width: '16px', height: '16px', color: cfg.color }} />
            </div>
            <div>
              <p className="font-heading font-bold text-white" style={{ fontSize: '14px' }}>{guide.title}</p>
              <p className="font-body text-[#4B5563]" style={{ fontSize: '11px' }}>Среднее время: {cfg.defaultTime}</p>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-0">
            {guide.steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="flex gap-4 relative"
              >
                {/* Vertical connector */}
                {i < guide.steps.length - 1 && (
                  <div
                    className="absolute left-[17px] top-[34px] w-px"
                    style={{ height: 'calc(100% - 10px)', background: `${cfg.color}20` }}
                  />
                )}
                {/* Step number */}
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-pixel z-10"
                  style={{
                    background: i === 0 ? cfg.bg : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${i === 0 ? cfg.border : 'rgba(255,255,255,0.07)'}`,
                    fontSize: '10px',
                    color: i === 0 ? cfg.color : '#4B5563',
                    boxShadow: i === 0 ? `0 0 10px ${cfg.glow}` : 'none',
                  }}
                >
                  {i + 1}
                </div>
                {/* Text */}
                <p
                  className="font-body text-[#9CA3AF] pb-5 pt-2 flex-1"
                  style={{ fontSize: '13px', lineHeight: '1.55' }}
                >
                  {step.text}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Support note */}
          {guide.supportNote && (
            <div
              className="flex items-start gap-3 rounded-xl p-4 mt-2"
              style={{ background: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.15)' }}
            >
              <Send style={{ width: '14px', height: '14px', color: '#06B6D4', flexShrink: 0, marginTop: '1px' }} />
              <div>
                <p className="font-body text-[#9CA3AF]" style={{ fontSize: '12.5px' }}>{guide.supportNote}</p>
                <a
                  href="https://t.me/arcaneuz_support"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-1.5 font-heading font-semibold transition-colors"
                  style={{ fontSize: '12px', color: '#06B6D4' }}
                >
                  @arcaneuz_support
                  <ExternalLink style={{ width: '10px', height: '10px' }} />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.section>
  );
}
