import type { DeliveryType } from './types';

export interface DeliveryConfig {
  id: DeliveryType;
  label: string;
  badge: string;
  defaultTime: string;
  defaultDescription: string;
  color: string;
  bg: string;
  border: string;
  glow: string;
  iconName: 'zap' | 'gift' | 'send' | 'monitor' | 'package';
}

export const DELIVERY_CONFIG: Record<DeliveryType, DeliveryConfig> = {
  instant: {
    id: 'instant',
    label: 'Мгновенная доставка',
    badge: 'INSTANT',
    defaultTime: '1–5 минут',
    defaultDescription:
      'Ключ активации отправляется на ваш email автоматически сразу после подтверждения оплаты.',
    color: '#22C55E',
    bg: 'rgba(34,197,94,0.07)',
    border: 'rgba(34,197,94,0.22)',
    glow: 'rgba(34,197,94,0.18)',
    iconName: 'zap',
  },

  steam_gift: {
    id: 'steam_gift',
    label: 'Steam Подарок',
    badge: 'STEAM GIFT',
    defaultTime: '1–3 часа',
    defaultDescription:
      'Игра будет отправлена как подарок на ваш аккаунт Steam. Необходимо добавить менеджера в друзья в Steam.',
    color: '#66C0F4',
    bg: 'rgba(102,192,244,0.07)',
    border: 'rgba(102,192,244,0.22)',
    glow: 'rgba(102,192,244,0.18)',
    iconName: 'gift',
  },

  telegram_activation: {
    id: 'telegram_activation',
    label: 'Активация через Telegram',
    badge: 'TELEGRAM',
    defaultTime: '~30 минут',
    defaultDescription:
      'Менеджер свяжется с вами в Telegram и проведёт активацию игры шаг за шагом.',
    color: '#06B6D4',
    bg: 'rgba(6,182,212,0.07)',
    border: 'rgba(6,182,212,0.22)',
    glow: 'rgba(6,182,212,0.18)',
    iconName: 'send',
  },

  offline_activation: {
    id: 'offline_activation',
    label: 'Офлайн-активация',
    badge: 'OFFLINE',
    defaultTime: '1–24 часа',
    defaultDescription:
      'Активация выполняется в офисе или удалённо по согласованию. Подходит для корпоративных заказов.',
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.07)',
    border: 'rgba(245,158,11,0.22)',
    glow: 'rgba(245,158,11,0.18)',
    iconName: 'monitor',
  },

  manual_delivery: {
    id: 'manual_delivery',
    label: 'Ручная обработка',
    badge: 'MANUAL',
    defaultTime: 'До 24 часов',
    defaultDescription:
      'Заказ обрабатывается вручную менеджером. Вы получите ключ или инструкции на email после проверки.',
    color: '#9D60FA',
    bg: 'rgba(157,96,250,0.07)',
    border: 'rgba(157,96,250,0.22)',
    glow: 'rgba(157,96,250,0.18)',
    iconName: 'package',
  },
};

export function getDelivery(
  type: DeliveryType,
  overrides?: { time?: string; description?: string },
): DeliveryConfig & { resolvedTime: string; resolvedDescription: string } {
  const cfg = DELIVERY_CONFIG[type];
  return {
    ...cfg,
    resolvedTime: overrides?.time ?? cfg.defaultTime,
    resolvedDescription: overrides?.description ?? cfg.defaultDescription,
  };
}
