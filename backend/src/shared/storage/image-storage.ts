import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

export type ImageStorageDriver = 'local' | 's3';

export type StoreImageInput = {
  fileName: string;
  buffer: Buffer;
  contentType?: string;
  cacheControl?: string;
};

export type StoredImage = {
  key: string;
  url: string;
  size: number;
  contentType: string;
};

const DEFAULT_CACHE_CONTROL = 'public, max-age=31536000, immutable';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const localUploadsDir = path.join(__dirname, '..', '..', '..', 'public', 'uploads');

let s3Client: S3Client | null = null;

function normalizeFileName(fileName: string): string {
  const normalized = String(fileName || '').replace(/\\/g, '/').replace(/^\/+/, '');

  if (!normalized) {
    throw new Error('fileName is required');
  }

  if (normalized.includes('..')) {
    throw new Error('fileName cannot contain parent directory traversal');
  }

  return normalized;
}

function normalizePrefix(prefix: string | undefined): string {
  return String(prefix ?? 'uploads').replace(/^\/+|\/+$/g, '');
}

function resolveDriver(): ImageStorageDriver {
  const raw = String(process.env.IMAGE_STORAGE_DRIVER || 'local').toLowerCase().trim();
  return raw === 's3' ? 's3' : 'local';
}

function joinUrl(base: string, key: string): string {
  return `${base.replace(/\/+$/, '')}/${key.replace(/^\/+/, '')}`;
}

function parseBool(value: string | undefined, fallback: boolean): boolean {
  if (value == null) return fallback;
  const normalized = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return fallback;
}

function getS3Client(): S3Client {
  if (s3Client) return s3Client;

  const region = process.env.S3_REGION || 'auto';
  const endpoint = process.env.S3_ENDPOINT || undefined;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;

  const hasStaticCredentials = Boolean(accessKeyId && secretAccessKey);

  s3Client = new S3Client({
    region,
    endpoint,
    forcePathStyle: parseBool(process.env.S3_FORCE_PATH_STYLE, false),
    credentials: hasStaticCredentials
      ? {
          accessKeyId: accessKeyId as string,
          secretAccessKey: secretAccessKey as string,
        }
      : undefined,
  });

  return s3Client;
}

function assertS3Config() {
  const missing: string[] = [];

  if (!process.env.S3_BUCKET) missing.push('S3_BUCKET');
  if (!process.env.IMAGE_STORAGE_PUBLIC_BASE_URL) missing.push('IMAGE_STORAGE_PUBLIC_BASE_URL');

  if (!process.env.S3_ACCESS_KEY_ID) missing.push('S3_ACCESS_KEY_ID');
  if (!process.env.S3_SECRET_ACCESS_KEY) missing.push('S3_SECRET_ACCESS_KEY');

  if (missing.length > 0) {
    throw new Error(`Missing required S3 image storage env vars: ${missing.join(', ')}`);
  }
}

async function storeLocal(input: StoreImageInput): Promise<StoredImage> {
  const normalizedFileName = normalizeFileName(input.fileName);
  const contentType = input.contentType || 'application/octet-stream';

  const outputPath = path.join(localUploadsDir, ...normalizedFileName.split('/'));
  await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.promises.writeFile(outputPath, input.buffer);

  return {
    key: normalizedFileName,
    url: `/uploads/${normalizedFileName}`,
    size: input.buffer.length,
    contentType,
  };
}

async function storeS3(input: StoreImageInput): Promise<StoredImage> {
  assertS3Config();

  const normalizedFileName = normalizeFileName(input.fileName);
  const prefix = normalizePrefix(process.env.IMAGE_STORAGE_PREFIX);
  const key = prefix ? `${prefix}/${normalizedFileName}` : normalizedFileName;
  const contentType = input.contentType || 'application/octet-stream';
  const cacheControl = input.cacheControl || DEFAULT_CACHE_CONTROL;

  const bucket = process.env.S3_BUCKET as string;
  const publicBaseUrl = process.env.IMAGE_STORAGE_PUBLIC_BASE_URL as string;

  await getS3Client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: input.buffer,
      ContentType: contentType,
      CacheControl: cacheControl,
    })
  );

  return {
    key,
    url: joinUrl(publicBaseUrl, key),
    size: input.buffer.length,
    contentType,
  };
}

export function getImageStorageDriver(): ImageStorageDriver {
  return resolveDriver();
}

export async function storeImage(input: StoreImageInput): Promise<StoredImage> {
  if (resolveDriver() === 's3') {
    return storeS3(input);
  }
  return storeLocal(input);
}
