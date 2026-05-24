import type { Rarity } from './casesData';

export interface LiveWin {
  id: number;
  user: string;
  reward: string;
  rarity: Rarity;
  machineId: string;
  time: number;
}

const POOL: Omit<LiveWin, 'id' | 'time'>[] = [
  { user: 'PhantomX91',   reward: 'Cyberpunk 2077',   rarity: 'legendary', machineId: 'arcane' },
  { user: 'NeonSerpent',  reward: 'Инди Бандл x3',    rarity: 'rare',      machineId: 'silver' },
  { user: 'ArcaneKing',   reward: '500 Монет',         rarity: 'common',    machineId: 'silver' },
  { user: 'VoidWalker',   reward: 'Hades',             rarity: 'epic',      machineId: 'gold'   },
  { user: 'GhostLine07',  reward: 'XP Boost x2',       rarity: 'common',    machineId: 'silver' },
  { user: 'CyberNomad',   reward: 'Hollow Knight',     rarity: 'rare',      machineId: 'gold'   },
  { user: 'QuantumEdge',  reward: 'Red Dead II',        rarity: 'legendary', machineId: 'arcane' },
  { user: 'NightCrawl',   reward: '1000 Монет',        rarity: 'rare',      machineId: 'gold'   },
  { user: 'ShadowMesh',   reward: 'DOOM Eternal',      rarity: 'epic',      machineId: 'arcane' },
  { user: 'PixelGhost',   reward: 'Celeste',           rarity: 'rare',      machineId: 'gold'   },
  { user: 'DataPhantom',  reward: 'ARCANE Ultimate',   rarity: 'arcane',    machineId: 'arcane' },
  { user: 'NovaSurge',    reward: '200 Монет',         rarity: 'common',    machineId: 'silver' },
  { user: 'CodeHunter',   reward: 'Stardew Valley',    rarity: 'rare',      machineId: 'silver' },
  { user: 'NeonKnight_Z', reward: 'The Witcher 3',     rarity: 'epic',      machineId: 'gold'   },
  { user: 'ArcPulse',     reward: 'Deluxe Edition',    rarity: 'legendary', machineId: 'arcane' },
  { user: 'GlitchRider',  reward: 'Скидка 30%',        rarity: 'rare',      machineId: 'gold'   },
  { user: 'ByteRunner',   reward: '5000 Монет',        rarity: 'epic',      machineId: 'arcane' },
  { user: 'CryptoSlade',  reward: 'Premium Bundle',    rarity: 'legendary', machineId: 'arcane' },
];

export function generateLiveWins(count: number): LiveWin[] {
  return Array.from({ length: count }, (_, i) => ({
    ...POOL[i % POOL.length],
    id: i,
    time: Date.now() - i * 4200,
  }));
}

export const DROP_VFX: Record<Rarity, {
  label: string; color: string; glow: string; border: string; bg: string;
  particles: number; shake: boolean; alarm: boolean; fullscreen: boolean;
}> = {
  common: {
    label: 'COMMON',    color: '#00E5FF', glow: 'rgba(0,229,255,0.5)',
    border: 'rgba(0,229,255,0.3)', bg: 'rgba(0,229,255,0.06)',
    particles: 14, shake: false, alarm: false, fullscreen: false,
  },
  rare: {
    label: 'RARE',      color: '#A78BFA', glow: 'rgba(167,139,250,0.55)',
    border: 'rgba(167,139,250,0.35)', bg: 'rgba(167,139,250,0.08)',
    particles: 24, shake: false, alarm: false, fullscreen: false,
  },
  epic: {
    label: 'EPIC',      color: '#FF00AA', glow: 'rgba(255,0,170,0.65)',
    border: 'rgba(255,0,170,0.4)', bg: 'rgba(255,0,170,0.09)',
    particles: 36, shake: true, alarm: false, fullscreen: false,
  },
  legendary: {
    label: 'LEGENDARY', color: '#FFC857', glow: 'rgba(255,200,87,0.75)',
    border: 'rgba(255,200,87,0.5)', bg: 'rgba(255,200,87,0.1)',
    particles: 55, shake: true, alarm: true, fullscreen: true,
  },
  arcane: {
    label: 'ARCANE',    color: '#FF00AA', glow: 'rgba(255,0,170,0.85)',
    border: 'rgba(255,0,170,0.6)', bg: 'rgba(255,0,170,0.12)',
    particles: 70, shake: true, alarm: true, fullscreen: true,
  },
};

export const MACHINE_VIS = {
  silver: {
    label: 'SILVER UNIT', tagline: 'ENTRY DROP MACHINE', tier: '01',
    color: '#00E5FF', glow: 'rgba(0,229,255,0.28)', screenBg: '#00050D',
  },
  gold: {
    label: 'GOLD UNIT', tagline: 'PREMIUM DROP MACHINE', tier: '02',
    color: '#FFC857', glow: 'rgba(255,200,87,0.26)', screenBg: '#080600',
  },
  arcane: {
    label: 'ARCANE UNIT', tagline: 'ULTIMATE DROP MACHINE', tier: '03',
    color: '#FF00AA', glow: 'rgba(255,0,170,0.3)', screenBg: '#0A0008',
  },
} as const;

export type MachineId = keyof typeof MACHINE_VIS;
