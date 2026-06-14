// Russian — source dictionary. Its shape defines the `Dictionary` type that
// every other locale must satisfy. Add UI strings here as they get translated.

const ru = {
  common: {
    login:    'Войти',
    language: 'Язык',
  },

  nav: {
    home:       'Главная',
    catalog:    'Каталог',
    deals:      'Скидки',
    new:        'Новинки',
    library:    'Библиотека',
    wishlist:   'Вишлист',
    profile:    'Профиль',
    deposit:    'Пополнить',
    shop:       'Магазин',
    notifyNew:  'Новое уведомление',
    notifyHint: 'Нажмите на колокольчик чтобы посмотреть',
    ticker: {
      delivery: 'МГНОВЕННАЯ ДОСТАВКА КЛЮЧЕЙ',
      freeShip: 'БЕСПЛАТНАЯ ДОСТАВКА ОТ 500 000 СУМ',
      coins:    'ЗАРАБАТЫВАЙ ARCANE COINS',
      weekly:   'НОВИНКИ КАЖДУЮ НЕДЕЛЮ',
      number1:  '№1 ИГРОВОЙ МАГАЗИН В УЗБЕКИСТАНЕ',
    },
  },

  footer: {
    brandDesc:      'Премиальный магазин цифровых игр в Узбекистане. Мгновенная доставка ключей, выгодные цены и система наград Arcane Coins.',
    colCatalog:     'Каталог',
    colInfo:        'Информация',
    colSupport:     'Поддержка',
    paymentMethods: 'Способы оплаты',
    rights:         'Все права защищены',
    privacy:        'Конфиденциальность',
    terms:          'Условия использования',
    links: {
      pcGames:     'PC игры',
      ps5Games:    'PS5 игры',
      xboxGames:   'Xbox игры',
      deals:       'Скидки',
      new:         'Новинки',
      about:       'О нас',
      keyDelivery: 'Доставка ключей',
      returns:     'Возврат и обмен',
      coins:       'Arcane Coins',
      partner:     'Партнёрская программа',
      tgSupport:   'Telegram поддержка',
      faq:         'FAQ',
      howToPay:    'Как оплатить',
      contact:     'Связаться с нами',
    },
  },

  cookie: {
    title:   'Мы используем cookies',
    body:    'Для корректной работы сайта, авторизации и аналитики.',
    policy:  'Политика конфиденциальности',
    accept:  'Принять',
    decline: 'Отказаться',
  },
};

export type Dictionary = typeof ru;
export default ru;
