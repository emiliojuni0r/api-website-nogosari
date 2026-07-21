import express from 'express';
import {
    getProfil, updateProfil,
    getPerangkat, createPerangkat, updatePerangkat, deletePerangkat
} from '../controllers/profilController.js';
import { authMiddleware } from '../middleware/auth.js';
import { uploadProfilImages, uploadPerangkatImage } from '../middleware/upload.js';

const router = express.Router();

// --- PUBLIC ROUTES (Web Desa) ---
router.get('/', getProfil);
router.get('/perangkat', getPerangkat);

// --- PROTECTED ROUTES (Dashboard Admin) ---
// Profil Utama (Gunakan PUT untuk Update/Upsert data tunggal)
router.put('/', authMiddleware, uploadProfilImages, updateProfil);

// CRUD Perangkat Desa
router.post('/perangkat', authMiddleware, uploadPerangkatImage, createPerangkat);
router.put('/perangkat/:id', authMiddleware, uploadPerangkatImage, updatePerangkat);
router.delete('/perangkat/:id', authMiddleware, deletePerangkat);

export default router;