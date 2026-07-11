'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Wifi, WifiOff, CheckCircle2, AlertCircle, Wallet, ExternalLink } from 'lucide-react';

/* ─────────────────────────────────────────────────────────
   Generic supplier connection/sync status card. Extracted from
   the Digiseller-only DigisellerSyncPanel that used to live inline
   in app/admin/products/page.tsx, parameterized so every supplier
   (Digiseller, Kinguin, Eneba, G2A, Gamivo) reuses the exact same
   status/sync logic instead of 5 copy-pasted components.
───────────────────────────────────────────────────────── */

type SyncStatus = 'idle' | 'syncing' | 'success' | 'error' | 'disabled';
interface SyncState { status: SyncStatus; synced?: number; durationMs?: number; timestamp?: string; error?: string; enabled?: boolean }

interface BalanceState { loading: boolean; balanceUsd?: number; topUpUrl?: string; error?: string }

export interface SupplierSyncPanelProps {
  name: string;
  statusEndpoint: string;
  syncEndpoint: string;
  /** Shown when the supplier is disabled — usually "add env var X" */
  disabledHint: string;
  color: string;
  /** Optional — when set, fetches and shows a wallet balance + top-up button */
  balanceEndpoint?: string;
}

export default function SupplierSyncPanel({ name, statusEndpoint, syncEndpoint, disabledHint, color, balanceEndpoint }: SupplierSyncPanelProps) {
  const [sync, setSync] = useState<SyncState>({ status: 'idle' });
  const [balance, setBalance] = useState<BalanceState>({ loading: Boolean(balanceEndpoint) });

  const checkStatus = useCallback(async () => {
    try {
      const data = await fetch(statusEndpoint).then(r => r.json());
      if (!data.enabled) { setSync({ status: 'disabled', enabled: false }); return; }
      if (data.lastSync) setSync({ status: 'success', enabled: true, ...data.lastSync });
      else setSync({ status: 'idle', enabled: true });
    } catch { setSync({ status: 'idle', enabled: false }); }
  }, [statusEndpoint]);

  const checkBalance = useCallback(async () => {
    if (!balanceEndpoint) return;
    try {
      const data = await fetch(balanceEndpoint).then(r => r.json());
      if (!data.ok) { setBalance({ loading: false, error: data.error ?? 'Ошибка' }); return; }
      setBalance({ loading: false, balanceUsd: data.balanceUsd, topUpUrl: data.topUpUrl });
    } catch { setBalance({ loading: false, error: 'Network error' }); }
  }, [balanceEndpoint]);

  useEffect(() => { checkStatus(); }, [checkStatus]);
  useEffect(() => { checkBalance(); }, [checkBalance]);

  async function triggerSync() {
    setSync(s => ({ ...s, status: 'syncing' }));
    try {
      const data = await fetch(syncEndpoint, { method: 'POST' }).then(r => r.json());
      if (data.ok) setSync({ status: 'success', enabled: true, ...data.result });
      else setSync(s => ({ ...s, status: 'error', error: data.error ?? 'Ошибка' }));
    } catch { setSync(s => ({ ...s, status: 'error', error: 'Network error' })); }
  }

  const statusColor = { idle: '#6B7280', syncing: '#7C3AED', success: '#22C55E', error: '#EF4444', disabled: '#1F2937' }[sync.status];
  const Icon = { idle: Wifi, syncing: RefreshCw, success: CheckCircle2, error: AlertCircle, disabled: WifiOff }[sync.status];
  const isDisabled = sync.status === 'disabled' || sync.enabled === false;
  const isSyncing = sync.status === 'syncing';

  return (
    <div className="rounded-2xl p-4 mb-5 flex items-center justify-between gap-4 flex-wrap"
         style={{ background: '#0D0D1A', border: `1px solid ${statusColor}20` }}>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
             style={{ background: `${color}12`, border: `1px solid ${color}22` }}>
          <Icon style={{ width: '15px', height: '15px', color: statusColor, animation: isSyncing ? 'spin 1s linear infinite' : undefined }} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-heading font-semibold text-white" style={{ fontSize: '13px' }}>{name} Sync</p>
            {!isDisabled && balanceEndpoint && !balance.loading && balance.balanceUsd != null && (
              <span className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5"
                    style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)' }}>
                <Wallet style={{ width: '10px', height: '10px', color: '#22C55E' }} />
                <span className="font-body" style={{ fontSize: '11px', color: '#22C55E' }}>
                  ${balance.balanceUsd.toFixed(2)}
                </span>
              </span>
            )}
          </div>
          <p className="font-body text-[#4B5563]" style={{ fontSize: '11px' }}>
            {isDisabled && `Не настроен — ${disabledHint}`}
            {sync.status === 'idle' && sync.enabled && 'Готов к синхронизации'}
            {sync.status === 'syncing' && 'Синхронизация…'}
            {sync.status === 'success' && `Синхронизировано ${sync.synced} продуктов за ${sync.durationMs}ms`}
            {sync.status === 'error' && `Ошибка: ${sync.error}`}
            {!isDisabled && balanceEndpoint && balance.error && ` · Баланс: ${balance.error}`}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {!isDisabled && balanceEndpoint && balance.topUpUrl && (
          <a
            href={balance.topUpUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 font-heading font-semibold text-sm transition-all"
            style={{ background: 'rgba(34,197,94,0.08)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.25)' }}
          >
            <Wallet style={{ width: '13px', height: '13px' }} />
            Пополнить
            <ExternalLink style={{ width: '11px', height: '11px' }} />
          </a>
        )}
        <button
          onClick={triggerSync}
          disabled={isSyncing || isDisabled}
          className="flex items-center gap-2 rounded-xl px-4 py-2 font-heading font-semibold text-white text-sm transition-all disabled:opacity-40"
          style={{ background: isDisabled ? 'rgba(255,255,255,0.04)' : 'linear-gradient(135deg,#7C3AED,#5B21B6)', border: isDisabled ? '1px solid rgba(255,255,255,0.07)' : undefined }}
        >
          <RefreshCw style={{ width: '13px', height: '13px', animation: isSyncing ? 'spin 1s linear infinite' : undefined }} />
          {isSyncing ? 'Синхронизация…' : 'Синхронизировать'}
        </button>
      </div>
    </div>
  );
}
