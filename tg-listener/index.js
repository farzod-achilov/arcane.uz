/* ─────────────────────────────────────────────────────────
   ARCANE.UZ tg-listener

   MTProto-клиент на личном аккаунте: читает сообщения
   карточного бота (уведомления «Perevod na kartu») и
   пересылает текст в webhook /api/deposit/sms-hook, где
   заявка матчится по уникальной сумме и зачисляется.

   Наш собственный бот так не может: Bot API не отдаёт ботам
   сообщения других ботов — поэтому слушаем аккаунтом.
───────────────────────────────────────────────────────── */

require('dotenv').config();
const { TelegramClient } = require('telegram');
const { StringSession }  = require('telegram/sessions');
const { NewMessage }     = require('telegram/events');

const apiId   = parseInt(process.env.TG_API_ID ?? '', 10);
const apiHash = process.env.TG_API_HASH ?? '';
const session = process.env.TG_SESSION ?? '';
const webhook = process.env.WEBHOOK_URL ?? 'http://localhost:3000/api/deposit/sms-hook';
const secret  = process.env.SMS_HOOK_SECRET ?? '';
const sources = (process.env.SOURCE_CHATS ?? '')
  .split(',')
  .map(s => s.trim().replace(/^@/, '').toLowerCase())
  .filter(Boolean);

if (!apiId || !apiHash || !session) {
  console.error('Нужны TG_API_ID, TG_API_HASH и TG_SESSION (получить: npm run login)');
  process.exit(1);
}
if (!secret) {
  console.error('Нужен SMS_HOOK_SECRET — тот же, что в .env.local сайта');
  process.exit(1);
}
if (sources.length === 0) {
  console.warn('SOURCE_CHATS пуст — будут пересылаться сообщения из ВСЕХ чатов с ботами');
}

const ts = () => new Date().toISOString().slice(0, 19).replace('T', ' ');

async function postToWebhook(text, sender) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res  = await fetch(webhook, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'x-sms-secret': secret },
        body:    JSON.stringify({ text, sender }),
      });
      const data = await res.json().catch(() => ({}));
      console.log(`${ts()} → webhook ${res.status} ${JSON.stringify(data)}`);
      if (res.ok) return;
    } catch (e) {
      console.error(`${ts()} webhook недоступен (попытка ${attempt}): ${e.message}`);
    }
    await new Promise(r => setTimeout(r, attempt * 2000));
  }
}

(async () => {
  const client = new TelegramClient(new StringSession(session), apiId, apiHash, {
    connectionRetries: Number.MAX_SAFE_INTEGER,
  });
  await client.connect();

  const me = await client.getMe();
  console.log(`${ts()} tg-listener запущен как @${me.username ?? me.firstName}; источники: ${sources.join(', ') || '(все боты)'}`);

  client.addEventHandler(async (event) => {
    const msg = event.message;
    if (!msg || !msg.text) return;

    let chat;
    try { chat = await msg.getChat(); } catch { return; }

    const uname = (chat?.username ?? '').toLowerCase();
    const id    = String(chat?.id ?? '');
    const isBot = Boolean(chat?.bot);
    const match = sources.length > 0 ? (sources.includes(uname) || sources.includes(id)) : isBot;
    if (!match) return;

    console.log(`${ts()} @${uname || id}: ${msg.text.slice(0, 140).replace(/\n/g, ' | ')}`);
    await postToWebhook(msg.text, uname || id);
  }, new NewMessage({ incoming: true }));
})();
