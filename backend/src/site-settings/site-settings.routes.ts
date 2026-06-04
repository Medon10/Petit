import { Router } from 'express';
import { verifyToken } from '../shared/middleware/verifytoken.js';
import { verifyAdmin } from '../shared/middleware/verifyAdmin.js';
import { readHomeSettings, saveHomeSettings } from './site-settings.controller.js';

export const siteSettingsRouter = Router();

siteSettingsRouter.get('/home', readHomeSettings);
siteSettingsRouter.patch('/home', verifyToken, verifyAdmin, saveHomeSettings);

export default siteSettingsRouter;