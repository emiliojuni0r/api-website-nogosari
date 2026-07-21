import express from 'express';
import { 
    getCategories, 
    createCategory, 
    updateCategory, 
    deleteCategory 
} from '../controllers/categoryArtikelController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// --- PUBLIC ROUTE ---
router.get('/', getCategories);

// --- PROTECTED ROUTES (Admin) ---
router.post('/', authMiddleware, createCategory);
router.put('/:id', authMiddleware, updateCategory);
router.delete('/:id', authMiddleware, deleteCategory);

export default router;