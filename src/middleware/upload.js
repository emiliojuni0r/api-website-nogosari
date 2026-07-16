import multer from 'multer';
import path from 'path';

// 1. Tentukan tempat penyimpanan dan nama file
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/articles/'); // File artikel akan disimpan di folder ini
    },
    filename: (req, file, cb) => {
        // Mengubah nama file menjadi unik: tanggal-acak.ekstensi
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// 2. Filter tipe file (Hanya mengizinkan gambar)
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Hanya file gambar yang diperbolehkan! (jpg, jpeg, png, webp)'), false);
    }
};

// 3. Inisialisasi Multer
export const uploadArticleImage = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // Batasi ukuran file maks 2MB
    fileFilter: fileFilter
}).single('thumbnail'); // 'thumbnail' adalah nama key/field yang dikirim dari frontend