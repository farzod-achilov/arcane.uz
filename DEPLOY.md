# Деплой ARCANE.UZ — VPS (Ubuntu) + PM2 + nginx + локальный Postgres

> **Прод уже развёрнут и работает.** Сервер `vds` (89.39.95.250, Ubuntu 24.04):
> код в `/var/www/arcane`, PM2-процесс `arcane` (`npm start`), БД `arcanedb`,
> секреты в `.env.local`. Рядом крутятся `arcane-api`, `arcane-bot`, `n8n`.
> **Для обновления хватает шага [«Обновление»](#обновление-каждый-следующий-деплой)** —
> `./deploy/deploy.sh`. Разделы 1–7 ниже — справка по установке с нуля (новый
> сервер / disaster recovery).

Целевая схема: Next.js (`next start`) под PM2 на `127.0.0.1:3000`, nginx — реверс-прокси с HTTPS, PostgreSQL на том же сервере.

---

## 0. Предпосылки

- VPS с Ubuntu 22.04+, root или sudo-доступ по SSH.
- Домен `arcane.com.uz` указывает A-записью на IP сервера (и `www`).
- Открыты порты `80` и `443` (firewall/ufw).

---

## 1. Системные пакеты

```bash
# Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# PostgreSQL, nginx, git, certbot
sudo apt-get install -y postgresql postgresql-contrib nginx git
sudo apt-get install -y certbot python3-certbot-nginx

# PM2 глобально
sudo npm install -g pm2
```

---

## 2. PostgreSQL — база и пользователь

```bash
sudo -u postgres psql
```
В консоли psql (замени пароль на свой сильный):
```sql
CREATE USER arcane WITH PASSWORD 'СИЛЬНЫЙ_ПАРОЛЬ';
CREATE DATABASE arcanedb OWNER arcane;
GRANT ALL PRIVILEGES ON DATABASE arcanedb TO arcane;
\q
```
Этот пароль пойдёт в `DATABASE_URL`. (Имя БД на проде — `arcanedb`, без подчёркивания.)

---

## 3. Код

```bash
sudo mkdir -p /var/www/arcane && sudo chown $USER:$USER /var/www/arcane
git clone https://github.com/farzod-achilov/arcane.uz.git /var/www/arcane
cd /var/www/arcane

# Каталог логов для PM2
sudo mkdir -p /var/log/arcane && sudo chown $USER:$USER /var/log/arcane
```

---

## 4. Переменные окружения

Секреты на этом сервере лежат в **`.env.local`** (Next грузит его и в проде). Шаблон — `.env.local.example`:
```bash
cp .env.local.example .env.local
nano .env.local
```
Заполни как минимум **обязательные** блоки (см. комментарии в файле):

| Переменная | Чем заполнить |
|---|---|
| `DATABASE_URL` | `postgresql://arcane:ПАРОЛЬ@localhost:5432/arcanedb` |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `NEXTAUTH_URL` / `NEXT_PUBLIC_APP_URL` | `https://arcane.com.uz` |
| `ADMIN_EMAIL` | твой email (`farzodachilov27@gmail.com`) |
| `BOOTSTRAP_SECRET` | `openssl rand -hex 32` |
| `KEY_ENCRYPTION_SECRET` | `openssl rand -hex 32` |
| `RESEND_API_KEY` / `EMAIL_FROM` | из Resend |
| `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` / `NEXT_PUBLIC_TELEGRAM_BOT_ID` | из BotFather |

> ⚠ `NEXT_PUBLIC_*` вшиваются в бандл во время `npm run build`. Они должны быть в файле **до** сборки (шаг 5 это учитывает).

---

## 5. Первая сборка и запуск

```bash
cd /var/www/arcane
chmod +x deploy/deploy.sh
./deploy/deploy.sh
```
Скрипт: `npm ci` → `prisma generate` → `prisma db push` (создаёт таблицы) → `npm run build` → `pm2 start`.

Включи автозапуск PM2 при перезагрузке:
```bash
pm2 save
pm2 startup        # выполни команду, которую он напечатает
```
Проверь, что приложение слушает локально:
```bash
curl -I http://127.0.0.1:3000        # ожидаем 200/307
pm2 logs arcane                       # логи
```

---

## 6. nginx + HTTPS

```bash
sudo cp /var/www/arcane/deploy/nginx.conf /etc/nginx/sites-available/arcane
sudo ln -s /etc/nginx/sites-available/arcane /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default      # убрать дефолт
sudo nginx -t && sudo systemctl reload nginx
```
Выпусти сертификат (certbot сам допишет HTTPS-блок и редирект):
```bash
sudo certbot --nginx -d arcane.com.uz -d www.arcane.com.uz
```
Автопродление уже настроено systemd-таймером certbot. Проверка: `sudo certbot renew --dry-run`.

Открой `https://arcane.com.uz` — сайт должен загрузиться.

---

## 7. Bootstrap первого админа

1. Зарегистрируй на сайте аккаунт с тем email, что в `ADMIN_EMAIL`.
2. Выдай ему права (секрет — из `.env.local`):
```bash
curl -H "x-bootstrap-secret: ТВОЙ_BOOTSTRAP_SECRET" https://arcane.com.uz/api/admin/bootstrap
```
Ожидаемый ответ: `{"ok":true,...}`. **Перезайди** в аккаунт, чтобы права применились. Эндпоинт самоблокируется, как только появился первый админ.

---

## 8. Живой тест (smoke-test)

- [ ] **Регистрация** — создаётся аккаунт, приходит приветственное письмо (+500 ARC).
- [ ] **Каталог** — игры грузятся (если БД наполнена), картинки/CSP без ошибок в консоли.
- [ ] **Заказ** — оформить заказ → в Telegram админа падает уведомление.
- [ ] **Доставка ключа** — в `/admin` выдать ключ → пользователю приходит письмо с ключом.
- [ ] **Health-check** — `curl https://arcane.com.uz/api/health` → `{"status":"ok","db":"ok"}`.

---

## Обновление (каждый следующий деплой)

```bash
cd /var/www/arcane && ./deploy/deploy.sh
```

## Полезное

```bash
pm2 logs arcane          # логи приложения
pm2 restart arcane       # перезапуск
pm2 monit                # мониторинг ресурсов
sudo tail -f /var/log/nginx/error.log
```

## Заметки по архитектуре

- **Один инстанс PM2 (fork).** Приложение хранит состояние в памяти процесса: SSE-уведомления (`/api/notifications/stream`), rate-limit (`lib/rateLimit.ts`), кэш Digiseller. Cluster-режим разорвёт это состояние. Масштабируйся вертикально (больше RAM/CPU), не количеством инстансов.
- **Схема БД — `prisma db push`** (миграций нет). Если перейдёшь на версионные миграции (`prisma migrate`), замени команду в `deploy/deploy.sh` на `prisma migrate deploy`.
- **Бэкапы Postgres** на тебе (локальная БД). Минимум — cron с `pg_dump`:
  ```bash
  0 3 * * * pg_dump -U arcane arcanedb | gzip > /var/backups/arcane_$(date +\%F).sql.gz
  ```
