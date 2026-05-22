import { Router } from 'express';
import {
  listGames, getGame, getHotGames, getSyncStats,
  adminForceSync, adminRefreshPrices, adminUpdateGame,
  adminTriggerJob, adminJobStatus,
} from './games.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireAdmin } from '../../middlewares/admin.middleware';
import { dropRateLimit } from '../../middlewares/rateLimit.middleware';

const router = Router();

// ── Public ────────────────────────────────────────────────────────────────────
router.get('/',           dropRateLimit, listGames);
router.get('/hot',        getHotGames);
router.get('/sync/stats', getSyncStats);
router.get('/:id',        getGame);

// ── Admin ─────────────────────────────────────────────────────────────────────
router.post('/admin/sync',           authenticate, requireAdmin, adminForceSync);
router.post('/admin/refresh-prices', authenticate, requireAdmin, adminRefreshPrices);
router.patch('/admin/:id',           authenticate, requireAdmin, adminUpdateGame);
router.get('/admin/jobs',            authenticate, requireAdmin, adminJobStatus);
router.post('/admin/jobs/:name/run', authenticate, requireAdmin, adminTriggerJob);

export default router;
