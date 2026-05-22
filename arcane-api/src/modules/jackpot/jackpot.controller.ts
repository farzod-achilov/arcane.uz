import { Request, Response, NextFunction } from 'express';
import { jackpotService } from './jackpot.service';
import { ok } from '../../utils/response';

export const getJackpot = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const jackpot = await jackpotService.getJackpot();
    res.json(ok(jackpot));
  } catch (err) { next(err); }
};

export const getWinners = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const winners = await jackpotService.getRecentWinners(10);
    res.json(ok(winners));
  } catch (err) { next(err); }
};

export const adminAwardJackpot = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await jackpotService.awardJackpot(req.params.userId);
    res.json(ok(result, `Jackpot of ${result.amount} ARC coins awarded to ${result.winner}`));
  } catch (err) { next(err); }
};
