import '../env.js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { Pool } from 'pg';

type ProductRow = {
  id: number;
  image_url: string | null;
  gallery_images: unknown;
};

type VariantRow = {
  id: number;
  image_url: string | null;
};

type MigrationResult = {
  processedFiles: number;
  skippedGeneratedFiles: number;
  failedFiles: number;
  productImageUpdates: number;
  productGalleryUpdates: number;
  variantImageUpdates: number;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..', '..');
const uploadsDir = path.join(projectRoot, 'public', 'uploads');

const MAX_XL = 1800;
const MAX_SM = 600;

function toPosix(relPath: string): string {
  return relPath.replace(/\\/g, '/');
}

function normalizeDbUrl(url: string): string {
  const cleaned = decodeURIComponent(String(url || '').trim())
    .replace(/\\/g, '/')
    .replace(/^https?:\/\/[^/]+/i, '');

  const withPrefix = cleaned.startsWith('/uploads/')
    ? cleaned
    : cleaned.startsWith('uploads/')
      ? `/${cleaned}`
      : cleaned;

  return withPrefix.toLowerCase();
}

function safeBaseName(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'image';
}

function shortHash(input: string): string {
  return crypto.createHash('sha1').update(input).digest('hex').slice(0, 8);
}

function isSourceImage(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('-xl.webp') || lower.endsWith('-sm.webp')) return false;
  return /\.(jpg|jpeg|png|webp|gif|avif)$/i.test(lower);
}

function walkFiles(rootDir: string): string[] {
  const files: string[] = [];

  function walk(current: string) {
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }
      if (entry.isFile()) files.push(fullPath);
    }
  }

  walk(rootDir);
  return files;
}

async function buildWebpVariants(): Promise<{
  mapOldToNewXl: Map<string, string>;
  processedFiles: number;
  skippedGeneratedFiles: number;
  failedFiles: number;
}> {
  const mapOldToNewXl = new Map<string, string>();
  const allFiles = walkFiles(uploadsDir);

  let processedFiles = 0;
  let skippedGeneratedFiles = 0;
  let failedFiles = 0;

  for (const fullPath of allFiles) {
    const rel = toPosix(path.relative(uploadsDir, fullPath));
    const fileName = path.basename(rel);

    if (!isSourceImage(fileName)) {
      if (/-xl\.webp$|-sm\.webp$/i.test(fileName)) skippedGeneratedFiles += 1;
      continue;
    }

    try {
      const relDir = path.dirname(rel) === '.' ? '' : path.dirname(rel);
      const originalBase = path.basename(rel, path.extname(rel));
      const safeBase = safeBaseName(originalBase);
      const hash = shortHash(rel.toLowerCase());

      const xlFile = `${safeBase}-${hash}-xl.webp`;
      const smFile = `${safeBase}-${hash}-sm.webp`;

      const xlFullPath = path.join(uploadsDir, relDir, xlFile);
      const smFullPath = path.join(uploadsDir, relDir, smFile);

      const sourceBuffer = await fs.promises.readFile(fullPath);

      const xl = await sharp(sourceBuffer)
        .rotate()
        .trim({ threshold: 12 })
        .resize({
          width: MAX_XL,
          height: MAX_XL,
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 },
        })
        .webp({ quality: 84, effort: 4, smartSubsample: true })
        .toBuffer();

      const sm = await sharp(sourceBuffer)
        .rotate()
        .trim({ threshold: 12 })
        .resize({
          width: MAX_SM,
          height: MAX_SM,
          fit: 'cover',
          position: sharp.strategy.attention,
        })
        .webp({ quality: 82, effort: 4, smartSubsample: true })
        .toBuffer();

      await Promise.all([
        fs.promises.writeFile(xlFullPath, xl),
        fs.promises.writeFile(smFullPath, sm),
      ]);

      const oldUrl = `/uploads/${rel}`;
      const newXlUrl = `/uploads/${toPosix(path.join(relDir, xlFile))}`;

      mapOldToNewXl.set(normalizeDbUrl(oldUrl), newXlUrl);
      processedFiles += 1;
    } catch (error) {
      failedFiles += 1;
      console.error(`Failed image migration for ${rel}:`, error);
    }
  }

  return { mapOldToNewXl, processedFiles, skippedGeneratedFiles, failedFiles };
}

async function hasColumn(pool: Pool, tableName: string, columnName: string): Promise<boolean> {
  const result = await pool.query(
    `SELECT 1
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = $1
       AND column_name = $2
     LIMIT 1`,
    [tableName, columnName]
  );
  return (result.rowCount ?? 0) > 0;
}

function mapUrl(oldValue: string | null, mapping: Map<string, string>): string | null {
  if (!oldValue) return oldValue;
  const normalized = normalizeDbUrl(oldValue);
  return mapping.get(normalized) ?? oldValue;
}

function parseGallery(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === 'string');
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
    } catch {
      return [];
    }
  }
  return [];
}

async function applyDatabaseUpdates(mapping: Map<string, string>): Promise<{
  productImageUpdates: number;
  productGalleryUpdates: number;
  variantImageUpdates: number;
}> {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'petit',
  });

  let productImageUpdates = 0;
  let productGalleryUpdates = 0;
  let variantImageUpdates = 0;

  try {
    const hasProductGallery = await hasColumn(pool, 'products', 'gallery_images');
    const hasVariantImage = await hasColumn(pool, 'variants', 'image_url');

    await pool.query('BEGIN');

    const productRows = await pool.query<ProductRow>(
      hasProductGallery
        ? 'SELECT id, image_url, gallery_images FROM products'
        : 'SELECT id, image_url, NULL::jsonb AS gallery_images FROM products'
    );

    for (const row of productRows.rows) {
      const newImageUrl = mapUrl(row.image_url, mapping);
      if (newImageUrl !== row.image_url) {
        await pool.query('UPDATE products SET image_url = $1 WHERE id = $2', [newImageUrl, row.id]);
        productImageUpdates += 1;
      }

      if (hasProductGallery) {
        const oldGallery = parseGallery(row.gallery_images);
        if (oldGallery.length > 0) {
          const newGallery = oldGallery.map((item) => mapUrl(item, mapping) ?? item);
          const changed = newGallery.some((item, idx) => item !== oldGallery[idx]);
          if (changed) {
            await pool.query('UPDATE products SET gallery_images = $1::jsonb WHERE id = $2', [JSON.stringify(newGallery), row.id]);
            productGalleryUpdates += 1;
          }
        }
      }
    }

    if (hasVariantImage) {
      const variantRows = await pool.query<VariantRow>('SELECT id, image_url FROM variants');
      for (const row of variantRows.rows) {
        const newImageUrl = mapUrl(row.image_url, mapping);
        if (newImageUrl !== row.image_url) {
          await pool.query('UPDATE variants SET image_url = $1 WHERE id = $2', [newImageUrl, row.id]);
          variantImageUpdates += 1;
        }
      }
    }

    await pool.query('COMMIT');
  } catch (error) {
    await pool.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    await pool.end();
  }

  return { productImageUpdates, productGalleryUpdates, variantImageUpdates };
}

async function main() {
  const applyDb = process.argv.includes('--apply-db');

  if (!fs.existsSync(uploadsDir)) {
    throw new Error(`Uploads directory not found: ${uploadsDir}`);
  }

  console.log('Starting image migration to WebP variants...');
  console.log(`Uploads dir: ${uploadsDir}`);

  const { mapOldToNewXl, processedFiles, skippedGeneratedFiles, failedFiles } = await buildWebpVariants();

  let productImageUpdates = 0;
  let productGalleryUpdates = 0;
  let variantImageUpdates = 0;

  if (applyDb) {
    console.log('Applying DB updates...');
    const dbResult = await applyDatabaseUpdates(mapOldToNewXl);
    productImageUpdates = dbResult.productImageUpdates;
    productGalleryUpdates = dbResult.productGalleryUpdates;
    variantImageUpdates = dbResult.variantImageUpdates;
  } else {
    console.log('Dry run mode for DB. Use --apply-db to update database values.');
  }

  const summary: MigrationResult = {
    processedFiles,
    skippedGeneratedFiles,
    failedFiles,
    productImageUpdates,
    productGalleryUpdates,
    variantImageUpdates,
  };

  const reportPath = path.join(projectRoot, 'docs', 'migrate-uploads-report.json');
  await fs.promises.writeFile(reportPath, JSON.stringify(summary, null, 2), 'utf8');

  console.log('Migration summary:', summary);
  console.log(`Report written to: ${reportPath}`);
}

main().catch((error) => {
  console.error('Migration failed:', error);
  process.exitCode = 1;
});
