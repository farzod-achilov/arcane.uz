'use client';

import {
  createContext, useContext, useState, useEffect, useCallback,
  type ReactNode,
} from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import {
  getLevelFromXp,
  type Notification,
} from './mockUserData';

/* ── User type ────────────────────────────────────────── */
export interface User {
  id: string;
  name: string;
  email: string;
  telegram: string | null;
  steamId: string | null;
  steamUsername: string | null;
  steamAvatar: string | null;
  xp: number;
  coins: number;
  avatar: string;
  joinDate: string;
}

/* ── Context type ─────────────────────────────────────── */
interface UserContextType {
  user: User | null;
  isLoggedIn: boolean;
  /** true, пока next-auth ещё определяет сессию — не редиректить на /login в этот момент */
  isAuthLoading: boolean;
  notifications: Notification[];
  wishlist: string[];
  unreadCount: number;
  login: (email: string, password: string, turnstileToken?: string) => Promise<boolean>;
  logout: () => void;
  register: (name: string, email: string, password: string, referralCode?: string, turnstileToken?: string) => Promise<{ ok: boolean; error?: string }>;
  addToWishlist: (id: string) => void;
  removeFromWishlist: (id: string) => void;
  isInWishlist: (id: string) => boolean;
  markNotificationRead: (id: string) => void;
  markAllRead: () => void;
  connectTelegram: (username: string) => void;
  connectSteam: () => void;
  updateProfile: (data: Partial<User>) => void;
  addCoins: (amount: number) => void;
}

const UserContext = createContext<UserContextType | null>(null);

const LS_LIST = 'arcane_wishlist';

function sessionToUser(session: { user: { id: string; name?: string | null; email?: string | null; image?: string | null; arcCoins?: number; xp?: number } }): User {
  const s = session.user;
  return {
    id:            s.id,
    name:          s.name   ?? 'Игрок',
    email:         s.email  ?? '',
    telegram:      null,
    steamId:       null,
    steamUsername: null,
    steamAvatar:   null,
    xp:            s.xp       ?? 0,
    coins:         s.arcCoins ?? 0,
    avatar:        s.image    ?? `https://picsum.photos/seed/${s.id}/200/200`,
    joinDate:      new Date().toISOString().split('T')[0],
  };
}

export function UserProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();

  const [user,          setUser]  = useState<User | null>(null);
  const [wishlist,      setWList] = useState<string[]>([]);
  const [notifications, setNotifs] = useState<Notification[]>([]);

  /* Real-time notifications via SSE (Server-Sent Events) */
  useEffect(() => {
    if (status !== 'authenticated') return;
    let es: EventSource | null = null;
    let fallbackId: ReturnType<typeof setInterval> | null = null;

    function connectSSE() {
      es = new EventSource('/api/notifications/stream');

      es.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as {
            type: 'init' | 'new';
            notifications: Notification[];
          };
          if (payload.type === 'init') {
            setNotifs(payload.notifications);
          } else if (payload.type === 'new' && payload.notifications.length > 0) {
            setNotifs(prev => {
              const ids = new Set(prev.map(n => n.id));
              const fresh = payload.notifications.filter(n => !ids.has(n.id));
              return fresh.length ? [...fresh, ...prev] : prev;
            });
          }
        } catch {}
      };

      es.onerror = () => {
        // SSE failed — fall back to 15s polling
        es?.close();
        es = null;
        if (!fallbackId) {
          const poll = () =>
            fetch('/api/notifications')
              .then(r => r.json())
              .then((d: { notifications?: Notification[] }) => {
                if (Array.isArray(d.notifications)) setNotifs(d.notifications);
              })
              .catch(() => {});
          poll();
          fallbackId = setInterval(poll, 15_000);
        }
      };
    }

    connectSSE();
    return () => {
      es?.close();
      if (fallbackId) clearInterval(fallbackId);
    };
  }, [status]);

  /* Sync NextAuth session → user state + load wishlist from DB */
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      setUser(sessionToUser(session as Parameters<typeof sessionToUser>[0]));
      // Load wishlist from DB, overwrite localStorage copy
      fetch('/api/wishlist/ids')
        .then((r) => r.json())
        .then((ids: string[]) => { if (Array.isArray(ids)) setWList(ids); })
        .catch(() => {});
    } else if (status === 'unauthenticated') {
      setUser(null);
      setWList([]);
    }
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps


  const unreadCount = notifications.filter((n) => !n.read).length;

  /* ── Auth ── */
  const login = useCallback(async (email: string, password: string, turnstileToken?: string): Promise<boolean> => {
    const result = await signIn('credentials', { redirect: false, email, password, turnstileToken });
    return result?.ok ?? false;
  }, []);

  const register = useCallback(async (name: string, email: string, password: string, referralCode?: string, turnstileToken?: string): Promise<{ ok: boolean; error?: string }> => {
    const res = await fetch('/api/auth/register', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name, email, password, referralCode, turnstileToken }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { ok: false, error: (data as { error?: string }).error ?? 'Ошибка регистрации' };
    }

    const data = await res.json() as { postRegisterBypassToken?: string };
    // Reuses the bypass token /api/auth/register just issued instead of a
    // fresh Turnstile token — see lib/turnstile/postRegisterBypass.ts.
    const ok = await signIn('credentials', {
      redirect: false, email, password,
      postRegisterBypassToken: data.postRegisterBypassToken,
    });
    if (!ok?.ok) return { ok: false, error: 'Не удалось войти после регистрации' };

    return { ok: true };
  }, []);

  const logout = useCallback(() => {
    setWList([]);
    signOut({ redirect: false });
  }, []);

  /* ── Wishlist (synced to DB for logged-in users) ── */
  const addToWishlist = useCallback((id: string) => {
    setWList((p) => p.includes(id) ? p : [...p, id]);
    fetch('/api/wishlist/toggle', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ gameId: id }),
    }).catch(() => {});
  }, []);

  const removeFromWishlist = useCallback((id: string) => {
    setWList((p) => p.filter((x) => x !== id));
    fetch('/api/wishlist/toggle', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ gameId: id }),
    }).catch(() => {});
  }, []);

  const isInWishlist = useCallback((id: string) => wishlist.includes(id), [wishlist]);

  /* ── Notifications ── */
  const markNotificationRead = useCallback((id: string) => {
    setNotifs((p) => p.map((n) => n.id === id ? { ...n, read: true } : n));
    fetch('/api/notifications', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id }),
    }).catch(() => {});
  }, []);

  const markAllRead = useCallback(() => {
    setNotifs((p) => p.map((n) => ({ ...n, read: true })));
    fetch('/api/notifications', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({}),
    }).catch(() => {});
  }, []);

  /* ── Connected accounts ── */
  const connectTelegram = useCallback((username: string) => {
    setUser((u) => u ? { ...u, telegram: username.startsWith('@') ? username : `@${username}` } : u);
  }, []);

  const connectSteam = useCallback(() => {
    setUser((u) => u ? {
      ...u,
      steamId:       '76561198XXXXXXXX',
      steamUsername: u.name,
      steamAvatar:   `https://picsum.photos/seed/steam${u.id}/200/200`,
    } : u);
  }, []);

  /* ── Profile & coins ── */
  const updateProfile = useCallback((data: Partial<User>) =>
    setUser((u) => u ? { ...u, ...data } : u), []);

  const addCoins = useCallback((amount: number) =>
    setUser((u) => u ? { ...u, coins: u.coins + amount } : u), []);

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const legacyLogin = useCallback(async (email: string, password: string, turnstileToken?: string): Promise<boolean> => {
    return login(email, password, turnstileToken);
  }, [login]);

  return (
    <UserContext.Provider value={{
      user, isLoggedIn: !!user, isAuthLoading: status === 'loading',
      notifications, wishlist, unreadCount,
      login: legacyLogin, logout, register,
      addToWishlist, removeFromWishlist, isInWishlist,
      markNotificationRead, markAllRead,
      connectTelegram, connectSteam,
      updateProfile, addCoins,
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used inside UserProvider');
  return ctx;
}

// Re-export for convenience
export { getLevelFromXp };
