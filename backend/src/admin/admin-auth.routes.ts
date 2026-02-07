import { Router } from 'express';
import { sanitizeAdminLogin } from '../shared/middleware/sanitizeAdminLogin.js';
import { login } from './admin.controller.js';

const router = Router();

router.post('/login', sanitizeAdminLogin, login);

export default router;
