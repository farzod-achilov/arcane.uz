/* Одноразовый интерактивный вход: получает строку сессии для index.js.
   Запуск: npm run login (нужны TG_API_ID и TG_API_HASH в .env) */

require('dotenv').config();
const { TelegramClient } = require('telegram');
const { StringSession }  = require('telegram/sessions');
const input = require('input');

(async () => {
  const apiId   = parseInt(process.env.TG_API_ID ?? '', 10);
  const apiHash = process.env.TG_API_HASH ?? '';
  if (!apiId || !apiHash) {
    console.error('Заполните TG_API_ID и TG_API_HASH в .env (my.telegram.org → API development tools)');
    process.exit(1);
  }

  const client = new TelegramClient(new StringSession(''), apiId, apiHash, { connectionRetries: 3 });
  await client.start({
    phoneNumber: async () => input.text('Номер телефона (+998...): '),
    password:    async () => input.text('Пароль 2FA (Enter, если нет): '),
    phoneCode:   async () => input.text('Код из Telegram: '),
    onError:     (e) => console.error(e),
  });

  console.log('\nГотово. Добавьте строку в .env:\n');
  console.log('TG_SESSION=' + client.session.save());
  await client.disconnect();
  process.exit(0);
})();
