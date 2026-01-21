import { Router } from 'express';
import { findAll, findOne, add, update, remove } from './category.controller.js';
import { sanitizeCategoryInput } from '../shared/middleware/sanitizeCategory.js';
import { verifyToken } from '../shared/middleware/verifytoken.js';
import { verifyAdmin } from '../shared/middleware/verifyAdmin.js';

export const categoryRouter = Router();

categoryRouter.get('/', findAll);
categoryRouter.get('/:id', findOne);

categoryRouter.post('/', verifyToken, verifyAdmin, sanitizeCategoryInput, add);
categoryRouter.put('/:id', verifyToken, verifyAdmin, sanitizeCategoryInput, update);
categoryRouter.patch('/:id', verifyToken, verifyAdmin, sanitizeCategoryInput, update);
categoryRouter.delete('/:id', verifyToken, verifyAdmin, remove);

export default categoryRouter;
