import { Request, Response } from 'express';

import { createShippingQuote } from './shipping.service.js';

export async function quoteShipping(req: Request, res: Response) {
  try {
    const input = req.body || {};
    const quote = await createShippingQuote(input);
    return res.status(200).json({ message: 'Cotizacion generada', data: quote });
  } catch (error: any) {
    const status = Number(error?.status) || 400;
    return res.status(status).json({
      message: error?.message || 'No se pudo generar la cotizacion de envio.',
      code: error?.code,
    });
  }
}
