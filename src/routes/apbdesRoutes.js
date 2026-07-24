import express from 'express';
import { getApbdes, updateApbdes } from '../controllers/apbdesController.js';
import { authMiddleware } from '../middleware/auth.js';
import { uploadApbdesImages } from '../middleware/upload.js';

const router = express.Router();

// --- PUBLIC ROUTE (Web Desa) ---
router.get('/', getApbdes);

// --- PROTECTED ROUTE (Dashboard Admin) ---
router.put('/', authMiddleware, uploadApbdesImages, updateApbdes);

export default router;