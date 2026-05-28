export interface QuestDef {
  id:          string;
  title:       string;
  description: string;
  icon:        string;
  reward:      number;
}

export const DAILY_QUESTS: QuestDef[] = [
  {
    id:          'login',
    title:       'Ежедневный вход',
    description: 'Войди в аккаунт',
    icon:        '👋',
    reward:      10,
  },
  {
    id:          'catalog',
    title:       'Обзор каталога',
    description: 'Открой страницу каталога',
    icon:        '🎮',
    reward:      5,
  },
  {
    id:          'wishlist',
    title:       'В вишлист',
    description: 'Добавь игру в список желаемого',
    icon:        '❤️',
    reward:      15,
  },
  {
    id:          'review',
    title:       'Оставь отзыв',
    description: 'Напиши отзыв на любую игру',
    icon:        '⭐',
    reward:      50,
  },
  {
    id:          'purchase',
    title:       'Покупка игры',
    description: 'Оформи заказ',
    icon:        '🛒',
    reward:      100,
  },
];

export function todayDate(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

export const QUEST_IDS = DAILY_QUESTS.map(q => q.id);
