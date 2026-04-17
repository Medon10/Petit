import { Request, Response } from 'express';
import sharp from 'sharp';
import { getImageStorageDriver, storeImage } from '../shared/storage/image-storage.js';

export async function uploadImage(req: Request, res: Response) {
  if (!(req as any).file) {
    return res.status(400).json({ message: 'Archivo requerido' });
  }

  const file = (req as any).file as Express.Multer.File;

  try {
    const baseName = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const xlFilename = `${baseName}-xl.webp`;
    const smFilename = `${baseName}-sm.webp`;

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

    const [xlStored, smStored] = await Promise.all([
      storeImage({
        fileName: xlFilename,
        buffer: xlProcessed.data,
        contentType: 'image/webp',
      }),
      storeImage({
        fileName: smFilename,
        buffer: smProcessed.data,
        contentType: 'image/webp',
      }),
    ]);

    const xlUrl = xlStored.url;
    const smUrl = smStored.url;

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
        storage: getImageStorageDriver(),
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
