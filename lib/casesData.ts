export type Rarity = 'common' | 'rare' | 'epic' | 'legendary' | 'arcane';
export type RewardType = 'coins' | 'discount' | 'game' | 'cosmetic' | 'bundle';
export type CaseTier = 'silver' | 'gold' | 'arcane';

export interface CaseReward {
  id: string;
  name: string;
  description: string;
  type: RewardType;
  rarity: Rarity;
  displayValue: string;
  icon: string;
  probability: number; // 0–100, must sum to 100 within a case
  coinValue: number;
}

export interface CaseConfig {
  id: CaseTier;
  title: string;
  subtitle: string;
  description: string;
  price: number;
  accentColor: string;
  glowColor: string;
  gradient: string;
  particleColor: string;
  rewards: CaseReward[];
}

export interface RarityMeta {
  label: string;
  color: string;
  bg: string;
  border: string;
  glow: string;
  gradient: string;
  textColor: string;
  dotColor: string;
}

export const RARITY_META: Record<Rarity, RarityMeta> = {
  common: {
    label: 'Обычный',
    color: '#60A5FA',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/40',
    glow: '0 0 16px rgba(96, 165, 250, 0.45), 0 0 40px rgba(96, 165, 250, 0.15)',
    gradient: 'from-blue-600 to-blue-400',
    textColor: 'text-blue-400',
    dotColor: 'bg-blue-400',
  },
  rare: {
    label: 'Редкий',
    color: '#A78BFA',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/40',
    glow: '0 0 20px rgba(167, 139, 250, 0.5), 0 0 50px rgba(167, 139, 250, 0.2)',
    gradient: 'from-violet-600 to-violet-400',
    textColor: 'text-violet-400',
    dotColor: 'bg-violet-400',
  },
  epic: {
    label: 'Эпик',
    color: '#F472B6',
    bg: 'bg-pink-500/10',
    border: 'border-pink-500/40',
    glow: '0 0 24px rgba(244, 114, 182, 0.6), 0 0 60px rgba(244, 114, 182, 0.2)',
    gradient: 'from-pink-600 to-rose-400',
    textColor: 'text-pink-400',
    dotColor: 'bg-pink-400',
  },
  legendary: {
    label: 'Легендарный',
    color: '#FBBF24',
    bg: 'bg-amber-500/10',
    border: 'border-amber-400/60',
    glow: '0 0 30px rgba(251, 191, 36, 0.7), 0 0 80px rgba(251, 191, 36, 0.3)',
    gradient: 'from-amber-500 to-yellow-300',
    textColor: 'text-amber-400',
    dotColor: 'bg-amber-400',
  },
  arcane: {
    label: 'Arcane',
    color: '#06B6D4',
    bg: 'bg-cyan-900/20',
    border: 'border-cyan-400/60',
    glow: '0 0 40px rgba(6, 182, 212, 0.8), 0 0 80px rgba(124, 58, 237, 0.5), 0 0 120px rgba(6, 182, 212, 0.15)',
    gradient: 'from-purple-600 via-violet-500 to-cyan-400',
    textColor: 'text-cyan-400',
    dotColor: 'bg-cyan-400',
  },
};

// Sorted order for comparison
export const RARITY_ORDER: Rarity[] = ['common', 'rare', 'epic', 'legendary', 'arcane'];

export function rarityRank(r: Rarity): number {
  return RARITY_ORDER.indexOf(r);
}

export function pickWeightedReward(rewards: CaseReward[]): CaseReward {
  const total = rewards.reduce((s, r) => s + r.probability, 0);
  let rand = Math.random() * total;
  for (const r of rewards) {
    rand -= r.probability;
    if (rand <= 0) return r;
  }
  return rewards[rewards.length - 1];
}

export const CASES: Record<CaseTier, CaseConfig> = {
  silver: {
    id: 'silver',
    title: 'Серебряный Кейс',
    subtitle: 'Starter Drop',
    description: 'Базовые награды: монеты, скидки и шанс на редкие игры',
    price: 49000,
    accentColor: '#94A3B8',
    glowColor: 'rgba(148, 163, 184, 0.4)',
    gradient: 'linear-gradient(135deg, #94A3B8 0%, #CBD5E1 50%, #64748B 100%)',
    particleColor: '#94A3B8',
    rewards: [
      { id: 's-coins-100',   name: '100 Монет',   description: 'Arcane монеты для магазина',   type: 'coins',    rarity: 'common',    displayValue: '100 монет',    icon: '🪙', probability: 28, coinValue: 100   },
      { id: 's-coins-250',   name: '250 Монет',   description: 'Небольшой пакет монет',         type: 'coins',    rarity: 'common',    displayValue: '250 монет',    icon: '🪙', probability: 18, coinValue: 250   },
      { id: 's-disc-10',     name: 'Скидка 10%',  description: 'На любую игру в каталоге',      type: 'discount', rarity: 'common',    displayValue: '10% скидка',   icon: '🏷️', probability: 15, coinValue: 150   },
      { id: 's-disc-15',     name: 'Скидка 15%',  description: 'На любую игру',                 type: 'discount', rarity: 'rare',      displayValue: '15% скидка',   icon: '🏷️', probability: 12, coinValue: 250   },
      { id: 's-coins-500',   name: '500 Монет',   description: 'Хороший пакет монет',           type: 'coins',    rarity: 'rare',      displayValue: '500 монет',    icon: '💰', probability: 10, coinValue: 500   },
      { id: 's-indie',       name: 'Инди Игра',   description: 'Случайная инди игра Steam',     type: 'game',     rarity: 'rare',      displayValue: 'Инди игра',    icon: '🎮', probability: 7,  coinValue: 500   },
      { id: 's-coins-1000',  name: '1000 Монет',  description: 'Крупный пакет монет',           type: 'coins',    rarity: 'epic',      displayValue: '1000 монет',   icon: '💎', probability: 4,  coinValue: 1000  },
      { id: 's-disc-25',     name: 'Скидка 25%',  description: 'На любую игру',                 type: 'discount', rarity: 'epic',      displayValue: '25% скидка',   icon: '⚡', probability: 3,  coinValue: 800   },
      { id: 's-aaa',         name: 'AAA Игра',    description: 'Полная популярная AAA игра',    type: 'game',     rarity: 'legendary', displayValue: 'AAA Игра',     icon: '🏆', probability: 2,  coinValue: 3000  },
      { id: 's-arcane',      name: 'ARCANE Bundle', description: 'Ультра редкая награда',       type: 'bundle',   rarity: 'arcane',    displayValue: 'ARCANE Bundle',icon: '✨', probability: 1,  coinValue: 10000 },
    ],
  },

  gold: {
    id: 'gold',
    title: 'Золотой Кейс',
    subtitle: 'Premium Drop',
    description: 'Улучшенные шансы на AAA игры и эксклюзивные бандлы',
    price: 99000,
    accentColor: '#F59E0B',
    glowColor: 'rgba(245, 158, 11, 0.5)',
    gradient: 'linear-gradient(135deg, #F59E0B 0%, #FDE68A 50%, #D97706 100%)',
    particleColor: '#F59E0B',
    rewards: [
      { id: 'g-coins-300',    name: '300 Монет',       description: 'Arcane монеты',                  type: 'coins',    rarity: 'common',    displayValue: '300 монет',      icon: '🪙', probability: 18, coinValue: 300   },
      { id: 'g-disc-20',      name: 'Скидка 20%',      description: 'На любую игру',                  type: 'discount', rarity: 'common',    displayValue: '20% скидка',     icon: '🏷️', probability: 12, coinValue: 400   },
      { id: 'g-coins-600',    name: '600 Монет',        description: 'Arcane монеты',                  type: 'coins',    rarity: 'common',    displayValue: '600 монет',      icon: '🪙', probability: 10, coinValue: 600   },
      { id: 'g-coins-200',    name: '200 Монет',        description: 'Arcane монеты',                  type: 'coins',    rarity: 'common',    displayValue: '200 монет',      icon: '🪙', probability: 9,  coinValue: 200   },
      { id: 'g-indie-bundle', name: 'Инди Бандл x3',   description: '3 инди игры Steam',              type: 'bundle',   rarity: 'rare',      displayValue: 'Инди Бандл x3', icon: '🎯', probability: 14, coinValue: 1000  },
      { id: 'g-disc-30',      name: 'Скидка 30%',      description: 'На любую игру',                  type: 'discount', rarity: 'rare',      displayValue: '30% скидка',     icon: '🏷️', probability: 10, coinValue: 600   },
      { id: 'g-coins-1500',   name: '1500 Монет',       description: 'Большой пакет монет',            type: 'coins',    rarity: 'epic',      displayValue: '1500 монет',     icon: '💎', probability: 8,  coinValue: 1500  },
      { id: 'g-disc-40',      name: 'Скидка 40%',      description: 'На AAA игру',                    type: 'discount', rarity: 'epic',      displayValue: '40% скидка AAA', icon: '⚡', probability: 7,  coinValue: 1200  },
      { id: 'g-aaa-game',     name: 'AAA Игра',        description: 'Полная AAA игра на выбор',       type: 'game',     rarity: 'legendary', displayValue: 'Полная AAA',     icon: '🏆', probability: 6,  coinValue: 5000  },
      { id: 'g-premium',      name: 'Premium Bundle',  description: '2 AAA + Season Pass',            type: 'bundle',   rarity: 'legendary', displayValue: 'Premium Bundle', icon: '👑', probability: 3,  coinValue: 8000  },
      { id: 'g-arcane',       name: 'ARCANE Drop',     description: 'Эксклюзивный ARCANE набор',      type: 'bundle',   rarity: 'arcane',    displayValue: 'ARCANE Exclusive',icon: '✨', probability: 2, coinValue: 15000 },
      { id: 'g-ultra',        name: 'Ultra Jackpot',   description: 'Максимальная золотая награда',   type: 'bundle',   rarity: 'arcane',    displayValue: 'Ultra Jackpot',  icon: '🌟', probability: 1,  coinValue: 20000 },
    ],
  },

  arcane: {
    id: 'arcane',
    title: 'Arcane Кейс',
    subtitle: 'Ultra Rare Drop',
    description: 'Эксклюзивные награды, предзаказы и премиум бандлы для коллекционеров',
    price: 199000,
    accentColor: '#7C3AED',
    glowColor: 'rgba(124, 58, 237, 0.6)',
    gradient: 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 40%, #06B6D4 100%)',
    particleColor: '#06B6D4',
    rewards: [
      { id: 'a-coins-500',     name: '500 Монет',        description: 'Arcane монеты',                    type: 'coins',    rarity: 'common',    displayValue: '500 монет',        icon: '🪙', probability: 13, coinValue: 500    },
      { id: 'a-coins-1000',    name: '1000 Монет',        description: 'Arcane монеты',                    type: 'coins',    rarity: 'common',    displayValue: '1000 монет',       icon: '💰', probability: 10, coinValue: 1000   },
      { id: 'a-disc-25',       name: 'Скидка 25%',       description: 'На любую игру',                    type: 'discount', rarity: 'common',    displayValue: '25% скидка',       icon: '🏷️', probability: 9,  coinValue: 600    },
      { id: 'a-coins-750',     name: '750 Монет',         description: 'Arcane монеты',                    type: 'coins',    rarity: 'common',    displayValue: '750 монет',        icon: '🪙', probability: 1,  coinValue: 750    },
      { id: 'a-indie-bundle',  name: 'Инди Бандл x5',    description: '5 инди игр Steam',                 type: 'bundle',   rarity: 'rare',      displayValue: 'Инди Бандл x5',   icon: '🎯', probability: 12, coinValue: 2000   },
      { id: 'a-coins-2500',    name: '2500 Монет',        description: 'Крупный пакет монет',              type: 'coins',    rarity: 'rare',      displayValue: '2500 монет',       icon: '💎', probability: 10, coinValue: 2500   },
      { id: 'a-disc-40',       name: 'Скидка 40%',       description: 'На любую игру',                    type: 'discount', rarity: 'rare',      displayValue: '40% скидка',       icon: '⚡', probability: 8,  coinValue: 1500   },
      { id: 'a-aaa-game',      name: 'AAA Игра',         description: 'Полная AAA игра на выбор',         type: 'game',     rarity: 'epic',      displayValue: 'Полная AAA',       icon: '🎮', probability: 10, coinValue: 5000   },
      { id: 'a-seasonal',      name: 'Сезонный Бандл',   description: 'AAA + полный DLC пакет',           type: 'bundle',   rarity: 'epic',      displayValue: 'Сезонный Бандл',  icon: '🌟', probability: 7,  coinValue: 8000   },
      { id: 'a-coins-5000',    name: '5000 Монет',        description: 'Максимальный пакет монет',         type: 'coins',    rarity: 'epic',      displayValue: '5000 монет',       icon: '👑', probability: 5,  coinValue: 5000   },
      { id: 'a-deluxe',        name: 'Deluxe Edition',   description: 'Deluxe AAA + все DLC',             type: 'game',     rarity: 'legendary', displayValue: 'Deluxe AAA',       icon: '🏆', probability: 6,  coinValue: 12000  },
      { id: 'a-premium-x3',    name: 'Premium Bundle x3', description: '3 AAA + Season Pass',             type: 'bundle',   rarity: 'legendary', displayValue: '3 AAA + Pass',     icon: '💫', probability: 3,  coinValue: 18000  },
      { id: 'a-preorder',      name: 'Предзаказ Игры',   description: 'Предзаказ следующего AAA релиза',  type: 'game',     rarity: 'arcane',    displayValue: 'Game Preorder',    icon: '🔮', probability: 3,  coinValue: 25000  },
      { id: 'a-ultimate',      name: 'ARCANE Ultimate',  description: 'Максимальная коллекционная награда', type: 'bundle', rarity: 'arcane',    displayValue: 'ARCANE Ultimate',  icon: '✨', probability: 2,  coinValue: 50000  },
      { id: 'a-jackpot',       name: 'THE ARCANE DROP',  description: 'Легендарная коллекция ARCANE',     type: 'bundle',   rarity: 'arcane',    displayValue: 'THE ARCANE DROP',  icon: '⚡', probability: 1,  coinValue: 100000 },
    ],
  },
};

export const CASES_LIST = Object.values(CASES) as CaseConfig[];
