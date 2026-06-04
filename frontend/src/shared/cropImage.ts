import type { Area } from 'react-easy-crop';

function loadImage(imageSrc: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.src = imageSrc;
  });
}

function getCroppedFileName(originalName: string) {
  const baseName = originalName.replace(/\.[^.]+$/, '') || 'image';
  return `${baseName}-cropped.jpg`;
}

export async function getCroppedImage(file: File, crop: Area): Promise<File> {
  const imageUrl = URL.createObjectURL(file);

  try {
    const image = await loadImage(imageUrl);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No se pudo preparar el recorte de la imagen');
    }

    canvas.width = Math.max(1, Math.round(crop.width));
    canvas.height = Math.max(1, Math.round(crop.height));

    ctx.drawImage(
      image,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      0,
      0,
      canvas.width,
      canvas.height,
    );

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (output) => {
          if (!output) {
            reject(new Error('No se pudo exportar la imagen recortada'));
            return;
          }
          resolve(output);
        },
        'image/jpeg',
        0.95,
      );
    });

    return new File([blob], getCroppedFileName(file.name), { type: 'image/jpeg' });
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}