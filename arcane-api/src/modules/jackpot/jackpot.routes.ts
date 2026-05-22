import { Router } from 'express';
import { getJackpot, getWinners, adminAwardJackpot } from './jackpot.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireAdmin } from '../../middlewares/admin.middleware';

const router = Router();

router.get('/',                        getJackpot);
router.get('/winners',                 getWinners);
router.post('/admin/award/:userId',    authenticate, requireAdmin, adminAwardJackpot);

export default router;
