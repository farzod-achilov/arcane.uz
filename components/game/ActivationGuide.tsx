'use client';

import { motion } from 'framer-motion';
import { Key, User, Gift as GiftIcon, Send, ExternalLink } from 'lucide-react';
import type { ElementType } from 'react';

type ProductType = 'KEY' | 'GIFT' | 'ACCOUNT';

interface Props {
  productType: ProductType;
  isManual:    boolean;
  // games.platforms stores Kinguin's own raw platform label ("Steam",
  // "GOG.com", "Epic Games", "Ubisoft") — see app/api/admin/dropship/
  // create/route.ts. Falls back to Steam for the generic 'PC' default
  // some older dropship games were created with, since Kinguin's PC keys
  // are overwhelmingly Steam.
  platforms:   string[];
}

type PlatformKey = 'steam' | 'epic' | 'gog' | 'ubisoft' | 'xbox' | 'playstation' | 'other';

// Falls back to Steam only for the generic 'PC'/empty default (see the
// header comment above) — anything else unrecognized (subscription services
// like Discord Nitro, Telegram Premium etc. with no PC launcher at all)
// goes to 'other' instead of silently claiming it's Steam.
function resolvePlatform(platforms: string[]): PlatformKey {
  const raw = (platforms[0] ?? '').toLowerCase();
  if (raw.includes('epic'))                        return 'epic';
  if (raw.includes('gog'))                          return 'gog';
  if (raw.includes('ubisoft'))                      return 'ubisoft';
  if (raw.includes('xbox'))                         return 'xbox';
  if (raw.includes('playstation') || raw.includes('ps4') || raw.includes('ps5')) return 'playstation';
  if (raw === '' || raw === 'pc' || raw.includes('steam')) return 'steam';
  return 'other';
}

const PLATFORM_LABEL: Record<Exclude<PlatformKey, 'other'>, string> = {
  steam:       'Steam',
  epic:        'Epic Games',
  gog:         'GOG',
  ubisoft:     'Ubisoft Connect',
  xbox:        'Xbox',
  playstation: 'PlayStation',
};

// resolveLabel(), not a static table — 'other' uses the raw platform string
// itself as an undeclined brand name (same as "Steam"/"GOG" above), since we
// don't know in advance every subscription service this might be (Discord,
// Telegram Premium, Spotify, ...) and a generic Russian noun would need to
// decline differently in each sentence slot below.
function resolveLabel(platform: PlatformKey, platforms: string[]): string {
  if (platform === 'other') return platforms[0]?.trim() || 'сервис';
  return PLATFORM_LABEL[platform];
}

const REDEEM_STEP: Record<Exclude<PlatformKey, 'other'>, string> = {
  steam:       'Откройте Steam → Игры → Активировать продукт в Steam',
  epic:        'Откройте Epic Games Launcher или store.epicgames.com/redeem-code и введите код',
  gog:         'Войдите на gog.com или в GOG Galaxy → Аккаунт → Активировать продукт',
  ubisoft:     'Откройте Ubisoft Connect → Игры → Активировать продукт',
  xbox:        'Откройте Microsoft Store или xbox.com/redeem и введите код',
  playstation: 'Откройте PlayStation Store на консоли или store.playstation.com → «Восстановить код»',
};

function resolveRedeemStep(platform: PlatformKey, label: string): string {
  if (platform === 'other') return `Активируйте код на сайте или в приложении ${label} — если шаги нестандартные, уточните у поддержки`;
  return REDEEM_STEP[platform];
}

const ICON: Record<ProductType, ElementType> = { KEY: Key, ACCOUNT: User, GIFT: GiftIcon };
const COLOR: Record<ProductType, string> = { KEY: '#22C55E', ACCOUNT: '#06B6D4', GIFT: '#F59E0B' };

function buildSteps(productType: ProductType, platform: PlatformKey, label: string): string[] {
  if (productType === 'KEY') {
    return [
      'Оплатите заказ',
      'Ключ придёт на email и появится в личном кабинете',
      resolveRedeemStep(platform, label),
      'Введите полученный код и следуйте инструкциям на экране',
      'Игра появится в вашей библиотеке — можно скачивать',
    ];
  }

  if (productType === 'ACCOUNT') {
    return [
      'Оплатите заказ',
      `На email и в личном кабинете придут логин и пароль от ${label}-аккаунта с игрой${platform === 'steam' ? ', а также данные привязанной почты (для кода Steam Guard)' : ''}`,
      `Войдите в ${label} с полученными данными — вводить их как код активации не нужно`,
      platform === 'steam'
        ? 'Если Steam запросит код подтверждения, возьмите его из письма на привязанной почте'
        : `Если ${label} запросит код подтверждения — напишите нам в поддержку`,
      'Не меняйте пароль и email аккаунта сразу после входа — это может привести к блокировке',
    ];
  }

  // GIFT
  return [
    'Оплатите заказ',
    `Игра будет отправлена вам подарком напрямую в ${label}`,
    `Проверьте уведомления и предложения подарков в ${label}`,
    'Примите подарок',
    'Игра появится в вашей библиотеке',
  ];
}

export default function ActivationGuide({ productType, isManual, platforms }: Props) {
  const platform = resolvePlatform(platforms);
  const label    = resolveLabel(platform, platforms);
  const color    = COLOR[productType];
  const Icon     = ICON[productType];
  const steps    = buildSteps(productType, platform, label);

  const title = productType === 'KEY'
    ? `Ключ активации ${label}`
    : productType === 'ACCOUNT'
      ? `Аккаунт ${label} с игрой`
      : `Подарок ${label}`;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="h-px flex-1" style={{ background: `${color}22` }} />
        <p className="font-pixel" style={{ fontSize: '9px', color, letterSpacing: '0.14em' }}>
          КАК АКТИВИРОВАТЬ
        </p>
        <div className="h-px flex-1" style={{ background: `${color}22` }} />
      </div>

      <div
        className="relative rounded-2xl overflow-hidden p-6"
        style={{ background: '#0D0D16', border: `1px solid ${color}33` }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${color}14`, border: `1px solid ${color}33` }}
          >
            <Icon style={{ width: '16px', height: '16px', color }} />
          </div>
          <div>
            <p className="font-heading font-bold text-white" style={{ fontSize: '14px' }}>{title}</p>
            <p className="font-body text-[#4B5563]" style={{ fontSize: '11px' }}>
              {isManual ? 'Администратор обрабатывает заказ вручную' : 'Обычно в течение нескольких минут после оплаты'}
            </p>
          </div>
        </div>

        <div className="space-y-0">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-4 relative">
              {i < steps.length - 1 && (
                <div
                  className="absolute left-[17px] top-[34px] w-px"
                  style={{ height: 'calc(100% - 10px)', background: `${color}20` }}
                />
              )}
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-pixel z-10"
                style={{
                  background: i === 0 ? `${color}14` : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${i === 0 ? `${color}33` : 'rgba(255,255,255,0.07)'}`,
                  fontSize: '10px',
                  color: i === 0 ? color : '#4B5563',
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
