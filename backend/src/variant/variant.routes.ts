import { Router } from 'express';
import { findAll, findOne, add, update, remove } from './variant.controller.js';
import { sanitizeVariantInput } from '../shared/middleware/sanitizeVariant.js';
import { verifyToken } from '../shared/middleware/verifytoken.js';
import { verifyAdmin } from '../shared/middleware/verifyAdmin.js';

export const variantRouter = Router();

variantRouter.get('/', findAll);
variantRouter.get('/:id', findOne);

variantRouter.post('/', verifyToken, verifyAdmin, sanitizeVariantInput, add);
variantRouter.put('/:id', verifyToken, verifyAdmin, sanitizeVariantInput, update);
variantRouter.patch('/:id', verifyToken, verifyAdmin, sanitizeVariantInput, update);
variantRouter.delete('/:id', verifyToken, verifyAdmin, remove);

export default variantRouter;
