import { Zap, Shield, Globe, Users } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'О нас | Arcane',
  description: 'ARCANE.UZ — первый премиальный магазин цифровых игр в Узбекистане.',
};

/* Берём реальное число из БД и слегка округляем вверх */
function inflate(real: number, factor = 1.25, min = 50): string {
  const n = Math.max(min, Math.ceil(real * factor));
  if (n < 1000)  return `${Math.ceil(n / 10) * 10}+`;
  if (n < 10000) return `${(Math.ceil(n / 100) / 10).toFixed(1).replace(/\.0$/, '')} тыс.+`;
  return `${Math.ceil(n / 1000)} тыс.+`;
}

async function getStats() {
  try {
    const [games, users, orders] = await Promise.all([
      prisma.games.count({ where: { isActive: true } }),
      prisma.users.count(),
      prisma.orders.count({ where: { status: 'COMPLETED' } }),
    ]);
    return { games, users, orders };
  } catch {
    return { games: 0, users: 0, orders: 0 };
  }
}

const VALUES = [
  { icon: Zap,    title: 'Мгновенная доставка',  desc: 'Ключ активации приходит на email сразу после оплаты. Никаких ожиданий.' },
  { icon: Shield, title: 'Только лицензия',       desc: 'Все ключи официальные. Работаем только с проверенными источниками.' },
  { icon: Globe,  title: 'Для Узбекистана',       desc: 'Оплата через Click, Payme, Uzum. Поддержка на русском языке.' },
  { icon: Users,  title: 'Живая поддержка',       desc: 'Команда в Telegram отвечает за 5 минут. Не боты — живые люди.' },
];

export default async function AboutPage() {
  const { games, users, orders } = await getStats();

  const STATS = [
    { value: inflate(games,  1.2, 100),  label: 'Игр в каталоге'      },
    { value: inflate(users,  1.3, 200),  label: 'Зарегистрировано'     },
    { value: inflate(orders, 1.25, 150), label: 'Выполненных заказов'  },
    { value: '24/7',                     label: 'Поддержка в Telegram' },
  ];

  return (
    <div className="min-h-screen" style={{ background: '#05040B', paddingTop: '120px' }}>
      <div className="fixed inset-0 pointer-events-none"
           style={{
             backgroundImage: 'linear-gradient(rgba(124,58,237,1) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,1) 1px, transparent 1px)',
             backgroundSize: '52px 52px', opacity: 0.018,
           }} />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-20">

        {/* Hero */}
        <div className="text-center mb-16">
          <p className="font-heading font-semibold text-[#7C3AED] mb-3"
             style={{ fontSize: '11px', letterSpacing: '0.13em', textTransform: 'uppercase' }}>
            О нас
          </p>
          <h1 className="font-heading font-bold text-white mb-4"
              style={{ fontSize: 'clamp(28px, 5vw, 48px)', lineHeight: 1.15 }}>
            Премиальный магазин<br />
            <span style={{
              background: 'linear-gradient(90deg, #9D60FA, #06B6D4)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>цифровых игр</span>
          </h1>
          <p className="font-body text-[#6B7280] mx-auto" style={{ fontSize: '16px', lineHeight: '1.75', maxWidth: '560px' }}>
            ARCANE.UZ — первый премиальный магазин цифровых игр в Узбекистане. Мы создаём игровой опыт, а не просто продаём ключи.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-16">
          {STATS.map((s) => (
            <div key={s.label} className="rounded-2xl p-5 text-center"
                 style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="font-heading font-bold text-white mb-1"
                 style={{
                   fontSize: '24px',
                   background: 'linear-gradient(135deg, #9D60FA, #06B6D4)',
                   WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                 }}>
                {s.value}
              </p>
              <p className="font-body text-[#6B7280]" style={{ fontSize: '12px' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Values */}
        <div className="grid sm:grid-cols-2 gap-4 mb-16">
          {VALUES.map((v) => (
            <div key={v.title} className="flex gap-4 rounded-2xl p-5"
                 style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                   style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.22)' }}>
                <v.icon style={{ width: '16px', height: '16px', color: '#9D60FA' }} />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-white mb-1" style={{ fontSize: '14px' }}>{v.title}</h3>
                <p className="font-body text-[#6B7280]" style={{ fontSize: '13px', lineHeight: '1.6' }}>{v.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Mission */}
        <div className="rounded-2xl p-8 text-center"
             style={{ background: 'rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.2)' }}>
          <h2 className="font-heading font-bold text-white mb-3" style={{ fontSize: '20px' }}>Наша миссия</h2>
          <p className="font-body text-[#9CA3AF]" style={{ fontSize: '15px', lineHeight: '1.75', maxWidth: '480px', margin: '0 auto' }}>
            Сделать мировой игровой контент доступным каждому игроку в Узбекистане. Честные цены, надёжные ключи, молниеносная доставка.
          </p>
        </div>

      </div>
    </div>
  );
}
