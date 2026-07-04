'use client';

import { useDict } from '@/lib/locale/client';

/**
 * Фоновая подложка всего сайта. Один компонент, смонтирован в layout.tsx —
 * работает на всех страницах без правки каждой из них (сами страницы
 * держат свой корневой контейнер прозрачным, см. min-h-screen wrapper'ы).
 *
 * Три слоя вместо плоского чёрного: волна бренд-цветов (тот же градиент,
 * что раньше жил только в секции кейсов на главной), едва заметная сетка
 * (готовый токен grid-lines) и диагональный водяной знак из слоганов
 * тикера навбара — тот же арcade-мотив бренда, но приглушённый до
 * фактуры фона, а не ещё одной ленты новостей: крутится в 4-5 раз
 * медленнее тикера и почти не читается как текст.
 */
export default function SiteBackground() {
  const t    = useDict().nav.ticker;
  const line = [t.number1, t.delivery, t.coins, t.weekly, t.freeShip].join('   ◆   ');

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }} aria-hidden="true">
      {/* Base wash */}
      <div className="absolute inset-0"
        style={{ background: 'linear-gradient(180deg, #0A0A0F 0%, #0B0818 45%, #0A0A0F 100%)' }} />

      {/* Corner glows — тот же язык бренда, что в hero-секциях, но вполовину тише */}
      <div className="absolute -top-[15%] -left-[10%] w-[60vw] h-[60vw] rounded-full"
        style={{ background: '#7C3AED', filter: 'blur(160px)', opacity: 0.05 }} />
      <div className="absolute top-[5%] -right-[15%] w-[50vw] h-[50vw] rounded-full"
        style={{ background: '#06B6D4', filter: 'blur(160px)', opacity: 0.035 }} />
      <div className="absolute -bottom-[20%] left-[15%] w-[55vw] h-[55vw] rounded-full"
        style={{ background: '#7C3AED', filter: 'blur(180px)', opacity: 0.03 }} />

      {/* Едва заметная сетка */}
      <div className="absolute inset-0"
        style={{
          backgroundImage: 'linear-gradient(rgba(124,58,237,1) 1px,transparent 1px),linear-gradient(90deg,rgba(124,58,237,1) 1px,transparent 1px)',
          backgroundSize: '64px 64px', opacity: 0.012,
        }} />

      {/* Диагональный водяной знак — слоганы тикера, очень медленно и очень тихо */}
      <div className="absolute flex items-center" style={{ inset: '-15% -20%', transform: 'rotate(-9deg)' }}>
        <div className="whitespace-nowrap font-pixel site-watermark-scroll"
          style={{ fontSize: 'clamp(20px, 3.2vw, 32px)', letterSpacing: '0.22em', color: 'rgba(124,58,237,0.05)' }}>
          {Array(4).fill(line).join('   ◆   ')}
        </div>
      </div>
    </div>
  );
}
