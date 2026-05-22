import { Router } from 'express';
import { getRecentDrops, getOnlineCount, getRareFeed } from './live.controller';

const router = Router();

router.get('/drops',   getRecentDrops);
router.get('/online',  getOnlineCount);
router.get('/rare',    getRareFeed);

export default router;
