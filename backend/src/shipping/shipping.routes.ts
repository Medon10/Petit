import { Router } from 'express';
import rateLimit from 'express-rate-limit';

import { quoteShipping } from './shipping.controller.js';

const quoteLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Demasiadas cotizaciones en poco tiempo. Intenta nuevamente en 1 minuto.' },
});

export const shippingRouter = Router();

shippingRouter.post('/quotes', quoteLimiter, quoteShipping);

export default shippingRouter;
