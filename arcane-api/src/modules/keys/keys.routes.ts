import { Router } from 'express';
import {
  importKeys, addKey, getStats, getAnalytics, listKeys,
  moveKeys, disableKeys, manualDeliver, checkStock,
  purchaseDeliver, dropDeliver,
} from './keys.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireAdmin } from '../../middlewares/admin.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { dropRateLimit } from '../../middlewares/rateLimit.middleware';
import {
  importKeysSchema, addKeySchema, moveKeysSchema, disableKeysSchema,
} from './keys.schema';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ── Admin-only routes ─────────────────────────────────────────────────────────

router.post(
  '/admin/import',
  requireAdmin,
  validate(importKeysSchema),
  importKeys
);

router.post(
  '/admin/add',
  requireAdmin,
  validate(addKeySchema),
  addKey
);

router.get(
  '/admin/stats',
  requireAdmin,
  getStats
);

router.get(
  '/admin/analytics',
  requireAdmin,
  getAnalytics
);

router.get(
  '/admin/list/:gameId',
  requireAdmin,
  listKeys
);

router.post(
  '/admin/move',
  requireAdmin,
  validate(moveKeysSchema),
  moveKeys
);

router.post(
  '/admin/disable',
  requireAdmin,
  validate(disableKeysSchema),
  disableKeys
);

router.post(
  '/admin/deliver',
  requireAdmin,
  manualDeliver
);

router.get(
  '/admin/stock/:gameId',
  requireAdmin,
  checkStock
);

// ── Authenticated user routes ─────────────────────────────────────────────────

router.post(
  '/deliver/purchase',
  dropRateLimit,
  purchaseDeliver
);

router.post(
  '/deliver/drop',
  dropRateLimit,
  dropDeliver
);

export default router;
