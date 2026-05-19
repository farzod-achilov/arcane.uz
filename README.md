# PHANTOM.UZ — Премиальный игровой магазин

## Запуск проекта

### 1. Установи Node.js
Скачай с https://nodejs.org (рекомендуется версия 18+)

### 2. Установи зависимости
```bash
npm install
```

### 3. Запусти dev-сервер
```bash
npm run dev
```

Открой http://localhost:3000

### 4. Сборка для продакшена
```bash
npm run build
npm start
```

## Структура проекта

```
app/
  page.tsx           # Главная страница
  catalog/page.tsx   # Каталог с фильтрами
  product/[id]/      # Страница товара
  checkout/page.tsx  # Оформление заказа
  layout.tsx         # Root layout (Navbar + Footer)
  globals.css        # Глобальные стили

components/
  layout/            # Navbar, Footer
  home/              # Секции главной страницы
  catalog/           # Sidebar с фильтрами
  ui/                # ProductCard и другие UI-компоненты

lib/
  types.ts           # TypeScript типы
  mockData.ts        # Моковые данные
  utils.ts           # Утилиты
```

## Стек
- Next.js 14 (App Router)
- TailwindCSS
- Framer Motion
- TypeScript
- Lucide React (иконки)
