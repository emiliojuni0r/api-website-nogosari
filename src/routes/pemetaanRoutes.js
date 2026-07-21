import express from 'express';
import {
    getBatasWilayah, updateBatasWilayah,
    getPeta, createPeta, updatePeta, deletePeta
} from '../controllers/pemetaanController.js';
import { authMiddleware } from '../middleware/auth.js';
import { uploadPetaImage } from '../middleware/upload.js';

const router = express.Router();

// =======================
// BATAS WILAYAH (Teks)
// =======================
router.get('/batas', getBatasWilayah);
router.put('/batas', authMiddleware, updateBatasWilayah); // Upsert batas wilayah

// =======================
// PETA DESA (Gambar)
// =======================
router.get('/peta', getPeta);
router.post('/peta', authMiddleware, uploadPetaImage, createPeta);
router.put('/peta/:id', authMiddleware, uploadPetaImage, updatePeta);
router.delete('/peta/:id', authMiddleware, deletePeta);

export default router;