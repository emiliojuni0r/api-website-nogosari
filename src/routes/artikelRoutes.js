import express from 'express';
import { getArticles, getArticleBySlug, createArticle, updateArticle, deleteArticle } from '../controllers/artikelController.js';
import { authMiddleware } from '../middleware/auth.js';
import { uploadArticleImage } from '../middleware/upload.js';

const router = express.Router();

// --- PUBLIC ROUTES (Web Desa - Bebas Akses) ---
router.get('/', getArticles);
router.get('/:slug', getArticleBySlug);

// --- PROTECTED ROUTES (Dashboard Admin - Butuh Login) ---
router.post('/', authMiddleware, uploadArticleImage, createArticle);
router.put('/:id', authMiddleware, uploadArticleImage, updateArticle);
router.delete('/:id', authMiddleware, deleteArticle);

export default router;