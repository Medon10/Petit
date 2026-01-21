import { Router } from 'express';
import { findAll, findOne } from './order-item-extra.controller.js';
import { verifyToken } from '../shared/middleware/verifytoken.js';
import { verifyAdmin } from '../shared/middleware/verifyAdmin.js';

export const orderItemExtraRouter = Router();

// Admin: ver extras de items
orderItemExtraRouter.get('/', verifyToken, verifyAdmin, findAll);
orderItemExtraRouter.get('/:id', verifyToken, verifyAdmin, findOne);

export default orderItemExtraRouter;
