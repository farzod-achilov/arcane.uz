'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface CartContextValue {
  gameIds: string[];
  addGame:    (gameId: string) => boolean; // returns true if added, false if already in cart
  removeGame: (gameId: string) => void;
  clear:      () => void;
  count:      number;
  has:        (gameId: string) => boolean;
}

const CartContext = createContext<CartContextValue>({
  gameIds: [],
  addGame:    () => false,
  removeGame: () => {},
  clear:      () => {},
  count:      0,
  has:        () => false,
});

const STORAGE_KEY = 'arcane_cart';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [gameIds, setGameIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setGameIds(JSON.parse(raw) as string[]);
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(gameIds));
  }, [gameIds, hydrated]);

  const addGame = useCallback((gameId: string) => {
    let added = false;
    setGameIds(prev => {
      if (prev.includes(gameId)) return prev;
      added = true;
      return [...prev, gameId];
    });
    return added;
  }, []);

  const removeGame = useCallback((gameId: string) => {
    setGameIds(prev => prev.filter(id => id !== gameId));
  }, []);

  const clear = useCallback(() => setGameIds([]), []);

  const has = useCallback((gameId: string) => gameIds.includes(gameId), [gameIds]);

  return (
    <CartContext.Provider value={{ gameIds, addGame, removeGame, clear, count: gameIds.length, has }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
