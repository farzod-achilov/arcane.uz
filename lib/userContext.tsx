'use client';

import {
  createContext, useContext, useState, useEffect, useCallback,
  type ReactNode,
} from 'react';
import {
  DEMO_USER, INITIAL_NOTIFICATIONS, getLevelFromXp,
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
  register: (name: string, email: string, password: string) => Promise<boolean>;
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

const LS_USER   = 'arcane_user';
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

export function UserProvider({ children }: { children: ReactNode }) {
  const [user,          setUser]  = useState<User | null>(null);
  const [wishlist,      setWList] = useState<string[]>([]);
  const [notifications, setNotifs] = useState<Notification[]>([]);
  const [hydrated,      setHyd]   = useState(false);

  /* Read from localStorage once on mount */
  useEffect(() => {
    setUser(readLS<User | null>(LS_USER, null));
    setWList(readLS<string[]>(LS_LIST, []));
    setNotifs(readLS<Notification[]>(LS_NOTIFS, INITIAL_NOTIFICATIONS));
    setHyd(true);
  }, []);

  /* Persist on change */
  useEffect(() => { if (hydrated) localStorage.setItem(LS_USER,   JSON.stringify(user)); },          [user, hydrated]);
  useEffect(() => { if (hydrated) localStorage.setItem(LS_LIST,   JSON.stringify(wishlist)); },      [wishlist, hydrated]);
  useEffect(() => { if (hydrated) localStorage.setItem(LS_NOTIFS, JSON.stringify(notifications)); }, [notifications, hydrated]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  /* ── Auth ── */
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    await new Promise((r) => setTimeout(r, 900)); // simulate network
    if (!email || password.length < 3) return false;
    const newUser: User = email === DEMO_USER.email
      ? { ...DEMO_USER }
      : {
          id: `usr_${Date.now()}`,
          name: email.split('@')[0],
          email,
          telegram: null,
          steamId: null,
          steamUsername: null,
          steamAvatar: null,
          xp: 0,
          coins: 100, // welcome bonus
          avatar: `https://picsum.photos/seed/${email}/200/200`,
          joinDate: new Date().toISOString().split('T')[0],
        };
    setUser(newUser);
    return true;
  }, []);

  const register = useCallback(async (name: string, email: string, password: string): Promise<boolean> => {
    await new Promise((r) => setTimeout(r, 1100));
    if (!name || !email || password.length < 6) return false;
    const newUser: User = {
      id: `usr_${Date.now()}`,
      name,
      email,
      telegram: null,
      steamId: null,
      steamUsername: null,
      steamAvatar: null,
      xp: 0,
      coins: 500, // welcome bonus
      avatar: `https://picsum.photos/seed/${email}/200/200`,
      joinDate: new Date().toISOString().split('T')[0],
    };
    setUser(newUser);
    // Welcome notification
    setNotifs((prev) => [{
      id: `w_${Date.now()}`,
      type: 'system',
      title: `Добро пожаловать, ${name}!`,
      body: '+500 Arcane Coins в подарок за регистрацию',
      time: Date.now(),
      read: false,
      href: '/dashboard',
    }, ...prev]);
    return true;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setWList([]);
  }, []);

  /* ── Wishlist ── */
  const addToWishlist    = useCallback((id: string) => setWList((p) => p.includes(id) ? p : [...p, id]), []);
  const removeFromWishlist = useCallback((id: string) => setWList((p) => p.filter((x) => x !== id)), []);
  const isInWishlist     = useCallback((id: string) => wishlist.includes(id), [wishlist]);

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
      steamId: '76561198XXXXXXXX',
      steamUsername: u.name,
      steamAvatar: `https://picsum.photos/seed/steam${u.id}/200/200`,
    } : u);
  }, []);

  /* ── Profile & coins ── */
  const updateProfile = useCallback((data: Partial<User>) =>
    setUser((u) => u ? { ...u, ...data } : u), []);

  const addCoins = useCallback((amount: number) =>
    setUser((u) => u ? { ...u, coins: u.coins + amount } : u), []);

  return (
    <UserContext.Provider value={{
      user, isLoggedIn: !!user,
      notifications, wishlist, unreadCount,
      login, logout, register,
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
