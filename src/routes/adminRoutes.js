import express from 'express';
import { loginAdmin, getMe } from '../controllers/adminController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// --- PUBLIC ROUTE ---
// Frontend (Web Admin) akan menembak endpoint ini saat submit form login
// Endpoint asli: POST /api/admin/login
router.post('/login', loginAdmin);


// --- PROTECTED ROUTE ---
// Endpoint ini berguna untuk frontend memvalidasi apakah token di LocalStorage masih aktif
// Endpoint asli: GET /api/admin/me
router.get('/me', authMiddleware, getMe);

export default router;