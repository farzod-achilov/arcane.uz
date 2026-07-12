'use client';

import { motion } from 'framer-motion';
import { Key, User, Gift as GiftIcon, Send, ExternalLink } from 'lucide-react';
import type { ElementType } from 'react';

type ProductType = 'KEY' | 'GIFT' | 'ACCOUNT';

interface Props {
  productType: ProductType;
  isManual: boolean;
}

const CONFIG: Record<ProductType, { title: string; icon: ElementType; color: string; steps: string[] }> = {
  KEY: {
    title: 'Ключ активации Steam',
    icon: Key,
    color: '#22C55E',
    steps: [
      'Оплатите заказ',
      'Ключ придёт на email и появится в личном кабинете',
      'Откройте Steam → Игры → Активировать продукт в Steam',
      'Введите полученный код и следуйте инструкциям на экране',
      'Игра появится в вашей библиотеке — можно скачивать',
    ],
  },
  ACCOUNT: {
    title: 'Аккаунт Steam с игрой',
    icon: User,
    color: '#06B6D4',
    steps: [
      'Оплатите заказ',
      'На email и в личном кабинете придут логин и пароль от Steam-аккаунта с игрой, а также данные привязанной почты (для кода Steam Guard)',
      'Войдите в Steam с полученными данными — вводить их как код активации не нужно',
      'Если Steam запросит код подтверждения, возьмите его из письма на привязанной почте',
      'Не меняйте пароль и email аккаунта сразу после входа — это может привести к блокировке',
    ],
  },
  GIFT: {
    title: 'Steam-подарок',
    icon: GiftIcon,
    color: '#F59E0B',
    steps: [
      'Оплатите заказ',
      'Игра будет отправлена вам подарком напрямую в Steam',
      'Проверьте уведомления и предложения подарков в Steam-клиенте',
      'Примите подарок',
      'Игра появится в вашей библиотеке',
    ],
  },
};

export default function ActivationGuide({ productType, isManual }: Props) {
  const cfg  = CONFIG[productType];
  const Icon = cfg.icon;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="h-px flex-1" style={{ background: `${cfg.color}22` }} />
        <p className="font-pixel" style={{ fontSize: '9px', color: cfg.color, letterSpacing: '0.14em' }}>
          КАК АКТИВИРОВАТЬ
        </p>
        <div className="h-px flex-1" style={{ background: `${cfg.color}22` }} />
      </div>

      <div
        className="relative rounded-2xl overflow-hidden p-6"
        style={{ background: '#0D0D16', border: `1px solid ${cfg.color}33` }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${cfg.color}14`, border: `1px solid ${cfg.color}33` }}
          >
            <Icon style={{ width: '16px', height: '16px', color: cfg.color }} />
          </div>
          <div>
            <p className="font-heading font-bold text-white" style={{ fontSize: '14px' }}>{cfg.title}</p>
            <p className="font-body text-[#4B5563]" style={{ fontSize: '11px' }}>
              {isManual ? 'Администратор обрабатывает заказ вручную' : 'Обычно в течение нескольких минут после оплаты'}
            </p>
          </div>
        </div>

        <div className="space-y-0">
          {cfg.steps.map((step, i) => (
            <div key={i} className="flex gap-4 relative">
              {i < cfg.steps.length - 1 && (
                <div
                  className="absolute left-[17px] top-[34px] w-px"
                  style={{ height: 'calc(100% - 10px)', background: `${cfg.color}20` }}
                />
              )}
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-pixel z-10"
                style={{
                  background: i === 0 ? `${cfg.color}14` : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${i === 0 ? `${cfg.color}33` : 'rgba(255,255,255,0.07)'}`,
                  fontSize: '10px',
                  color: i === 0 ? cfg.color : '#4B5563',
                }}
              >
                {i + 1}
              </div>
              <p className="font-body text-[#9CA3AF] pb-5 pt-2 flex-1" style={{ fontSize: '13px', lineHeight: '1.55' }}>
                {step}
              </p>
            </div>
          ))}
        </div>

        {isManual && (
          <div
            className="flex items-start gap-3 rounded-xl p-4 mt-2"
            style={{ background: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.15)' }}
          >
            <Send style={{ width: '14px', height: '14px', color: '#06B6D4', flexShrink: 0, marginTop: '1px' }} />
            <div>
              <p className="font-body text-[#9CA3AF]" style={{ fontSize: '12.5px' }}>Есть вопросы по заказу — напишите нам</p>
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
    </motion.section>
  );
}
