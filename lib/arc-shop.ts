export interface ShopItem {
  id:          string;
  title:       string;
  description: string;
  icon:        string;
  cost:        number;
  type:        'promo' | 'coins' | 'badge';
  value:       number | string;
}

export const SHOP_ITEMS: ShopItem[] = [
  { id: 'promo5',   title: 'Скидка 5%',    description: 'Промокод на 5% скидку',          icon: '🎟️', cost: 300,  type: 'promo', value: 5      },
  { id: 'promo10',  title: 'Скидка 10%',   description: 'Промокод на 10% скидку',         icon: '🎫', cost: 600,  type: 'promo', value: 10     },
  { id: 'promo15',  title: 'Скидка 15%',   description: 'Промокод на 15% скидку',         icon: '🏷️', cost: 1000, type: 'promo', value: 15     },
  { id: 'coins50',  title: '+50 000 сум',  description: 'Пополнить баланс на 50 000 сум', icon: '💰', cost: 2000, type: 'coins', value: 50000  },
  { id: 'coins100', title: '+100 000 сум', description: 'Пополнить баланс на 100 000 сум',icon: '💎', cost: 3500, type: 'coins', value: 100000 },
];
