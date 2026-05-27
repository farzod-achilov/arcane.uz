'use client';

import { useState, useEffect, useCallback } from 'react';

const KEY      = 'arcane_recently_viewed';
const MAX_SIZE = 8;

export function useRecentlyViewed() {
  const [ids, setIds] = useState<string[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setIds(JSON.parse(raw) as string[]);
    } catch { /* ignore */ }
  }, []);

  const addId = useCallback((id: string) => {
    setIds(prev => {
      const next = [id, ...prev.filter(x => x !== id)].slice(0, MAX_SIZE);
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  return { ids, addId };
}
