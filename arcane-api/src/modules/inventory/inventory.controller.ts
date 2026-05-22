import { Request, Response, NextFunction } from 'express';
import { InventoryStatus } from '@prisma/client';
import { inventoryService } from './inventory.service';
import { ok, paginated } from '../../utils/response';

export const getInventory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, page, limit } = req.query;
    const result = await inventoryService.getUserInventory(
      req.user!.userId,
      status as InventoryStatus | undefined,
      Number(page) || 1,
      Math.min(Number(limit) || 20, 50)
    );
    res.json(paginated(result.data, result.pagination));
  } catch (err) { next(err); }
};

export const claimReward = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const item = await inventoryService.claim(req.user!.userId, req.params.id);
    res.json(ok(item, 'Reward claimed'));
  } catch (err) { next(err); }
};

export const getDropHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = req.query;
    const result = await inventoryService.getDropHistory(
      req.user!.userId,
      Number(page) || 1,
      Math.min(Number(limit) || 20, 50)
    );
    res.json(paginated(result.data, result.pagination));
  } catch (err) { next(err); }
};
