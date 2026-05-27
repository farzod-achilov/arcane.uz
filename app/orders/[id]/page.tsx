import { redirect, notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Package, Clock, CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { authOptions } from '@/lib/auth';
import { getOrder } from '@/lib/orders/service';
import { prisma } from '@/lib/prisma';
import { formatPrice } from '@/lib/utils';
import KeyReveal from './KeyReveal';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  return { title: `Заказ #${params.id.slice(-8).toUpperCase()} | Arcane` };
}

/* ── Status config ── */
const STATUS_CFG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  PENDING:        { label: 'Ожидает оплаты', color: '#6B7280', icon: Clock         },
  PAID:           { label: 'Оплачен',        color: '#06B6D4', icon: CheckCircle2  },
  WAITING_MANUAL: { label: 'У оператора',    color: '#FB923C', icon: Loader2       },
  COMPLETED:      { label: 'Доставлен',      color: '#22C55E', icon: CheckCircle2  },
  CANCELLED:      { label: 'Отменён',        color: '#EF4444', icon: XCircle       },
};

/* ── Timeline action labels ── */
const ACTION_LABEL: Record<string, string> = {
  AUTO_DELIVERY_START:      'Начата автодоставка',
  AUTO_KEY_ISSUED:          'Ключ выдан автоматически',
  AUTO_KEY_WAITING_STOCK:   'Нет в наличии — передан оператору',
  AUTO_DELIVERY_COMPLETE:   'Автодоставка завершена',
  MANUAL_QUEUED:            'Передан оператору',
  MANUAL_ADMIN_NOTIFIED:    'Оператор уведомлён',
  MANUAL_COMPLETE:          'Ключ выдан вручную',
};

export default async function OrderPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');

  let order;
  try {
    order = await getOrder(params.id);
  } catch {
    notFound();
  }

  /* Only owner or admin can view */
  if (order.userId !== session.user.id && !(session.user as { isAdmin?: boolean }).isAdmin) {
    notFound();
  }

  const logs = await prisma.delivery_logs.findMany({
    where:   { orderId: order.id },
    orderBy: { createdAt: 'asc' },
  });

  const cfg = STATUS_CFG[order.status] ?? { label: order.status, color: '#6B7280', icon: AlertCircle };
  const StatusIcon = cfg.icon;

  const shortId = order.id.slice(-8).toUpperCase();
  const createdAt = new Date(order.createdAt);

  return (
    <div className="min-h-screen" style={{ background: '#0A0A0F', paddingTop: '96px' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* Back link */}
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 font-body text-sm mb-6 transition-colors"
          style={{ color: '#6B7280' }}
          onMouseEnter={undefined}
        >
          <ArrowLeft className="w-4 h-4" />
          Назад в профиль
        </Link>

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Package className="w-5 h-5" style={{ color: '#7C3AED' }} />
              <h1 className="font-heading font-bold text-2xl text-white">
                Заказ #{shortId}
              </h1>
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-body text-xs font-medium"
                style={{ background: `${cfg.color}18`, border: `1px solid ${cfg.color}40`, color: cfg.color }}
              >
                <StatusIcon className="w-3 h-3" />
                {cfg.label}
              </span>
            </div>
            <p className="font-body text-sm" style={{ color: '#4B5563' }}>
              {createdAt.toLocaleString('ru-RU', {
                day: '2-digit', month: 'long', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Items ── */}
          <div className="lg:col-span-2 space-y-3">
            <p
              className="font-pixel mb-4"
              style={{ fontSize: '8px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.14em' }}
            >
              ◆ ТОВАРЫ
            </p>
            {order.items?.map(item => (
              <div
                key={item.id}
                className="rounded-2xl p-4"
                style={{ background: '#0D0D1A', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="flex items-start gap-4">
                  {/* Cover */}
                  <Link href={`/product/${item.game?.id ?? item.gameId}`} className="flex-shrink-0">
                    <div
                      className="w-12 h-16 rounded-xl overflow-hidden"
                      style={{ background: 'rgba(124,58,237,0.1)' }}
                    >
                      {item.game?.cover && (
                        <Image
                          src={item.game.cover}
                          alt={item.game.title ?? ''}
                          width={48}
                          height={64}
                          unoptimized
                          className="object-cover w-full h-full"
                        />
                      )}
                    </div>
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/product/${item.game?.id ?? item.gameId}`}
                      className="font-heading font-semibold text-white hover:text-[#C4B5FD] transition-colors line-clamp-1"
                      style={{ fontSize: '15px' }}
                    >
                      {item.game?.title ?? item.gameId}
                    </Link>
                    <p className="font-heading font-bold mt-0.5" style={{ color: '#7C3AED', fontSize: '14px' }}>
                      {formatPrice(item.price)}
                    </p>

                    {/* Key */}
                    {item.keyValue ? (
                      <KeyReveal value={item.keyValue} />
                    ) : (
                      <p className="font-body text-xs mt-2" style={{ color: '#374151' }}>
                        {order.status === 'COMPLETED' ? 'Ключ не назначен' : 'Ключ будет выдан после оплаты'}
                      </p>
                    )}
                  </div>

                  {/* Delivered badge */}
                  {item.deliveredAt && (
                    <span
                      className="flex-shrink-0 font-body text-xs rounded-full px-2 py-0.5"
                      style={{ background: 'rgba(34,197,94,0.1)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.2)' }}
                    >
                      Выдан
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* ── Right column ── */}
          <div className="space-y-4">

            {/* Summary */}
            <div
              className="rounded-2xl p-5"
              style={{ background: '#0D0D1A', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <p
                className="font-pixel mb-4"
                style={{ fontSize: '8px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.14em' }}
              >
                ◆ СУММА
              </p>
              <div className="flex items-center justify-between mb-3">
                <span className="font-body text-sm" style={{ color: '#6B7280' }}>Итого</span>
                <span className="font-heading font-bold text-white text-lg">
                  {formatPrice(order.totalPrice)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-body text-sm" style={{ color: '#6B7280' }}>Товаров</span>
                <span className="font-body text-sm text-white">{order.items?.length ?? 0}</span>
              </div>
              {order.deliveredBy && (
                <div
                  className="flex items-center justify-between mt-3 pt-3"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <span className="font-body text-sm" style={{ color: '#6B7280' }}>Доставил</span>
                  <span className="font-body text-sm text-white">{order.deliveredBy}</span>
                </div>
              )}
              {order.deliveryNote && (
                <div
                  className="mt-3 pt-3 rounded-xl p-3"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(124,58,237,0.06)' }}
                >
                  <p className="font-body text-xs" style={{ color: '#9CA3AF', lineHeight: '1.5' }}>
                    {order.deliveryNote}
                  </p>
                </div>
              )}
            </div>

            {/* Timeline */}
            {(logs.length > 0) && (
              <div
                className="rounded-2xl p-5"
                style={{ background: '#0D0D1A', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <p
                  className="font-pixel mb-4"
                  style={{ fontSize: '8px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.14em' }}
                >
                  ◆ ИСТОРИЯ
                </p>
                <div className="relative">
                  {/* Vertical line */}
                  <div
                    className="absolute left-[7px] top-2 bottom-2 w-px"
                    style={{ background: 'rgba(124,58,237,0.2)' }}
                  />
                  <div className="space-y-4">
                    {/* Synthetic: order created */}
                    <TimelineRow
                      label="Заказ создан"
                      date={createdAt}
                      active
                    />
                    {logs.map(log => (
                      <TimelineRow
                        key={log.id}
                        label={ACTION_LABEL[log.action] ?? log.action}
                        date={new Date(log.createdAt)}
                        active={log.action.includes('COMPLETE') || log.action.includes('ISSUED')}
                        note={log.note ?? undefined}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TimelineRow({
  label, date, active, note,
}: {
  label: string;
  date:  Date;
  active?: boolean;
  note?: string;
}) {
  return (
    <div className="flex gap-3 pl-1">
      <div
        className="w-3.5 h-3.5 rounded-full flex-shrink-0 mt-0.5 relative z-10"
        style={{
          background: active ? '#7C3AED' : '#1E1E2E',
          border:     `2px solid ${active ? '#9D60FA' : 'rgba(255,255,255,0.1)'}`,
        }}
      />
      <div className="min-w-0 -mt-0.5">
        <p className="font-body text-sm text-white">{label}</p>
        {note && (
          <p className="font-body text-xs mt-0.5" style={{ color: '#6B7280' }}>{note}</p>
        )}
        <p className="font-body" style={{ fontSize: '11px', color: '#374151', marginTop: '2px' }}>
          {date.toLocaleString('ru-RU', {
            day: '2-digit', month: 'short',
            hour: '2-digit', minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  );
}
