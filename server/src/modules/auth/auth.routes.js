import { Router } from 'express';
import { validate } from '../../shared/middlewares/validate.middleware.js';
import { requireAuth } from '../../shared/middlewares/auth.middleware.js';
import { registerSchema, loginSchema } from './auth.validation.js';
import * as authController from './auth.controller.js';

const router = Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', requireAuth, authController.me);

export default router;
