import { Router } from 'express';
import { listDrops, getDrop, openDrop, adminCreateDrop, adminUpdateDrop } from './drops.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireAdmin } from '../../middlewares/admin.middleware';
import { dropRateLimit } from '../../middlewares/rateLimit.middleware';

const router = Router();

router.get('/',                    listDrops);
router.get('/:id',                 getDrop);
router.post('/:id/open',           authenticate, dropRateLimit, openDrop);
router.post('/admin',              authenticate, requireAdmin, adminCreateDrop);
router.patch('/admin/:id',         authenticate, requireAdmin, adminUpdateDrop);

export default router;
