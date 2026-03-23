import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { sanitizeAdminLogin } from '../shared/middleware/sanitizeAdminLogin.js';
import { login } from './admin.controller.js';

const router = Router();

const adminLoginLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: 5,
	standardHeaders: true,
	legacyHeaders: false,
	message: { message: 'Demasiados intentos de login. Intenta nuevamente en 15 minutos.' },
});

router.post('/login', adminLoginLimiter, sanitizeAdminLogin, login);

export default router;
