import { Router } from 'express';
import { findAll, findOne, add, update, remove, bestSellers } from './product.controller.js';
import { sanitizeProductInput } from '../shared/middleware/sanitizeProduct.js';
import { verifyToken } from '../shared/middleware/verifytoken.js';
import { verifyAdmin } from '../shared/middleware/verifyAdmin.js';

export const productRouter = Router();

productRouter.get('/', findAll);
productRouter.get('/best-sellers', bestSellers);
productRouter.get('/:id', findOne);

productRouter.post('/', verifyToken, verifyAdmin, sanitizeProductInput, add);
productRouter.put('/:id', verifyToken, verifyAdmin, sanitizeProductInput, update);
productRouter.patch('/:id', verifyToken, verifyAdmin, sanitizeProductInput, update);
productRouter.delete('/:id', verifyToken, verifyAdmin, remove);

export default productRouter;
