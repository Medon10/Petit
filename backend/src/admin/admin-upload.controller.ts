import { Request, Response } from 'express';

export function uploadImage(req: Request, res: Response) {
  if (!(req as any).file) {
    return res.status(400).json({ message: 'Archivo requerido' });
  }

  const file = (req as any).file as Express.Multer.File;
  const url = `/uploads/${file.filename}`;

  return res.status(201).json({
    message: 'Archivo subido',
    data: {
      url,
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    },
  });
}
