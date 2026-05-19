import { Markup } from 'telegraf';
import { config } from '../config/index';

const ON  = '\u{1F514}'; // bell
const OFF = '\u{1F515}'; // bell with slash

/* Main menu */
export const mainMenu = () =>
  Markup.inlineKeyboard([
    [
      Markup.button.callback('\u{1F4E6} Заказы',   'cmd_orders'),
      Markup.button.callback('\u{1FA99} Монеты',   'cmd_coins'),
    ],
    [
      Markup.button.callback('❤️ Вишлист',  'cmd_wishlist'),
      Markup.button.callback('\u{1F381} Награды',     'cmd_rewards'),
    ],
    [
      Markup.button.callback('\u{1F464} Профиль',     'cmd_profile'),
      Markup.button.callback('⚙️ Настройки','cmd_settings'),
    ],
    [Markup.button.url('\u{1F310} Открыть ARCANE.UZ', 'https://arcane.uz')],
    [Markup.button.callback('\u{1F198} Поддержка', 'cmd_support')],
  ]);

/* Link account */
export const linkMenu = (token: string) =>
  Markup.inlineKeyboard([
    [Markup.button.url(
      '\u{1F517} Подтвердить привязку',
      'https://t.me/' + config.bot.username + '?start=verify_' + token,
    )],
  ]);

/* Support */
export const supportMenu = () =>
  Markup.inlineKeyboard([
    [Markup.button.callback('\u{1F4E6} Проблема с заказом',  'support_order')],
    [Markup.button.callback('\u{1F4B3} Вопрос по оплате',    'support_payment')],
    [Markup.button.callback('\u{1F511} Ключ не работает',    'support_key')],
    [Markup.button.callback('\u{1FA99} Arcane Coins',        'support_coins')],
    [Markup.button.callback('\u{1F4AC} Написать менеджеру',  'support_human')],
    [Markup.button.callback('<< Назад', 'cmd_menu')],
  ]);

/* Settings toggles */
export const settingsMenu = (prefs: {
  orders: boolean; coins: boolean; wishlist: boolean;
  deals: boolean;  rewards: boolean;
}) =>
  Markup.inlineKeyboard([
    [Markup.button.callback((prefs.orders   ? ON : OFF) + ' Заказы',       'toggle_orders')],
    [Markup.button.callback((prefs.coins    ? ON : OFF) + ' Монеты',       'toggle_coins')],
    [Markup.button.callback((prefs.wishlist ? ON : OFF) + ' Вишлист',      'toggle_wishlist')],
    [Markup.button.callback((prefs.deals    ? ON : OFF) + ' Акции',        'toggle_deals')],
    [Markup.button.callback((prefs.rewards  ? ON : OFF) + ' Награды',      'toggle_rewards')],
    [Markup.button.callback('<< Главное меню', 'cmd_menu')],
  ]);

/* Reward claim */
export const rewardMenu = (canClaim: boolean) =>
  Markup.inlineKeyboard([
    canClaim
      ? [Markup.button.callback('\u{1F381} Забрать награду', 'claim_reward')]
      : [Markup.button.callback('⏳ Уже получено сегодня', 'reward_wait')],
    [Markup.button.callback('<< Главное меню', 'cmd_menu')],
  ]);

/* Back */
export const backMenu = () =>
  Markup.inlineKeyboard([
    [Markup.button.callback('<< Главное меню', 'cmd_menu')],
  ]);

/* Referral */
export const referralMenu = (refCode: string) =>
  Markup.inlineKeyboard([
    [Markup.button.url(
      '\u{1F4E8} Поделиться ссылкой',
      'https://t.me/' + config.bot.username,
    )],
    [Markup.button.callback('\u{1F4CA} Моя статистика', 'referral_stats')],
    [Markup.button.callback('<< Назад', 'cmd_menu')],
  ]);
