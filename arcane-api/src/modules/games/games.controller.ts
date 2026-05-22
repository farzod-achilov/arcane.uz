import { Request, Response, NextFunction } from 'express';
import { gamesService } from './games.service';
import { runFullSync, importFromRawg, importFromIgdb, refreshPrices } from './games.import';
import { scheduler } from '../../jobs/scheduler';
import { ok, paginated } from '../../utils/response';

export const listGames = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, genre, platform, minRating, maxPrice, source, page, limit } = req.query;
    const result = await gamesService.list({
      search: search as string,
      genre: genre as string,
      platform: platform as string,
      source: source as string,
      minRating: minRating ? Number(minRating) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Math.min(Number(limit), 100) : 24,
    });
    res.json(paginated(result.data, result.pagination));
  } catch (err) {
    next(err);
  }
};

export const getGame = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const game = await gamesService.findById(req.params.id);
    if (!game) return res.status(404).json({ success: false, message: 'Game not found' });
    res.json(ok(game));
  } catch (err) {
    next(err);
  }
};

export const getHotGames = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const games = await gamesService.getHotGames();
    res.json(ok(games));
  } catch (err) {
    next(err);
  }
};

export const getSyncStats = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await gamesService.getSyncStats();
    res.json(ok(stats));
  } catch (err) {
    next(err);
  }
};

// ── Admin controllers ─────────────────────────────────────────────────────────

export const adminForceSync = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const source = req.query.source as string | undefined;

    if (source === 'rawg') {
      const result = await importFromRawg();
      return res.json(ok(result, 'RAWG sync complete'));
    }
    if (source === 'igdb') {
      const result = await importFromIgdb();
      return res.json(ok(result, 'IGDB sync complete'));
    }

    // Full sync
    const results = await runFullSync();
    res.json(ok(results, 'Full sync complete'));
  } catch (err) {
    next(err);
  }
};

export const adminRefreshPrices = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const updated = await refreshPrices();
    res.json(ok({ updated }, 'Price refresh complete'));
  } catch (err) {
    next(err);
  }
};

export const adminUpdateGame = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { isActive, priceUsd, priceUzs } = req.body;
    const game = await gamesService.updateGame(id, { isActive, priceUsd, priceUzs });
    res.json(ok(game, 'Game updated'));
  } catch (err) {
    next(err);
  }
};

export const adminTriggerJob = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name } = req.params;
    await scheduler.runNow(name);
    res.json(ok({ triggered: name }, `Job "${name}" executed`));
  } catch (err) {
    next(err);
  }
};

export const adminJobStatus = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(ok(scheduler.status()));
  } catch (err) {
    next(err);
  }
};
