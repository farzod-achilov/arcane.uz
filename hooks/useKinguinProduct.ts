'use client';

import { useState, useEffect } from 'react';
import type { Product } from '@/lib/types';

/* ─────────────────────────────────────────────────────────
   useKinguinProduct
   Fetches a single product from /api/kinguin/product/[id].
───────────────────────────────────────────────────────── */

export interface UseProductResult {
  product: Product | null;
  isLoading: boolean;
  isError: boolean;
  errorMsg: string;
  source: 'kinguin' | 'mock' | null;
  purchaseUrl: string | null;
}

export function useKinguinProduct(id: string): UseProductResult {
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [isError, setError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [source, setSource] = useState<'kinguin' | 'mock' | null>(null);
  const [purchaseUrl, setPurchase] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(false);
      setErrorMsg('');

      try {
        const res = await fetch(`/api/kinguin/product/${id}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (!cancelled) {
          setProduct(data.product ?? null);
          setSource(data.source ?? null);
          const p = data.product as (Product & { kinguinPurchaseUrl?: string }) | null;
          if (p?.kinguinPurchaseUrl) setPurchase(p.kinguinPurchaseUrl);
        }
      } catch (err) {
        if (!cancelled) {
          setError(true);
          setErrorMsg(err instanceof Error ? err.message : 'Failed to load product');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [id]);

  return { product, isLoading, isError, errorMsg, source, purchaseUrl };
}
