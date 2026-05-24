// ── Arcane API types ──────────────────────────────────────────────────────────
// These match the arcane-api backend response shapes.

export interface ArcaneGame {
  id: string;
  externalId: string | null;
  source: string;
  title: string;
  slug: string;
  cover: string | null;
  screenshots: string[];
  description: string | null;
  genres: string[];
  platforms: string[];
  rating: number | null;
  priceUsd: number | null;
  priceUzs: number | null;
  releaseDate: string | null;
  developer: string | null;
  publisher: string | null;
  isActive: boolean;
  stockStore: number;
  stockDrop: number;
  syncedAt: string | null;
  createdAt: string;
}

export interface ArcaneGameListResponse {
  success: boolean;
  data: ArcaneGame[];
  pagination: { total: number; page: number; limit: number; pages: number };
}

export interface ArcaneGameResponse {
  success: boolean;
  data: ArcaneGame;
}

export interface CreateGamePayload {
  title: string;
  cover?: string;
  screenshots?: string[];
  trailer?: string | null;
  description?: string;
  genres?: string[];
  platforms?: string[];
  priceUsd?: number;
  priceUzs?: number;
  rating?: number;
  developer?: string;
  publisher?: string;
  source?: string;
}

// ── Client (browser → Next.js proxy routes) ───────────────────────────────────

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

export const arcaneApi = {
  games: {
    list: (params?: { search?: string; genre?: string; platform?: string; page?: number; limit?: number }) => {
      const qs = new URLSearchParams();
      if (params?.search)   qs.set('search',   params.search);
      if (params?.genre)    qs.set('genre',    params.genre);
      if (params?.platform) qs.set('platform', params.platform);
      if (params?.page)     qs.set('page',     String(params.page));
      if (params?.limit)    qs.set('limit',    String(params.limit));
      return request<ArcaneGameListResponse>(`/api/arcane/games?${qs}`);
    },

    get: (id: string) =>
      request<ArcaneGameResponse>(`/api/arcane/games/${id}`),

    create: (payload: CreateGamePayload) =>
      request<ArcaneGameResponse>('/api/arcane/games', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    update: (id: string, payload: Partial<CreateGamePayload> & { isActive?: boolean }) =>
      request<ArcaneGameResponse>(`/api/arcane/games/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
  },
};
