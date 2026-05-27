'use client';

import {
  createContext, useContext, useState, useEffect, useCallback,
  type ReactNode,
} from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import {
  INITIAL_NOTIFICATIONS, getLevelFromXp,
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
  notifications: Notification[];
  wishlist: string[];
  unreadCount: number;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (name: string, email: string, password: string, referralCode?: string) => Promise<{ ok: boolean; error?: string }>;
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

const LS_LIST   = 'arcane_wishlist';
const LS_NOTIFS = 'arcane_notifs';

function readLS<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

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
  const [hydrated,      setHyd]   = useState(false);

  /* Hydrate local state from localStorage */
  useEffect(() => {
    setWList(readLS<string[]>(LS_LIST, []));
    setNotifs(readLS<Notification[]>(LS_NOTIFS, INITIAL_NOTIFICATIONS));
    setHyd(true);
  }, []);

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

  /* Persist notifications only (wishlist now lives in DB) */
  useEffect(() => { if (hydrated) localStorage.setItem(LS_NOTIFS, JSON.stringify(notifications)); }, [notifications, hydrated]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  /* ── Auth ── */
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    const result = await signIn('credentials', { redirect: false, email, password });
    return result?.ok ?? false;
  }, []);

  const register = useCallback(async (name: string, email: string, password: string, referralCode?: string): Promise<{ ok: boolean; error?: string }> => {
    const res = await fetch('/api/auth/register', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name, email, password, referralCode }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { ok: false, error: (data as { error?: string }).error ?? 'Ошибка регистрации' };
    }

    const ok = await signIn('credentials', { redirect: false, email, password });
    if (!ok?.ok) return { ok: false, error: 'Не удалось войти после регистрации' };

    setNotifs((prev) => [{
      id:    `w_${Date.now()}`,
      type:  'system',
      title: `Добро пожаловать, ${name}!`,
      body:  '+500 Arcane Coins в подарок за регистрацию',
      time:  Date.now(),
      read:  false,
      href:  '/library',
    }, ...prev]);

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
  const markNotificationRead = useCallback((id: string) =>
    setNotifs((p) => p.map((n) => n.id === id ? { ...n, read: true } : n)), []);
  const markAllRead = useCallback(() =>
    setNotifs((p) => p.map((n) => ({ ...n, read: true }))), []);

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
  const legacyLogin = useCallback(async (email: string, password: string): Promise<boolean> => {
    return login(email, password);
  }, [login]);

  return (
    <UserContext.Provider value={{
      user, isLoggedIn: !!user,
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
