'use client';

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { useSession } from 'next-auth/react';

export type TxType = 'earn' | 'spend';

export interface CoinTx {
  id: string;
  type: TxType;
  amount: number;
  label: string;
  timestamp: number;
}

interface CoinCtx {
  balance: number;
  history: CoinTx[];
  addCoins: (amount: number, label: string) => void;
  spendCoins: (amount: number, label: string) => void;
}

const CoinContext = createContext<CoinCtx>({
  balance: 0,
  history: [],
  addCoins: () => {},
  spendCoins: () => {},
});

export function CoinProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState<CoinTx[]>([]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    fetch('/api/user/balance')
      .then(r => r.ok ? r.json() : null)
      .then((data: { arcCoins?: number } | null) => {
        if (data?.arcCoins !== undefined) setBalance(data.arcCoins);
      })
      .catch(() => {
        const coins = (session?.user as { arcCoins?: number })?.arcCoins;
        if (coins !== undefined) setBalance(coins);
      });
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  const addCoins = useCallback((amount: number, label: string) => {
    setBalance(prev => prev + amount);
    setHistory(prev => [
      { id: Date.now().toString(), type: 'earn', amount, label, timestamp: Date.now() },
      ...prev,
    ]);
  }, []);

  const spendCoins = useCallback((amount: number, label: string) => {
    setBalance(prev => Math.max(0, prev - amount));
    setHistory(prev => [
      { id: Date.now().toString(), type: 'spend', amount, label, timestamp: Date.now() },
      ...prev,
    ]);
  }, []);

  return (
    <CoinContext.Provider value={{ balance, history, addCoins, spendCoins }}>
      {children}
    </CoinContext.Provider>
  );
}

export function useCoin() {
  return useContext(CoinContext);
}

export function coinTimeAgo(ts: number): string {
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 60) return `${s}с назад`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}м назад`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}ч назад`;
  return `${Math.round(h / 24)}д назад`;
}
