import express from 'express';
import { getRegulasi, createRegulasi, deleteRegulasi } from '../controllers/regulasiController.js';
import { authMiddleware } from '../middleware/auth.js';
import { uploadRegulasiFile } from '../middleware/upload.js';

const router = express.Router();

router.get('/', getRegulasi);
router.post('/', authMiddleware, uploadRegulasiFile, createRegulasi);
router.delete('/:id', authMiddleware, deleteRegulasi);

export default router;