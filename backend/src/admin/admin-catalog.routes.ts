import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { verifyToken } from '../shared/middleware/verifytoken.js';
import { verifyAdmin } from '../shared/middleware/verifyAdmin.js';
import { sanitizeProductInput } from '../shared/middleware/sanitizeProduct.js';
import { sanitizeCategoryInput } from '../shared/middleware/sanitizeCategory.js';
import { sanitizeVariantInput } from '../shared/middleware/sanitizeVariant.js';
import { sanitizeExtraInput } from '../shared/middleware/sanitizeExtra.js';
import {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  setProductActive,
  listCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  setCategoryActive,
  listVariants,
  getVariant,
  createVariant,
  updateVariant,
  deleteVariant,
  setVariantActive,
  listExtras,
  getExtra,
  createExtra,
  updateExtra,
  deleteExtra,
  setExtraActive,
  listOrders,
  getOrder,
  updateOrderStatus,
} from './admin-catalog.controller.js';
import { uploadImage } from './admin-upload.controller.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', '..', 'public', 'uploads');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    fs.mkdirSync(uploadsDir, { recursive: true });
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const safeExt = ext.toLowerCase();
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.mimetype)) return cb(new Error('Formato de imagen no permitido'));
    return cb(null, true);
  },
});

export const adminCatalogRouter = Router();

// All admin routes require authentication
adminCatalogRouter.use(verifyToken, verifyAdmin);

// ── Products ────────────────────────────────────────────────
adminCatalogRouter.get('/products', listProducts);
adminCatalogRouter.get('/products/:id', getProduct);
adminCatalogRouter.post('/products', sanitizeProductInput, createProduct);
adminCatalogRouter.put('/products/:id', sanitizeProductInput, updateProduct);
adminCatalogRouter.patch('/products/:id', sanitizeProductInput, updateProduct);
adminCatalogRouter.patch('/products/:id/active', setProductActive);
adminCatalogRouter.delete('/products/:id', deleteProduct);

// ── Categories ──────────────────────────────────────────────
adminCatalogRouter.get('/categories', listCategories);
adminCatalogRouter.get('/categories/:id', getCategory);
adminCatalogRouter.post('/categories', sanitizeCategoryInput, createCategory);
adminCatalogRouter.put('/categories/:id', sanitizeCategoryInput, updateCategory);
adminCatalogRouter.patch('/categories/:id', sanitizeCategoryInput, updateCategory);
adminCatalogRouter.patch('/categories/:id/active', setCategoryActive);
adminCatalogRouter.delete('/categories/:id', deleteCategory);

// ── Variants ────────────────────────────────────────────────
adminCatalogRouter.get('/variants', listVariants);
adminCatalogRouter.get('/variants/:id', getVariant);
adminCatalogRouter.post('/variants', sanitizeVariantInput, createVariant);
adminCatalogRouter.put('/variants/:id', sanitizeVariantInput, updateVariant);
adminCatalogRouter.patch('/variants/:id', sanitizeVariantInput, updateVariant);
adminCatalogRouter.patch('/variants/:id/active', setVariantActive);
adminCatalogRouter.delete('/variants/:id', deleteVariant);

// ── Extras ──────────────────────────────────────────────────
adminCatalogRouter.get('/extras', listExtras);
adminCatalogRouter.get('/extras/:id', getExtra);
adminCatalogRouter.post('/extras', sanitizeExtraInput, createExtra);
adminCatalogRouter.put('/extras/:id', sanitizeExtraInput, updateExtra);
adminCatalogRouter.patch('/extras/:id', sanitizeExtraInput, updateExtra);
adminCatalogRouter.patch('/extras/:id/active', setExtraActive);
adminCatalogRouter.delete('/extras/:id', deleteExtra);

// ── Orders ──────────────────────────────────────────────────
adminCatalogRouter.get('/orders', listOrders);
adminCatalogRouter.get('/orders/:id', getOrder);
adminCatalogRouter.patch('/orders/:id/status', updateOrderStatus);

// ── Uploads ─────────────────────────────────────────────────
adminCatalogRouter.post('/uploads', upload.single('image'), uploadImage);

export default adminCatalogRouter;
