import { Request, Response, NextFunction } from 'express';
import { KeyStatus } from '@prisma/client';
import { keysService } from './keys.service';
import { getKeyAnalytics } from './keys.analytics';
import {
  deliverStoreKey,
  deliverDropKey,
  deliverManualKey,
  hasStockFor,
} from './keys.delivery';
import { ok, paginated } from '../../utils/response';

// ── Admin: import bulk keys ───────────────────────────────────────────────────

export const importKeys = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await keysService.importKeys(req.body, req.user!.userId);
    res.status(201).json(
      ok(result, `Imported ${result.imported} keys (${result.duplicates} duplicates skipped)`)
    );
  } catch (err) { next(err); }
};

// ── Admin: add single key ─────────────────────────────────────────────────────

export const addKey = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const key = await keysService.addSingleKey(req.body, req.user!.userId);
    res.status(201).json(ok(key, 'Key added successfully'));
  } catch (err) { next(err); }
};

// ── Admin: get inventory stats ────────────────────────────────────────────────

export const getStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const gameId = req.query.gameId as string | undefined;
    const stats = await keysService.getStats(gameId);
    res.json(ok(stats));
  } catch (err) { next(err); }
};

// ── Admin: analytics dashboard ────────────────────────────────────────────────

export const getAnalytics = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const analytics = await getKeyAnalytics();
    res.json(ok(analytics));
  } catch (err) { next(err); }
};

// ── Admin: list keys for a game ───────────────────────────────────────────────

export const listKeys = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { gameId } = req.params;
    const status = req.query.status as KeyStatus | undefined;
    const page = Number(req.query.page) || 1;
    const limit = Math.min(Number(req.query.limit) || 50, 200);

    const result = await keysService.listKeys(gameId, status, page, limit);
    res.json(paginated(result.data, result.pagination));
  } catch (err) { next(err); }
};

// ── Admin: move keys between types ───────────────────────────────────────────

export const moveKeys = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await keysService.moveKeys(req.body, req.user!.userId);
    res.json(ok(result, `Moved ${result.moved} keys from ${result.fromType} → ${result.toType}`));
  } catch (err) { next(err); }
};

// ── Admin: disable keys ───────────────────────────────────────────────────────

export const disableKeys = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await keysService.disableKeys(req.body, req.user!.userId);
    res.json(ok(result, `${result.disabled} keys disabled`));
  } catch (err) { next(err); }
};

// ── Admin: manual delivery ────────────────────────────────────────────────────

export const manualDeliver = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { gameId, userId, reason } = req.body;
    const result = await deliverManualKey(gameId, userId, req.user!.userId, reason ?? 'Admin manual delivery');
    // Log the plaintext key in response — admin UI must display and forget
    res.json(ok({
      keyId: result.keyId,
      gameTitle: result.gameTitle,
      steamKey: result.plaintextKey,    // shown once
      deliveredTo: userId,
      deliveredAt: result.deliveredAt,
    }, 'Key manually delivered'));
  } catch (err) { next(err); }
};

// ── Admin: stock check ────────────────────────────────────────────────────────

export const checkStock = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { gameId } = req.params;
    const [storeOk, dropOk] = await Promise.all([
      hasStockFor(gameId, 'STORE'),
      hasStockFor(gameId, 'DROP'),
    ]);
    res.json(ok({ gameId, store: storeOk, drop: dropOk }));
  } catch (err) { next(err); }
};

// ── Internal: store purchase delivery (called from checkout service) ──────────

export const purchaseDeliver = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { gameId, orderId } = req.body;
    const userId = req.user!.userId;

    const result = await deliverStoreKey(gameId, userId, orderId);

    res.json(ok({
      keyId: result.keyId,
      gameTitle: result.gameTitle,
      steamKey: result.plaintextKey,    // shown once to buyer
      deliveredAt: result.deliveredAt,
    }, 'Your Steam key is ready!'));
  } catch (err) { next(err); }
};

// ── Internal: drop reward delivery ───────────────────────────────────────────

export const dropDeliver = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { gameId, inventoryId } = req.body;
    const userId = req.user!.userId;

    const result = await deliverDropKey(gameId, userId, inventoryId);

    res.json(ok({
      keyId: result.keyId,
      gameTitle: result.gameTitle,
      steamKey: result.plaintextKey,
      deliveredAt: result.deliveredAt,
    }, 'Drop reward delivered!'));
  } catch (err) { next(err); }
};
