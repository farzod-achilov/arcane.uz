import { Resend } from 'resend';
import { formatPrice } from '@/lib/utils';

const FROM     = process.env.EMAIL_FROM ?? 'ARCANE.UZ <noreply@arcane.com.uz>';
const SITE_URL = 'https://arcane.com.uz';

async function send(to: string, subject: string, html: string): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  try {
    const resend = new Resend(key);
    await resend.emails.send({ from: FROM, to, subject, html });
  } catch { /* non-fatal */ }
}

/* ── Base layout ──────────────────────────────────────────────────────────── */
function layout(content: string): string {
  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>ARCANE.UZ</title>
</head>
<body style="margin:0;padding:0;background:#05040B;font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#05040B;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <!-- Logo header -->
        <tr>
          <td style="background:linear-gradient(135deg,#0D0D1A,#12121F);border-radius:16px 16px 0 0;padding:28px 32px;border-bottom:1px solid rgba(124,58,237,0.2);">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <div style="display:inline-flex;align-items:center;gap:10px;">
                    <div style="width:36px;height:36px;background:linear-gradient(135deg,#7C3AED,#5B21B6);border-radius:10px;display:inline-block;text-align:center;line-height:36px;">
                      <span style="color:#fff;font-size:16px;font-weight:bold;">A</span>
                    </div>
                    <span style="color:#fff;font-size:18px;font-weight:bold;letter-spacing:0.04em;">ARCANE<span style="color:#7C3AED;">.UZ</span></span>
                  </div>
                </td>
                <td align="right">
                  <span style="color:#374151;font-size:11px;">Игровой магазин</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Content -->
        <tr>
          <td style="background:#0D0D1A;padding:32px;">
            ${content}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#080812;border-radius:0 0 16px 16px;padding:20px 32px;border-top:1px solid rgba(255,255,255,0.05);">
            <p style="margin:0;color:#374151;font-size:11px;text-align:center;">
              © ${new Date().getFullYear()} ARCANE.UZ ·
              <a href="${SITE_URL}/support" style="color:#7C3AED;text-decoration:none;">Поддержка</a> ·
              <a href="${SITE_URL}/faq" style="color:#7C3AED;text-decoration:none;">FAQ</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function btn(href: string, text: string, color = '#7C3AED'): string {
  return `<a href="${href}" style="display:inline-block;background:linear-gradient(135deg,${color},${color}CC);color:#fff;font-weight:600;font-size:14px;padding:12px 28px;border-radius:12px;text-decoration:none;margin-top:8px;">${text}</a>`;
}

function tag(text: string, color: string): string {
  return `<span style="display:inline-block;background:${color}18;color:${color};font-size:11px;font-weight:600;padding:3px 10px;border-radius:6px;border:1px solid ${color}30;">${text}</span>`;
}

/* ── 1. Welcome email ─────────────────────────────────────────────────────── */
export async function sendWelcomeEmail(to: string, username: string): Promise<void> {
  const html = layout(`
    <h1 style="margin:0 0 8px;color:#fff;font-size:24px;font-weight:700;">
      Добро пожаловать, ${username}! 🎮
    </h1>
    <p style="margin:0 0 24px;color:#6B7280;font-size:14px;line-height:1.6;">
      Твой аккаунт на ARCANE.UZ успешно создан. Тебя ждут тысячи игр по лучшим ценам в Узбекистане.
    </p>

    <div style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.2);border-radius:14px;padding:20px;margin-bottom:24px;">
      <p style="margin:0 0 4px;color:#F59E0B;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;">Приветственный бонус</p>
      <p style="margin:0;color:#FCD34D;font-size:28px;font-weight:700;">⚡ 500 ARC Coins</p>
      <p style="margin:4px 0 0;color:#6B7280;font-size:12px;">Уже зачислены на твой счёт</p>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td width="32%" style="background:rgba(124,58,237,0.08);border:1px solid rgba(124,58,237,0.15);border-radius:12px;padding:16px;text-align:center;">
          <p style="margin:0 0 4px;color:#A78BFA;font-size:20px;">🎮</p>
          <p style="margin:0;color:#fff;font-size:12px;font-weight:600;">Каталог игр</p>
        </td>
        <td width="4%"></td>
        <td width="32%" style="background:rgba(6,182,212,0.08);border:1px solid rgba(6,182,212,0.15);border-radius:12px;padding:16px;text-align:center;">
          <p style="margin:0 0 4px;color:#67E8F9;font-size:20px;">📦</p>
          <p style="margin:0;color:#fff;font-size:12px;font-weight:600;">Быстрая доставка</p>
        </td>
        <td width="4%"></td>
        <td width="28%" style="background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.15);border-radius:12px;padding:16px;text-align:center;">
          <p style="margin:0 0 4px;color:#4ADE80;font-size:20px;">🔑</p>
          <p style="margin:0;color:#fff;font-size:12px;font-weight:600;">Честные цены</p>
        </td>
      </tr>
    </table>

    <div style="text-align:center;">
      ${btn(`${SITE_URL}/catalog`, 'Перейти в каталог')}
    </div>
  `);

  await send(to, 'Добро пожаловать в ARCANE.UZ! 🎮', html);
}

/* ── 2. Order confirmation ────────────────────────────────────────────────── */
export async function sendOrderConfirmationEmail(params: {
  to:         string;
  username:   string;
  orderId:    string;
  items:      { title: string; price: number }[];
  totalPrice: number;
}): Promise<void> {
  const { to, username, orderId, items, totalPrice } = params;

  const itemRows = items.map(i => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);color:#D1D5DB;font-size:13px;">${i.title}</td>
      <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);color:#A78BFA;font-size:13px;text-align:right;font-weight:600;">${formatPrice(i.price)}</td>
    </tr>
  `).join('');

  const html = layout(`
    <p style="margin:0 0 4px;color:#7C3AED;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;">Подтверждение заказа</p>
    <h1 style="margin:0 0 6px;color:#fff;font-size:22px;font-weight:700;">Заказ принят, ${username}!</h1>
    <p style="margin:0 0 24px;color:#6B7280;font-size:14px;">
      Мы получили твой заказ и уже обрабатываем его. Ключ активации появится в библиотеке.
    </p>

    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:20px;margin-bottom:24px;">
      <p style="margin:0 0 12px;color:#374151;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;">Состав заказа</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${itemRows}
        <tr>
          <td style="padding:12px 0 0;color:#9CA3AF;font-size:13px;font-weight:600;">Итого</td>
          <td style="padding:12px 0 0;color:#fff;font-size:16px;font-weight:700;text-align:right;">${formatPrice(totalPrice)}</td>
        </tr>
      </table>
    </div>

    <div style="margin-bottom:24px;">
      <p style="margin:0 0 6px;color:#374151;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;">Номер заказа</p>
      <code style="color:#A78BFA;font-size:13px;background:rgba(124,58,237,0.1);padding:6px 12px;border-radius:8px;">${orderId}</code>
    </div>

    <div style="background:rgba(6,182,212,0.06);border:1px solid rgba(6,182,212,0.15);border-radius:12px;padding:16px;margin-bottom:24px;">
      <p style="margin:0;color:#67E8F9;font-size:13px;">
        ⏱ После подтверждения оплаты ключ появится в <a href="${SITE_URL}/library" style="color:#06B6D4;text-decoration:underline;">Моей библиотеке</a>.
        Среднее время: до 30 минут.
      </p>
    </div>

    <div style="text-align:center;">
      ${btn(`${SITE_URL}/library`, 'Моя библиотека', '#06B6D4')}
    </div>
  `);

  await send(to, `Заказ #${orderId.slice(0, 8)} подтверждён — ARCANE.UZ`, html);
}

/* ── 3. Price drop wishlist ──────────────────────────────────────────────── */
export async function sendPriceDropEmail(params: {
  to:        string;
  username:  string;
  gameTitle: string;
  gameSlug:  string;
  oldPrice:  number;
  newPrice:  number;
  savePct:   number;
}): Promise<void> {
  const { to, username, gameTitle, gameSlug, oldPrice, newPrice, savePct } = params;
  const gameUrl = `${SITE_URL}/games/${gameSlug}`;

  const html = layout(`
    <div style="text-align:center;margin-bottom:24px;">
      <div style="display:inline-flex;align-items:center;justify-content:center;width:52px;height:52px;background:linear-gradient(135deg,rgba(34,197,94,0.2),rgba(34,197,94,0.06));border:1px solid rgba(34,197,94,0.3);border-radius:14px;font-size:22px;margin-bottom:14px;">📉</div>
      <h1 style="margin:0 0 6px;color:#fff;font-size:22px;font-weight:700;">Цена снижена!</h1>
      <p style="margin:0;color:#6B7280;font-size:14px;">Игра из вашего вишлиста подешевела, ${username}</p>
    </div>

    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:20px;margin-bottom:20px;">
      <p style="margin:0 0 12px;color:#374151;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;">Игра</p>
      <p style="margin:0 0 16px;color:#fff;font-size:17px;font-weight:700;">${gameTitle}</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:10px 14px;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.15);border-radius:10px;text-align:center;">
            <p style="margin:0 0 2px;color:#374151;font-size:10px;text-transform:uppercase;letter-spacing:0.07em;">Было</p>
            <p style="margin:0;color:#F87171;font-size:15px;font-weight:600;text-decoration:line-through;">${formatPrice(oldPrice)}</p>
          </td>
          <td style="width:32px;text-align:center;color:#4B5563;font-size:16px;">→</td>
          <td style="padding:10px 14px;background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.25);border-radius:10px;text-align:center;">
            <p style="margin:0 0 2px;color:#374151;font-size:10px;text-transform:uppercase;letter-spacing:0.07em;">Стало</p>
            <p style="margin:0;color:#4ADE80;font-size:15px;font-weight:700;">${formatPrice(newPrice)}</p>
          </td>
        </tr>
      </table>
      <div style="margin-top:12px;text-align:center;">
        ${tag(`Скидка ${savePct}%`, '#22C55E')}
      </div>
    </div>

    <div style="text-align:center;margin-bottom:16px;">
      ${btn(gameUrl, 'Купить сейчас', '#22C55E')}
    </div>
    <p style="margin:0;color:#374151;font-size:11px;text-align:center;">
      Не хотите получать такие письма?
      <a href="${SITE_URL}/profile?tab=settings" style="color:#7C3AED;text-decoration:none;">Отписаться</a>
    </p>
  `);

  await send(to, `📉 Цена снижена: ${gameTitle} — ${formatPrice(newPrice)}`, html);
}

/* ── 4. Key delivery ─────────────────────────────────────────────────────── */
export async function sendKeyDeliveryEmail(params: {
  to:        string;
  username:  string;
  orderId:   string;
  gameTitle: string;
  keyValue?: string;
}): Promise<void> {
  const { to, username, orderId, gameTitle, keyValue } = params;

  const keyBlock = keyValue
    ? `<div style="background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.2);border-radius:14px;padding:20px;margin-bottom:20px;text-align:center;">
        <p style="margin:0 0 8px;color:#374151;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;">Ключ активации</p>
        <code style="color:#4ADE80;font-size:22px;font-weight:700;letter-spacing:0.08em;word-break:break-all;">${keyValue}</code>
        <p style="margin:12px 0 0;color:#6B7280;font-size:12px;">Скопируй ключ и активируй в Steam / платформе</p>
      </div>`
    : `<div style="background:rgba(124,58,237,0.08);border:1px solid rgba(124,58,237,0.2);border-radius:14px;padding:16px;margin-bottom:20px;">
        <p style="margin:0;color:#A78BFA;font-size:13px;">
          🔑 Ключ доступен в <a href="${SITE_URL}/library" style="color:#7C3AED;font-weight:600;">Моей библиотеке</a>
        </p>
      </div>`;

  const instruction = keyValue
    ? `<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:16px;margin-bottom:24px;">
        <p style="margin:0 0 8px;color:#9CA3AF;font-size:12px;font-weight:600;">Как активировать (Steam):</p>
        <ol style="margin:0;padding-left:20px;color:#6B7280;font-size:12px;line-height:1.8;">
          <li>Открой Steam → Игры → Активировать продукт в Steam</li>
          <li>Введи ключ: <code style="color:#4ADE80;">${keyValue}</code></li>
          <li>Игра появится в библиотеке</li>
        </ol>
      </div>`
    : '';

  const html = layout(`
    <div style="text-align:center;margin-bottom:28px;">
      <div style="width:56px;height:56px;background:linear-gradient(135deg,rgba(34,197,94,0.2),rgba(34,197,94,0.08));border:1px solid rgba(34,197,94,0.3);border-radius:16px;display:inline-flex;align-items:center;justify-content:center;font-size:24px;margin-bottom:16px;">✅</div>
      <h1 style="margin:0 0 6px;color:#fff;font-size:22px;font-weight:700;">Заказ выполнен!</h1>
      <p style="margin:0;color:#6B7280;font-size:14px;">Привет, ${username}! Твоя игра готова.</p>
    </div>

    <div style="margin-bottom:16px;">
      <p style="margin:0 0 4px;color:#374151;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;">Игра</p>
      <p style="margin:0;color:#fff;font-size:16px;font-weight:600;">${gameTitle}</p>
    </div>

    ${keyBlock}
    ${instruction}

    <div style="text-align:center;">
      ${btn(`${SITE_URL}/library`, 'Открыть библиотеку', '#22C55E')}
    </div>

    <p style="margin:20px 0 0;color:#374151;font-size:12px;text-align:center;">
      Проблемы с активацией?
      <a href="${SITE_URL}/support" style="color:#7C3AED;text-decoration:none;">Напишите в поддержку</a>
    </p>
  `);

  await send(to, `🔑 Ключ готов: ${gameTitle} — ARCANE.UZ`, html);
}

/* ── Password reset ───────────────────────────────────────────────────────── */
export async function sendPasswordResetEmail(params: {
  to: string; username: string; resetUrl: string;
}): Promise<void> {
  const { to, username, resetUrl } = params;
  const html = layout(`
    <h1 style="margin:0 0 8px;color:#fff;font-size:22px;font-weight:700;">Сброс пароля</h1>
    <p style="margin:0 0 20px;color:#9CA3AF;font-size:14px;line-height:1.6;">
      Привет, <b style="color:#fff;">${username}</b>! Мы получили запрос на сброс пароля.
      Нажмите кнопку ниже — ссылка действительна <b style="color:#fff;">1 час</b>.
    </p>

    <div style="background:rgba(124,58,237,0.07);border:1px solid rgba(124,58,237,0.2);border-radius:12px;padding:20px;margin-bottom:20px;text-align:center;">
      ${btn(resetUrl, 'Сбросить пароль', '#7C3AED')}
    </div>

    <p style="margin:0 0 8px;color:#4B5563;font-size:12px;">
      Если кнопка не работает, скопируйте ссылку в браузер:
    </p>
    <p style="margin:0;color:#7C3AED;font-size:11px;word-break:break-all;">${resetUrl}</p>

    <p style="margin:20px 0 0;color:#374151;font-size:12px;">
      Если вы не запрашивали сброс — просто проигнорируйте это письмо. Ваш пароль останется прежним.
    </p>
  `);

  await send(to, '🔐 Сброс пароля — ARCANE.UZ', html);
}
