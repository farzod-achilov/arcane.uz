'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface CartLine {
  gameId:     string;
  variantId?: string;
}

interface CartContextValue {
  items:      CartLine[];
  // Derived, deduped list of gameIds — for consumers that only need "which
  // games are in the cart" and don't care about variant lines (Navbar badge
  // source data, checkout's initial game-data fetch).
  gameIds:    string[];
  addGame:    (gameId: string, variantId?: string) => boolean;
  // Omitting variantId removes every line for that game (used by the
  // catalog quick-add button, which has no variant concept).
  removeGame: (gameId: string, variantId?: string) => void;
  clear:      () => void;
  count:      number;
  has:        (gameId: string, variantId?: string) => boolean;
  isOpen:     boolean;
  openCart:   () => void;
  closeCart:  () => void;
}

const CartContext = createContext<CartContextValue>({
  items:      [],
  gameIds:    [],
  addGame:    () => false,
  removeGame: () => {},
  clear:      () => {},
  count:      0,
  has:        () => false,
  isOpen:     false,
  openCart:   () => {},
  closeCart:  () => {},
});

const STORAGE_KEY = 'arcane_cart';

function sameLine(a: CartLine, gameId: string, variantId?: string) {
  return a.gameId === gameId && (a.variantId ?? null) === (variantId ?? null);
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items,    setItems]    = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [isOpen,   setIsOpen]   = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Carts saved before purchase-variants existed stored a bare
        // string[] of gameIds — migrate that shape on read so existing
        // users' carts don't just vanish after this deploy.
        if (Array.isArray(parsed) && (parsed.length === 0 || typeof parsed[0] === 'string')) {
          setItems((parsed as string[]).map(gameId => ({ gameId })));
        } else {
          setItems(parsed as CartLine[]);
        }
      }
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const addGame = useCallback((gameId: string, variantId?: string) => {
    let added = false;
    setItems(prev => {
      if (prev.some(i => sameLine(i, gameId, variantId))) return prev;
      added = true;
      return [...prev, { gameId, variantId }];
    });
    return added;
  }, []);

  const removeGame = useCallback((gameId: string, variantId?: string) => {
    setItems(prev => variantId
      ? prev.filter(i => !sameLine(i, gameId, variantId))
      : prev.filter(i => i.gameId !== gameId));
  }, []);

  const clear = useCallback(() => setItems([]), []);
  const has   = useCallback(
    (gameId: string, variantId?: string) => variantId
      ? items.some(i => sameLine(i, gameId, variantId))
      : items.some(i => i.gameId === gameId),
    [items],
  );
  const openCart  = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const gameIds = Array.from(new Set(items.map(i => i.gameId)));

  return (
    <CartContext.Provider value={{ items, gameIds, addGame, removeGame, clear, count: items.length, has, isOpen, openCart, closeCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
