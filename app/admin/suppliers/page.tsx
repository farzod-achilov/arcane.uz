'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import SupplierSyncPanel from '@/components/admin/SupplierSyncPanel';

/* ─────────────────────────────────────────────────────────
   Single "supplier health" dashboard — one status card per
   external catalog source, including Digiseller (also embedded
   on /admin/products for historical reasons). Kinguin/Eneba have
   a real (if credential-less today) integration; G2A/Gamivo are
   unverified stubs — see lib/g2a/config.ts and lib/gamivo/config.ts.
───────────────────────────────────────────────────────── */

const SUPPLIERS = [
  {
    key: 'digiseller',
    name: 'Digiseller',
    statusEndpoint: '/api/digiseller/sync',
    syncEndpoint: '/api/digiseller/sync',
    disabledHint: 'добавьте DIGISELLER_SELLER_ID и DIGISELLER_API_KEY',
    color: '#7C3AED',
  },
  {
    key: 'kinguin',
    name: 'Kinguin',
    statusEndpoint: '/api/kinguin/sync',
    syncEndpoint: '/api/kinguin/sync',
    disabledHint: 'добавьте KINGUIN_MERCHANT_API_KEY',
    color: '#06B6D4',
    balanceEndpoint: '/api/kinguin/balance',
  },
  {
    key: 'eneba',
    name: 'Eneba',
    statusEndpoint: '/api/eneba/sync',
    syncEndpoint: '/api/eneba/sync',
    disabledHint: 'добавьте ENEBA_AUTH_ID и ENEBA_AUTH_SECRET',
    color: '#22C55E',
  },
  {
    key: 'g2a',
    name: 'G2A',
    statusEndpoint: '/api/g2a/sync',
    syncEndpoint: '/api/g2a/sync',
    disabledHint: 'схема авторизации не подтверждена — см. lib/g2a/config.ts',
    color: '#F59E0B',
  },
  {
    key: 'gamivo',
    name: 'Gamivo',
    statusEndpoint: '/api/gamivo/sync',
    syncEndpoint: '/api/gamivo/sync',
    disabledHint: 'API поставщика "в разработке" — см. lib/gamivo/config.ts',
    color: '#EF4444',
  },
] as const;

export default function AdminSuppliersPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-pixel text-[#7C3AED] mb-1" style={{ fontSize: '9px', letterSpacing: '0.12em' }}>
            ВНЕШНИЕ КАТАЛОГИ
          </p>
          <h1 className="font-heading font-bold text-white" style={{ fontSize: '20px' }}>
            Поставщики
          </h1>
          <p className="font-body text-[#6B7280] mt-1" style={{ fontSize: '13px' }}>
            Статус подключения каждого внешнего источника товаров/ключей и ручной запуск синхронизации каталога.
          </p>
        </div>
        <Link href="/admin/dropship/add"
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 font-heading font-semibold text-sm text-white flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', boxShadow: '0 0 20px rgba(124,58,237,0.25)' }}>
          <Plus style={{ width: '15px', height: '15px' }} /> Добавить игру
        </Link>
      </div>

      <div>
        {SUPPLIERS.map(s => (
          <SupplierSyncPanel
            key={s.key}
            name={s.name}
            statusEndpoint={s.statusEndpoint}
            syncEndpoint={s.syncEndpoint}
            disabledHint={s.disabledHint}
            color={s.color}
            balanceEndpoint={'balanceEndpoint' in s ? s.balanceEndpoint : undefined}
          />
        ))}
      </div>
    </div>
  );
}
