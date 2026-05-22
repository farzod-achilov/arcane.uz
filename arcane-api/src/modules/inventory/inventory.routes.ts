import { Router } from 'express';
import { getInventory, claimReward, getDropHistory } from './inventory.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

router.get('/',           authenticate, getInventory);
router.post('/:id/claim', authenticate, claimReward);
router.get('/history',    authenticate, getDropHistory);

export default router;
