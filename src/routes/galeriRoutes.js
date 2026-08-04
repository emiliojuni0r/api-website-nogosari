import express from 'express';
import {
    getKategoriGaleri, createKategoriGaleri, updateKategoriGaleri, deleteKategoriGaleri,
    getGaleri, createGaleri, deleteGaleri
} from '../controllers/galeriController.js';
import { authMiddleware } from '../middleware/auth.js';
import { uploadGaleriImage } from '../middleware/upload.js';

const router = express.Router();

// Kategori Galeri
router.get('/kategori', getKategoriGaleri);
router.post('/kategori', authMiddleware, createKategoriGaleri);
router.put('/kategori/:id', authMiddleware, updateKategoriGaleri);
router.delete('/kategori/:id', authMiddleware, deleteKategoriGaleri);

// Data Galeri Utama
router.get('/', getGaleri);
router.post('/', authMiddleware, uploadGaleriImage, createGaleri);
router.delete('/:id', authMiddleware, deleteGaleri);

export default router;