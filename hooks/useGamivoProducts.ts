'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Product } from '@/lib/types';

/* useGamivoProducts — ⚠ UNVERIFIED integration, see lib/gamivo/config.ts */

export interface UseProductsOptions {
  search?: string;
  category?: string;
  platform?: string;
  sort?: 'default' | 'price_asc' | 'price_desc' | 'rating';
  skip?: boolean;
}

export interface UseProductsResult {
  products: Product[];
  isLoading: boolean;
  isError: boolean;
  errorMsg: string;
  source: 'gamivo' | 'mock' | 'mock_fallback' | null;
  total: number;
  refetch: () => void;
}

export function useGamivoProducts(options: UseProductsOptions = {}): UseProductsResult {
  const { search = '', category = '', platform = '', sort = 'default', skip = false } = options;

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setLoading] = useState(!skip);
  const [isError, setError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [source, setSource] = useState<UseProductsResult['source']>(null);
  const [total, setTotal] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const fetch_ = useCallback(async () => {
    if (skip) return;

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    setError(false);
    setErrorMsg('');

    try {
      const params = new URLSearchParams();
      if (search) params.set('q', search);
      if (category) params.set('category', category);
      if (platform) params.set('platform', platform);
      if (sort !== 'default') params.set('sort', sort);

      const res = await globalThis.fetch(`/api/gamivo/products?${params}`, { signal: ctrl.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      setProducts(data.products ?? []);
      setTotal(data.total ?? 0);
      setSource(data.source ?? null);
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setError(true);
      setErrorMsg(err instanceof Error ? err.message : 'Failed to load products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [search, category, platform, sort, skip]);

  useEffect(() => {
    fetch_();
    return () => abortRef.current?.abort();
  }, [fetch_]);

  return { products, isLoading, isError, errorMsg, source, total, refetch: fetch_ };
}
