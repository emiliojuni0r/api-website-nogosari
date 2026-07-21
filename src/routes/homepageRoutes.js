import express from 'express';
import { createCarousel, deleteCarousel, getCarousels, getSambutan, updateCarousel, updateSambutan } from '../controllers/homepageController.js';
import { authMiddleware } from '../middleware/auth.js';
import { uploadCarouselImage, uploadSambutanImage } from '../middleware/upload.js';

const router = express.Router();

// --- PUBLIC ROUTES (Web Desa) ---
router.get('/sambutan', getSambutan);

// --- PROTECTED ROUTES (Dashboard Admin) ---
// Gunakan PUT karena datanya tunggal (Upsert)
router.put('/sambutan', authMiddleware, uploadSambutanImage, updateSambutan);


// =======================
// CAROUSEL
// =======================
// --- PUBLIC ROUTES ---
router.get('/carousel', getCarousels);

// --- PROTECTED ROUTES (Admin) ---
router.post('/carousel', authMiddleware, uploadCarouselImage, createCarousel);
router.put('/carousel/:id', authMiddleware, uploadCarouselImage, updateCarousel);
router.delete('/carousel/:id', authMiddleware, deleteCarousel);

export default router;