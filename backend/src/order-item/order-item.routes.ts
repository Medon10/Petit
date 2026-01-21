import { Router } from 'express';
import { findAll, findOne } from './order-item.controller.js';
import { verifyToken } from '../shared/middleware/verifytoken.js';
import { verifyAdmin } from '../shared/middleware/verifyAdmin.js';

export const orderItemRouter = Router();

// Admin: ver items
orderItemRouter.get('/', verifyToken, verifyAdmin, findAll);
orderItemRouter.get('/:id', verifyToken, verifyAdmin, findOne);

export default orderItemRouter;
