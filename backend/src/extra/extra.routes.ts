import { Router } from 'express';
import { findAll, findOne, add, update, remove, getScopes, putScopes } from './extra.controller.js';
import { sanitizeExtraInput } from '../shared/middleware/sanitizeExtra.js';
import { verifyToken } from '../shared/middleware/verifytoken.js';
import { verifyAdmin } from '../shared/middleware/verifyAdmin.js';

export const extraRouter = Router();

extraRouter.get('/', findAll);
extraRouter.get('/:id', findOne);
extraRouter.get('/:id/scopes', getScopes);

extraRouter.post('/', verifyToken, verifyAdmin, sanitizeExtraInput, add);
extraRouter.put('/:id', verifyToken, verifyAdmin, sanitizeExtraInput, update);
extraRouter.patch('/:id', verifyToken, verifyAdmin, sanitizeExtraInput, update);
extraRouter.delete('/:id', verifyToken, verifyAdmin, remove);
extraRouter.put('/:id/scopes', verifyToken, verifyAdmin, putScopes);

export default extraRouter;
