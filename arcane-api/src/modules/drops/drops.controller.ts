import { Request, Response, NextFunction } from 'express';
import { dropsService } from './drops.service';
import { ok } from '../../utils/response';

export const listDrops = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const drops = await dropsService.list();
    res.json(ok(drops));
  } catch (err) { next(err); }
};

export const getDrop = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const drop = await dropsService.findById(req.params.id);
    if (!drop) return res.status(404).json({ success: false, error: 'Drop machine not found' });
    res.json(ok(drop));
  } catch (err) { next(err); }
};

export const openDrop = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await dropsService.openDrop(req.user!.userId, req.params.id);
    res.json(ok(result, `You got a ${result.reward.rarity} reward!`));
  } catch (err) { next(err); }
};

export const adminCreateDrop = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const drop = await dropsService.create(req.body);
    res.status(201).json(ok(drop, 'Drop machine created'));
  } catch (err) { next(err); }
};

export const adminUpdateDrop = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const drop = await dropsService.update(req.params.id, req.body);
    res.json(ok(drop, 'Drop machine updated'));
  } catch (err) { next(err); }
};
