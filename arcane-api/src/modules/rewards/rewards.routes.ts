import { Router } from 'express';
import {
  listRewards, getReward, sellReward,
  adminCreateReward, adminUpdateReward, adminDeleteReward,
} from './rewards.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireAdmin } from '../../middlewares/admin.middleware';

const router = Router();

router.get('/drop/:dropId',                authenticate, listRewards);
router.get('/:id',                         getReward);
router.post('/sell/:inventoryId',          authenticate, sellReward);
router.post('/admin',                      authenticate, requireAdmin, adminCreateReward);
router.patch('/admin/:id',                 authenticate, requireAdmin, adminUpdateReward);
router.delete('/admin/:id',                authenticate, requireAdmin, adminDeleteReward);

export default router;
