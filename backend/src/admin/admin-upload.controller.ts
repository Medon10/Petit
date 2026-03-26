import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', '..', 'public', 'uploads');

export async function uploadImage(req: Request, res: Response) {
  if (!(req as any).file) {
    return res.status(400).json({ message: 'Archivo requerido' });
  }

  const file = (req as any).file as Express.Multer.File;

  try {
    fs.mkdirSync(uploadsDir, { recursive: true });

    const baseName = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const xlFilename = `${baseName}-xl.webp`;
    const smFilename = `${baseName}-sm.webp`;
    const xlOutputPath = path.join(uploadsDir, xlFilename);
    const smOutputPath = path.join(uploadsDir, smFilename);

    const prepared = sharp(file.buffer)
      .rotate()
      .trim({ threshold: 12 });

    const xlProcessed = await prepared
      .resize({
        width: 1800,
        height: 1800,
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 },
      })
      .webp({
        quality: 84,
        effort: 4,
        smartSubsample: true,
      })
      .toBuffer({ resolveWithObject: true });

    const smProcessed = await sharp(file.buffer)
      .rotate()
      .trim({ threshold: 12 })
      .resize({
        width: 600,
        height: 600,
        fit: 'cover',
        position: sharp.strategy.attention,
      })
      .webp({
        quality: 82,
        effort: 4,
        smartSubsample: true,
      })
      .toBuffer({ resolveWithObject: true });

    await Promise.all([
      fs.promises.writeFile(xlOutputPath, xlProcessed.data),
      fs.promises.writeFile(smOutputPath, smProcessed.data),
    ]);

    const xlUrl = `/uploads/${xlFilename}`;
    const smUrl = `/uploads/${smFilename}`;

    return res.status(201).json({
      message: 'Archivo subido',
      data: {
        // Keep compatibility: the previous API only returned `url`.
        // We now return the large version there.
        url: xlUrl,
        filename: xlFilename,
        originalName: file.originalname,
        mimeType: 'image/webp',
        size: xlProcessed.data.length,
        width: xlProcessed.info.width,
        height: xlProcessed.info.height,
        variants: {
          xl: xlUrl,
          sm: smUrl,
        },
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      message: 'Error procesando imagen',
      error: error?.message || 'Unknown error',
    });
  }
}
