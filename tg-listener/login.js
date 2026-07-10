/* Одноразовый интерактивный вход: получает строку сессии для index.js.
   Запуск: npm run login (нужны TG_API_ID и TG_API_HASH в .env) */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
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

  // The session string grants full access to this Telegram account (read every
  // chat, send messages, etc). Write it straight to a gitignored file instead
  // of the terminal, so it doesn't linger in scrollback/tmux history/screen
  // recordings — the operator still has to copy it into .env by hand.
  const session   = client.session.save();
  const outPath   = path.join(__dirname, '.tg-session.local');
  fs.writeFileSync(outPath, `TG_SESSION=${session}\n`, { mode: 0o600 });

  console.log('\n⚠️  Строка сессии — это полный доступ к вашему Telegram-аккаунту.');
  console.log(`    Записана в ${outPath} (права 600, не коммитить).`);
  console.log('    Перенесите строку в .env, затем удалите этот файл:');
  console.log(`    cat ${outPath} >> .env && rm ${outPath}\n`);

  await client.disconnect();
  process.exit(0);
})();
