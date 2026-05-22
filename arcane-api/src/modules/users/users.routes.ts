import { Router } from 'express';
import {
  getMyProfile, getPublicProfile, updateProfile,
  getTransactions, getLeaderboard,
  adminListUsers, adminBanUser, adminUnbanUser, adminGrantCoins,
} from './users.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireAdmin } from '../../middlewares/admin.middleware';

const router = Router();

router.get('/me',                  authenticate, getMyProfile);
router.patch('/me',                authenticate, updateProfile);
router.get('/me/transactions',     authenticate, getTransactions);
router.get('/leaderboard',         getLeaderboard);
router.get('/:username',           getPublicProfile);

// Admin
router.get('/admin/list',          authenticate, requireAdmin, adminListUsers);
router.post('/admin/:id/ban',      authenticate, requireAdmin, adminBanUser);
router.post('/admin/:id/unban',    authenticate, requireAdmin, adminUnbanUser);
router.post('/admin/:id/coins',    authenticate, requireAdmin, adminGrantCoins);

export default router;
