import express from 'express';
import { getFooter, updateFooter } from '../controllers/footerController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// --- PUBLIC ROUTE (Web Desa) ---
router.get('/', getFooter);

// --- PROTECTED ROUTE (Dashboard Admin) ---
router.put('/', authMiddleware, updateFooter);

export default router;