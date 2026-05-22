import { Request, Response, NextFunction } from 'express';
import { usersService } from './users.service';
import { ok, paginated } from '../../utils/response';

export const getMyProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await usersService.findById(req.user!.userId);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    res.json(ok(user));
  } catch (err) { next(err); }
};

export const getPublicProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await usersService.findByUsername(req.params.username);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    res.json(ok(user));
  } catch (err) { next(err); }
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await usersService.updateProfile(req.user!.userId, req.body);
    res.json(ok(user, 'Profile updated'));
  } catch (err) { next(err); }
};

export const getTransactions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await usersService.getTransactionHistory(
      req.user!.userId,
      Number(req.query.page) || 1,
      Math.min(Number(req.query.limit) || 20, 50)
    );
    res.json(paginated(result.data, result.pagination));
  } catch (err) { next(err); }
};

export const getLeaderboard = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const board = await usersService.getLeaderboard(50);
    res.json(ok(board));
  } catch (err) { next(err); }
};

// Admin controllers
export const adminListUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await usersService.listUsers(
      Number(req.query.page) || 1,
      Math.min(Number(req.query.limit) || 20, 100),
      req.query.search as string | undefined
    );
    res.json(paginated(result.data, result.pagination));
  } catch (err) { next(err); }
};

export const adminBanUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await usersService.banUser(req.params.id, req.body.reason || 'No reason provided');
    res.json(ok(null, 'User banned'));
  } catch (err) { next(err); }
};

export const adminUnbanUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await usersService.unbanUser(req.params.id);
    res.json(ok(null, 'User unbanned'));
  } catch (err) { next(err); }
};

export const adminGrantCoins = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await usersService.grantCoins(req.params.id, req.body.amount);
    res.json(ok(result, `${result.granted} ARC coins granted`));
  } catch (err) { next(err); }
};
