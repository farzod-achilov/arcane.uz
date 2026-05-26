'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

export function useWishlist() {
  const { data: session } = useSession();
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session?.user?.id) { setIds(new Set()); return; }
    fetch('/api/wishlist/ids')
      .then(r => r.json())
      .then((data: string[]) => setIds(new Set(data)))
      .catch(() => {});
  }, [session?.user?.id]);

  const toggle = useCallback(async (gameId: string) => {
    if (!session?.user?.id) return;

    // Optimistic
    setIds(prev => {
      const next = new Set(prev);
      if (next.has(gameId)) next.delete(gameId); else next.add(gameId);
      return next;
    });

    setLoading(true);
    try {
      const res = await fetch('/api/wishlist/toggle', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ gameId }),
      });
      const { inWishlist } = await res.json() as { inWishlist: boolean };
      setIds(prev => {
        const next = new Set(prev);
        if (inWishlist) next.add(gameId); else next.delete(gameId);
        return next;
      });
    } catch {
      // Revert optimistic update on failure
      setIds(prev => {
        const next = new Set(prev);
        if (next.has(gameId)) next.delete(gameId); else next.add(gameId);
        return next;
      });
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  return { ids, toggle, isIn: (id: string) => ids.has(id), loading };
}
