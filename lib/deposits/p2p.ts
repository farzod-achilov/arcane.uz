/* ─────────────────────────────────────────────────────────
   P2P deposit service — перевод на карту с уникальной суммой.

   Схема: пользователь просит base-сумму → выдаём карту из пула
   + уникальную сумму (base + 1..999 сум) + дедлайн. Перевод
   идентифицируется по точной сумме: SMS-hook или админ
   подтверждают, баланс пополняется на фактическую сумму.
───────────────────────────────────────────────────────── */

import { prisma } from '@/lib/prisma';
import { createNotification } from '@/lib/notifications';

export const DEPOSIT_TTL_MINUTES = Math.max(3, parseInt(process.env.DEPOSIT_TTL_MINUTES ?? '10', 10) || 10);

/** Окно после истечения таймера, в котором «опоздавший» перевод ещё матчится */
const LATE_MATCH_MINUTES = 60;

export interface AssignedCard {
  id:         string;
  cardNumber: string;
  holderName: string;
  bank:       string | null;
}

/** Активная карта с наименьшим числом висящих PENDING-заявок */
export async function pickCard(): Promise<AssignedCard | null> {
  const cards = await prisma.payment_cards.findMany({
    where:   { isActive: true },
    orderBy: { priority: 'desc' },
    select:  {
      id: true, cardNumber: true, holderName: true, bank: true,
      _count: { select: { deposit_requests: { where: { status: 'PENDING' } } } },
    },
  });
  if (cards.length === 0) return null;

  let best = cards[0];
  for (const c of cards) {
    if (c._count.deposit_requests < best._count.deposit_requests) best = c;
  }
  return { id: best.id, cardNumber: best.cardNumber, holderName: best.holderName, bank: best.bank };
}

/**
 * base + 1..999 сум, не совпадающая ни с одной активной PENDING-заявкой.
 * Глобальная уникальность — SMS не всегда содержит номер карты.
 */
export async function generateUniqueAmount(base: number): Promise<number> {
  for (let attempt = 0; attempt < 25; attempt++) {
    const candidate = base + (Math.floor(Math.random() * 999) + 1);
    const clash = await prisma.deposit_requests.findFirst({
      where:  { uniqueAmount: candidate, status: 'PENDING' },
      select: { id: true },
    });
    if (!clash) return candidate;
  }
  throw new Error('Не удалось подобрать уникальную сумму');
}

/** Просроченные PENDING → EXPIRED (вызывается лениво из статуса/хуков) */
export async function expireStaleDeposits(): Promise<void> {
  await prisma.deposit_requests.updateMany({
    where: { status: 'PENDING', expiresAt: { not: null, lt: new Date() } },
    data:  { status: 'EXPIRED', updatedAt: new Date() },
  });
}

/**
 * Атомарное подтверждение: статус APPROVED + зачисление на баланс.
 * Зачисляется фактическая сумма перевода (uniqueAmount), не base.
 * EXPIRED тоже можно подтвердить — деньги могли прийти с опозданием.
 */
export async function approveDeposit(
  depositId: string,
  via: 'admin' | 'sms',
  comment?: string,
) {
  return prisma.$transaction(async (tx) => {
    const updated = await tx.deposit_requests.updateMany({
      where: { id: depositId, status: { in: ['PENDING', 'EXPIRED'] } },
      data:  {
        status:       'APPROVED',
        confirmedVia: via,
        comment:      comment ?? null,
        updatedAt:    new Date(),
      },
    });
    if (updated.count === 0) return null; // уже обработан — защита от двойного зачисления

    const deposit = await tx.deposit_requests.findUniqueOrThrow({
      where:   { id: depositId },
      include: { users: { select: { id: true, username: true, email: true } }, card: true },
    });

    const credit = deposit.uniqueAmount ?? deposit.amount;
    await tx.users.update({
      where: { id: deposit.userId },
      data:  { balanceUzs: { increment: credit } },
    });

    return { deposit, credit };
  }).then(async (result) => {
    if (result) {
      await createNotification(result.deposit.userId, {
        type:  'coins',
        title: 'Баланс пополнен',
        body:  `Зачислено ${new Intl.NumberFormat('uz-UZ').format(result.credit)} сум`,
        href:  '/profile?tab=deposits',
      });
    }
    return result;
  });
}

/** Часовой пояс времени операции в уведомлениях банка (Ташкент = +5) */
const TRANSFER_TZ_OFFSET_HOURS = parseFloat(process.env.TRANSFER_TZ_OFFSET_HOURS ?? '5');

/**
 * Время операции из текста уведомления: «09.07.26 13:42» → Date (UTC).
 * null, если даты в тексте нет.
 */
export function extractSmsTimestamp(text: string): Date | null {
  const m = text.match(/(\d{2})\.(\d{2})\.(\d{2,4})[ ,]+(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const [, dd, MM, yy, hh, min] = m;
  const year = yy.length === 2 ? 2000 + parseInt(yy, 10) : parseInt(yy, 10);
  const utcMs = Date.UTC(
    year, parseInt(MM, 10) - 1, parseInt(dd, 10),
    parseInt(hh, 10) - TRANSFER_TZ_OFFSET_HOURS, parseInt(min, 10),
  );
  const d = new Date(utcMs);
  return Number.isFinite(d.getTime()) ? d : null;
}

/** Все целые «суммы» из текста SMS: «100 347.00 UZS», «100347,00», «100 347» */
export function extractAmountCandidates(text: string): number[] {
  const out: number[] = [];
  // внутри числа допустимы только пробелы/nbsp — перенос строки разделяет числа
  const re = /\d[\d  ]*(?:[.,]\d{1,2})?/g;
  for (const match of text.match(re) ?? []) {
    const normalized = match.replace(/[  ]+/g, '');
    const intPart = normalized.split(/[.,]/)[0];
    const value = parseInt(intPart, 10);
    // минимальный депозит 10 000, отсекаем даты/время/последние цифры карт
    if (Number.isFinite(value) && value >= 10_000 && value <= 100_000_000 && !out.includes(value)) {
      out.push(value);
    }
  }
  return out;
}

/**
 * Ищет заявку под суммы из SMS: сначала активные PENDING,
 * затем недавно истёкшие (перевод мог прийти после таймера).
 */
export async function matchSmsToDeposit(text: string) {
  const candidates = extractAmountCandidates(text);
  if (candidates.length === 0) return null;

  const pending = await prisma.deposit_requests.findFirst({
    where:   { status: 'PENDING', uniqueAmount: { in: candidates } },
    orderBy: { createdAt: 'asc' },
  });
  if (pending) return pending;

  const lateWindow = new Date(Date.now() - LATE_MATCH_MINUTES * 60_000);
  return prisma.deposit_requests.findFirst({
    where:   { status: 'EXPIRED', uniqueAmount: { in: candidates }, expiresAt: { gte: lateWindow } },
    orderBy: { createdAt: 'asc' },
  });
}
