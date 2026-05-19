import Link from 'next/link';
import { Send, Clock, Shield, MessageCircle } from 'lucide-react';

const TOPICS = [
  { label: 'Проблема с ключом', q: 'Ключ не работает' },
  { label: 'Вопрос по оплате', q: 'Проблема с оплатой' },
  { label: 'Статус заказа', q: 'Где мой заказ' },
  { label: 'Arcane Coins', q: 'Вопрос про монеты' },
];

export default function SupportPage() {
  return (
    <div className="min-h-screen" style={{ background: '#05040B', paddingTop: '120px' }}>
      <div className="fixed inset-0 pointer-events-none"
           style={{
             backgroundImage: 'linear-gradient(rgba(6,182,212,1) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,1) 1px, transparent 1px)',
             backgroundSize: '52px 52px', opacity: 0.012,
           }} />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="text-center mb-12">
          <p className="font-heading font-semibold text-[#06B6D4] mb-3"
             style={{ fontSize: '11px', letterSpacing: '0.13em', textTransform: 'uppercase' }}>
            Поддержка
          </p>
          <h1 className="font-heading font-bold text-white mb-3"
              style={{ fontSize: 'clamp(24px, 4vw, 36px)' }}>
            Как мы можем помочь?
          </h1>
          <p className="font-body text-[#6B7280]" style={{ fontSize: '15px' }}>
            Наша команда отвечает в среднем за 5 минут
          </p>
        </div>

        {/* Main CTA */}
        <a
          href="https://t.me/arcaneuz_support"
          target="_blank"
          rel="noopener noreferrer"
          className="group block rounded-2xl p-8 text-center mb-8 transition-all duration-300 hover:scale-[1.01]"
          style={{
            background: 'rgba(6,182,212,0.07)',
            border: '1px solid rgba(6,182,212,0.22)',
            boxShadow: '0 0 40px rgba(6,182,212,0.06)',
          }}
        >
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
               style={{ background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.28)',
                        boxShadow: '0 0 24px rgba(6,182,212,0.15)' }}>
            <Send style={{ width: '24px', height: '24px', color: '#06B6D4' }} />
          </div>
          <h2 className="font-heading font-bold text-white mb-2" style={{ fontSize: '20px' }}>
            Telegram поддержка
          </h2>
          <p className="font-body text-[#6B7280] mb-4" style={{ fontSize: '14px' }}>
            Самый быстрый способ получить помощь
          </p>
          <div className="inline-flex items-center gap-2 rounded-xl px-6 py-3 font-heading font-semibold text-white"
               style={{
                 background: 'linear-gradient(135deg, #06B6D4, #0891B2)',
                 boxShadow: '0 0 20px rgba(6,182,212,0.35)',
                 fontSize: '14px',
               }}>
            <MessageCircle style={{ width: '16px', height: '16px' }} />
            @arcaneuz_support
          </div>
        </a>

        {/* Quick topics */}
        <h3 className="font-heading font-semibold text-[#9CA3AF] mb-4"
            style={{ fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Быстрые темы
        </h3>
        <div className="grid sm:grid-cols-2 gap-3 mb-10">
          {TOPICS.map((t) => (
            <a
              key={t.label}
              href={`https://t.me/arcaneuz_support?text=${encodeURIComponent(t.q)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl p-4 transition-all duration-200"
              style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.07)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(6,182,212,0.3)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)'; }}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                   style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.18)' }}>
                <Send style={{ width: '13px', height: '13px', color: '#06B6D4' }} />
              </div>
              <span className="font-body text-[#9CA3AF]" style={{ fontSize: '13.5px' }}>{t.label}</span>
            </a>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: Clock, label: '< 5 минут', sub: 'Среднее время ответа' },
            { icon: Shield, label: '24/7', sub: 'Без выходных' },
            { icon: MessageCircle, label: 'Русский', sub: 'Язык поддержки' },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl p-4 text-center"
                 style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.07)' }}>
              <s.icon style={{ width: '18px', height: '18px', color: '#06B6D4', margin: '0 auto 8px' }} />
              <p className="font-heading font-bold text-white mb-0.5" style={{ fontSize: '14px' }}>{s.label}</p>
              <p className="font-body text-[#4B5563]" style={{ fontSize: '11px' }}>{s.sub}</p>
            </div>
          ))}
        </div>

        <p className="font-body text-[#374151] text-center mt-8" style={{ fontSize: '12px' }}>
          Также см.{' '}
          <Link href="/faq" className="text-[#7C3AED] hover:text-[#9D60FA] transition-colors">FAQ</Link>
        </p>
      </div>
    </div>
  );
}
