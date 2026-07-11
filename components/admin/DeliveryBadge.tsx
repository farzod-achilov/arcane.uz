import { Clock, CheckCircle2, Loader2, XCircle, Zap, Hand, Truck } from 'lucide-react';

type OrderStatus = 'PENDING' | 'PAID' | 'WAITING_MANUAL' | 'COMPLETED' | 'CANCELLED';
type DeliveryType = 'AUTO' | 'MANUAL' | 'DROPSHIP';

const STATUS_CONFIG: Record<OrderStatus, {
  label: string;
  color: string;
  bg:    string;
  border:string;
  Icon:  React.ElementType;
}> = {
  PENDING: {
    label: 'Ожидает оплаты',
    color:  '#9CA3AF',
    bg:     'rgba(156,163,175,0.08)',
    border: 'rgba(156,163,175,0.2)',
    Icon:   Clock,
  },
  PAID: {
    label: 'Оплачен',
    color:  '#F59E0B',
    bg:     'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.25)',
    Icon:   Loader2,
  },
  WAITING_MANUAL: {
    label: 'Ждёт доставки',
    color:  '#FB923C',
    bg:     'rgba(251,146,60,0.1)',
    border: 'rgba(251,146,60,0.3)',
    Icon:   Clock,
  },
  COMPLETED: {
    label: 'Выполнен',
    color:  '#22C55E',
    bg:     'rgba(34,197,94,0.08)',
    border: 'rgba(34,197,94,0.25)',
    Icon:   CheckCircle2,
  },
  CANCELLED: {
    label: 'Отменён',
    color:  '#EF4444',
    bg:     'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.2)',
    Icon:   XCircle,
  },
};

const DELIVERY_CONFIG: Record<DeliveryType, {
  label: string;
  color: string;
  bg:    string;
  Icon:  React.ElementType;
}> = {
  AUTO:     { label: 'Авто',     color: '#06B6D4', bg: 'rgba(6,182,212,0.1)',   Icon: Zap   },
  MANUAL:   { label: 'Ручная',   color: '#A78BFA', bg: 'rgba(167,139,250,0.1)', Icon: Hand  },
  DROPSHIP: { label: 'Dropship', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',  Icon: Truck },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;
  const { Icon } = cfg;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-body"
      style={{ fontSize: '11px', fontWeight: 600, color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}
    >
      <Icon className="w-3 h-3 flex-shrink-0" />
      {cfg.label}
    </span>
  );
}

export function DeliveryTypeBadge({ type }: { type: DeliveryType }) {
  const cfg = DELIVERY_CONFIG[type] ?? DELIVERY_CONFIG.MANUAL;
  const { Icon } = cfg;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-pixel"
      style={{ fontSize: '7px', letterSpacing: '0.06em', color: cfg.color, background: cfg.bg }}
    >
      <Icon className="w-2.5 h-2.5" />
      {cfg.label}
    </span>
  );
}
