import { getActiveDeals } from '@/lib/db/deals';
import DealsContent from './DealsContent';
import { Flame } from 'lucide-react';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Скидки | Arcane',
  description: 'Горячие предложения и флэш-акции на игровые ключи.',
};

export default async function DealsPage() {
  const deals = await getActiveDeals();

  return (
    <div className="min-h-screen" style={{ background: '#0A0A0F', paddingTop: '96px' }}>
      {/* Grid background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(239,68,68,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(239,68,68,0.8) 1px, transparent 1px)',
          backgroundSize: '52px 52px',
          opacity: 0.008,
        }}
      />

      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(180deg, #1A0A0A 0%, #0A0A0F 100%)',
          borderBottom: '1px solid rgba(239,68,68,0.15)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <p
            className="font-pixel mb-2 flex items-center gap-1.5"
            style={{ fontSize: '9px', color: '#EF4444', letterSpacing: '0.15em' }}
          >
            <Flame className="w-3 h-3" />
            ГОРЯЧИЕ ПРЕДЛОЖЕНИЯ
          </p>
          <h1 className="font-heading font-bold text-3xl sm:text-4xl text-white">
            Скидки
            <span className="ml-3 font-heading text-lg font-normal" style={{ color: '#374151' }}>
              ({deals.length})
            </span>
          </h1>
          <p className="font-body text-sm mt-2" style={{ color: '#6B7280' }}>
            Флэш-акции и специальные предложения — только на Arcane
          </p>
        </div>
      </div>

      {deals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <div
            className="text-5xl mb-5 p-5 rounded-2xl"
            style={{ background: '#12121A', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            🔥
          </div>
          <h3 className="font-heading font-bold text-xl text-white mb-2">
            Акций пока нет
          </h3>
          <p className="font-body text-sm text-gray-500 mb-6 max-w-xs">
            Следите за обновлениями — горячие предложения появятся совсем скоро
          </p>
        </div>
      ) : (
        <DealsContent deals={deals} />
      )}
    </div>
  );
}
