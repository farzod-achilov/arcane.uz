'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

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
  balance: 4720,
  history: [],
  addCoins: () => {},
  spendCoins: () => {},
});

const SEED: CoinTx[] = [
  { id: 'h1', type: 'earn',  amount: 3000, label: 'Продано: AAA Игра',            timestamp: Date.now() - 1   * 3_600_000 },
  { id: 'h2', type: 'earn',  amount: 500,  label: 'Продано: Инди Игра',           timestamp: Date.now() - 3   * 3_600_000 },
  { id: 'h3', type: 'spend', amount: 99000, label: 'Куплен Золотой Кейс',         timestamp: Date.now() - 5   * 3_600_000 },
  { id: 'h4', type: 'earn',  amount: 1000, label: 'Продано: 1000 Монет',          timestamp: Date.now() - 9   * 3_600_000 },
  { id: 'h5', type: 'spend', amount: 49000, label: 'Куплен Серебряный Кейс',      timestamp: Date.now() - 24  * 3_600_000 },
  { id: 'h6', type: 'earn',  amount: 10000, label: 'Продано: ARCANE Bundle',      timestamp: Date.now() - 30  * 3_600_000 },
  { id: 'h7', type: 'earn',  amount: 470,  label: 'Стартовый бонус',              timestamp: Date.now() - 48  * 3_600_000 },
];

export function CoinProvider({ children }: { children: ReactNode }) {
  const [balance, setBalance] = useState(4720);
  const [history, setHistory] = useState<CoinTx[]>(SEED);

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
