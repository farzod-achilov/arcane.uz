import { Request, Response, NextFunction } from 'express';
import { liveService } from './live.service';
import { ok } from '../../utils/response';

export const getRecentDrops = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const drops = await liveService.getRecentDrops(limit);
    res.json(ok(drops));
  } catch (err) { next(err); }
};

export const getOnlineCount = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const count = await liveService.getOnlineCount();
    res.json(ok({ online: count }));
  } catch (err) { next(err); }
};

export const getRareFeed = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const feed = await liveService.getRareFeed(10);
    res.json(ok(feed));
  } catch (err) { next(err); }
};
