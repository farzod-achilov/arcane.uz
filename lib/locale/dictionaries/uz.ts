// Uzbek (Latin) — must match the shape of the Russian source dictionary.
import type { Dictionary } from './ru';

const uz: Dictionary = {
  common: {
    login:    'Kirish',
    language: 'Til',
  },

  nav: {
    home:       'Bosh sahifa',
    catalog:    'Katalog',
    deals:      'Chegirmalar',
    new:        'Yangiliklar',
    library:    'Kutubxona',
    wishlist:   "Istaklar ro'yxati",
    profile:    'Profil',
    deposit:    "To'ldirish",
    shop:       "Do'kon",
    notifyNew:  'Yangi bildirishnoma',
    notifyHint: "Ko'rish uchun qo'ng'iroqchani bosing",
    ticker: {
      delivery: 'KALITLARNI BIR ZUMDA YETKAZIB BERISH',
      freeShip: "500 000 SO'MDAN BEPUL YETKAZIB BERISH",
      coins:    'ARCANE COINS ISHLAB TOPING',
      weekly:   'HAR HAFTA YANGILIKLAR',
      number1:  "O'ZBEKISTONDAGI №1 O'YIN DO'KONI",
    },
  },

  footer: {
    brandDesc:      "O'zbekistondagi premium raqamli o'yinlar do'koni. Kalitlarni bir zumda yetkazib berish, qulay narxlar va Arcane Coins mukofot tizimi.",
    colCatalog:     'Katalog',
    colInfo:        "Ma'lumot",
    colSupport:     "Qo'llab-quvvatlash",
    paymentMethods: "To'lov usullari",
    rights:         'Barcha huquqlar himoyalangan',
    privacy:        'Maxfiylik',
    terms:          'Foydalanish shartlari',
    links: {
      pcGames:     "PC o'yinlari",
      ps5Games:    "PS5 o'yinlari",
      xboxGames:   "Xbox o'yinlari",
      deals:       'Chegirmalar',
      new:         'Yangiliklar',
      about:       'Biz haqimizda',
      keyDelivery: 'Kalitlarni yetkazib berish',
      returns:     'Qaytarish va almashtirish',
      coins:       'Arcane Coins',
      partner:     'Hamkorlik dasturi',
      tgSupport:   "Telegram qo'llab-quvvatlash",
      faq:         'FAQ',
      howToPay:    "Qanday to'lash",
      contact:     "Biz bilan bog'lanish",
    },
  },

  cookie: {
    title:   'Biz cookie-fayllardan foydalanamiz',
    body:    "Sayt to'g'ri ishlashi, avtorizatsiya va tahlil uchun.",
    policy:  'Maxfiylik siyosati',
    accept:  'Qabul qilish',
    decline: 'Rad etish',
  },

  home: {
    hero: {
      eyebrow:        "O'ZBEKISTONDAGI №1 O'YIN DO'KONI",
      headlinePre:    '',
      headlineAccent: 'Yangi',
      headlinePost:   "darajadagi o'yinlar",
      subPre:         "PC, PlayStation va Xbox uchun litsenziyali kalitlarni bir zumda yetkazib berish. Eksklyuziv chegirmalar, Mystery Cases va ",
      subPost:        ' har bir xaridingiz bilan.',
      ctaCatalog:     "Katalogga o'tish",
      ctaDeals:       'Issiq chegirmalar',
      statGames:      "O'yinlar",
      statPlayers:    "O'yinchilar",
      statHappy:      'Mamnun',
      trustPayment:   "To'lovlar himoyasi",
      trustDelivery:  'Bir zumda yetkazish',
      trustSupport:   "24/7 qo'llab-quvvatlash",
      badgeNew:       'YANGI',
      reviewsCount:   '12K sharh',
      priceSuffix:    "so'm",
      coinPerBuy:     '+250 har bir xariddan',
      purchasedToday: 'BUGUN 127 TA SOTIB OLINDI',
      bar: {
        deliveryLabel: 'Bir zumda yetkazish',
        deliveryDesc:  "To'lovdan keyin darhol kalit",
        licenseLabel:  'Litsenziyali kalitlar',
        licenseDesc:   '100% haqiqiy',
        supportLabel:  "24/7 qo'llab-quvvatlash",
        supportDesc:   'Telegram va Email',
        coinsLabel:    'Arcane Coins',
        coinsDesc:     'Har bir xarid uchun bonuslar',
      },
    },
  },
};

export default uz;
