import { Request, Response } from 'express';
import { getHomeSettings, updateHomeSettings } from './site-settings.service.js';

export async function readHomeSettings(_req: Request, res: Response) {
  try {
    const data = await getHomeSettings();
    return res.json({ message: 'Configuración de portada', data });
  } catch (error) {
    return res.status(500).json({ message: 'Error al obtener configuración de portada', error });
  }
}

export async function saveHomeSettings(req: Request, res: Response) {
  try {
    const input = (req.body as any).sanitizedInput || req.body;
    const data = await updateHomeSettings(input);
    return res.status(200).json({ message: 'Configuración de portada actualizada', data });
  } catch (error: any) {
    return res.status(400).json({ message: error?.message || 'Error al actualizar configuración de portada' });
  }
}