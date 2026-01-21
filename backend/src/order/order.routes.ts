import { Router } from 'express';
import { createOrder, listOrders, getOrder } from './order.controller.js';
import { sanitizeOrderInput } from '../shared/middleware/sanitizeOrder.js';
import { verifyToken } from '../shared/middleware/verifytoken.js';
import { verifyAdmin } from '../shared/middleware/verifyAdmin.js';

export const orderRouter = Router();

// Público: compra como invitado
orderRouter.post('/', sanitizeOrderInput, createOrder);

// Admin: ver pedidos
orderRouter.get('/', verifyToken, verifyAdmin, listOrders);
orderRouter.get('/:id', verifyToken, verifyAdmin, getOrder);

export default orderRouter;
