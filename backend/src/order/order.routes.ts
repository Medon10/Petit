import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { createOrder, listOrders, getOrder } from './order.controller.js';
import { sanitizeOrderInput } from '../shared/middleware/sanitizeOrder.js';
import { verifyToken } from '../shared/middleware/verifytoken.js';
import { verifyAdmin } from '../shared/middleware/verifyAdmin.js';

export const orderRouter = Router();

const createOrderLimiter = rateLimit({
	windowMs: 60 * 1000,
	limit: 10,
	standardHeaders: true,
	legacyHeaders: false,
	message: { message: 'Demasiados pedidos en poco tiempo. Intenta nuevamente en 1 minuto.' },
});

// Público: compra como invitado
orderRouter.post('/', createOrderLimiter, sanitizeOrderInput, createOrder);

// Admin: ver pedidos
orderRouter.get('/', verifyToken, verifyAdmin, listOrders);
orderRouter.get('/:id', verifyToken, verifyAdmin, getOrder);

export default orderRouter;
