import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { ok } from '../../utils/response';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tokens = await authService.register(
      req.body,
      req.ip,
      req.headers['user-agent']
    );
    res.status(201).json(ok(tokens, 'Registration successful'));
  } catch (err) {
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tokens = await authService.login(req.body, req.ip, req.headers['user-agent']);
    res.json(ok(tokens, 'Login successful'));
  } catch (err) {
    next(err);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await authService.refresh(req.body.refreshToken);
    res.json(ok(result));
  } catch (err) {
    next(err);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await authService.logout(req.body.refreshToken);
    res.json(ok(null, 'Logged out'));
  } catch (err) {
    next(err);
  }
};

export const me = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.user!;
    const { prisma } = await import('../../lib/prisma');
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, username: true, email: true, avatar: true,
        level: true, xp: true, arcCoins: true, streak: true,
        totalDrops: true, createdAt: true,
      },
    });
    res.json(ok(user));
  } catch (err) {
    next(err);
  }
};
