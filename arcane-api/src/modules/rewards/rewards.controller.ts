import { Request, Response, NextFunction } from 'express';
import { rewardsService } from './rewards.service';
import { ok } from '../../utils/response';

export const listRewards = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rewards = await rewardsService.listByDrop(req.params.dropId);
    res.json(ok(rewards));
  } catch (err) { next(err); }
};

export const getReward = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reward = await rewardsService.findById(req.params.id);
    if (!reward) return res.status(404).json({ success: false, error: 'Reward not found' });
    res.json(ok(reward));
  } catch (err) { next(err); }
};

export const sellReward = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await rewardsService.sell(req.user!.userId, req.params.inventoryId);
    res.json(ok(result, `Reward sold for ${result.soldFor} ARC coins`));
  } catch (err) { next(err); }
};

export const adminCreateReward = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reward = await rewardsService.create(req.body);
    res.status(201).json(ok(reward, 'Reward created'));
  } catch (err) { next(err); }
};

export const adminUpdateReward = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reward = await rewardsService.update(req.params.id, req.body);
    res.json(ok(reward, 'Reward updated'));
  } catch (err) { next(err); }
};

export const adminDeleteReward = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await rewardsService.delete(req.params.id);
    res.json(ok(null, 'Reward deactivated'));
  } catch (err) { next(err); }
};
