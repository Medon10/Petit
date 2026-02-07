import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { verifyToken } from '../shared/middleware/verifytoken.js';
import { verifyAdmin } from '../shared/middleware/verifyAdmin.js';
import {
  listProducts,
  getProduct,
  setProductActive,
  listCategories,
  getCategory,
  setCategoryActive,
  listVariants,
  getVariant,
  setVariantActive,
  listExtras,
  getExtra,
  setExtraActive,
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

adminCatalogRouter.get('/products', verifyToken, verifyAdmin, listProducts);
adminCatalogRouter.get('/products/:id', verifyToken, verifyAdmin, getProduct);
adminCatalogRouter.patch('/products/:id/active', verifyToken, verifyAdmin, setProductActive);

adminCatalogRouter.get('/categories', verifyToken, verifyAdmin, listCategories);
adminCatalogRouter.get('/categories/:id', verifyToken, verifyAdmin, getCategory);
adminCatalogRouter.patch('/categories/:id/active', verifyToken, verifyAdmin, setCategoryActive);

adminCatalogRouter.get('/variants', verifyToken, verifyAdmin, listVariants);
adminCatalogRouter.get('/variants/:id', verifyToken, verifyAdmin, getVariant);
adminCatalogRouter.patch('/variants/:id/active', verifyToken, verifyAdmin, setVariantActive);

adminCatalogRouter.get('/extras', verifyToken, verifyAdmin, listExtras);
adminCatalogRouter.get('/extras/:id', verifyToken, verifyAdmin, getExtra);
adminCatalogRouter.patch('/extras/:id/active', verifyToken, verifyAdmin, setExtraActive);

adminCatalogRouter.post('/uploads', verifyToken, verifyAdmin, upload.single('image'), uploadImage);

export default adminCatalogRouter;
