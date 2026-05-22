import { Router } from 'express';
import { register, login, refresh, logout, me } from './auth.controller';
import { validate } from '../../middlewares/validate.middleware';
import { authenticate } from '../../middlewares/auth.middleware';
import { authRateLimit } from '../../middlewares/rateLimit.middleware';
import { registerSchema, loginSchema, refreshSchema } from './auth.schema';

const router = Router();

router.post('/register', authRateLimit, validate(registerSchema), register);
router.post('/login',    authRateLimit, validate(loginSchema),    login);
router.post('/refresh',  validate(refreshSchema), refresh);
router.post('/logout',   logout);
router.get('/me',        authenticate, me);

export default router;
