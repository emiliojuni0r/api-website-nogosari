import express from 'express';
import {
    getPotensi, getPotensiById,
    createPotensi, updatePotensi, deletePotensi
} from '../controllers/potensiController.js';
import { authMiddleware } from '../middleware/auth.js';
import { uploadPotensiImages } from '../middleware/upload.js';

const router = express.Router();

// --- PUBLIC ROUTES (Web Desa) ---
router.get('/', getPotensi);
router.get('/:id', getPotensiById);

// --- PROTECTED ROUTES (Dashboard Admin) ---
router.post('/', authMiddleware, uploadPotensiImages, createPotensi);
router.put('/:id', authMiddleware, uploadPotensiImages, updatePotensi);
router.delete('/:id', authMiddleware, deletePotensi);

export default router;