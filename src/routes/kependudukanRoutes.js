import express from 'express';
import multer from 'multer';
import { getKependudukanData, uploadKependudukanExcel } from '../controllers/kependudukanController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Konfigurasi Multer khusus menyimpan berkas di memori sementara (RAM)
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const ext = file.originalname.split('.').pop();
        if (ext !== 'xlsx' && ext !== 'xls') {
            return cb(new Error('Hanya diperbolehkan mengunggah berkas Excel (.xlsx / .xls)'), false);
        }
        cb(null, true);
    }
});

// --- PUBLIC ROUTES (Web Desa) ---
router.get('/', getKependudukanData);

// --- PROTECTED ROUTES (Dashboard Admin) ---
router.post('/upload', authMiddleware, upload.single('file_excel'), uploadKependudukanExcel);

export default router;