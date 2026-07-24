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


// 
// 

// Konfigurasi storage untuk gambar Profil & Perangkat
const storageProfil = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/profil/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const uploadProfil = multer({
    storage: storageProfil,
    limits: { fileSize: 2 * 1024 * 1024 }, // Maksimal 2MB
    fileFilter: fileFilter // menggunakan fileFilter yang sama dengan artikel
});

// 1. Upload untuk Profil Desa (Menangkap 2 field gambar berbeda sekaligus)
export const uploadProfilImages = uploadProfil.fields([
    { name: 'sejarahImage', maxCount: 1 },
    { name: 'baganOrganisasi', maxCount: 1 }
]);

// 2. Upload untuk Foto Perangkat Desa
export const uploadPerangkatImage = uploadProfil.single('photo');

// 
// 

// Konfigurasi storage untuk gambar di Homepage (Sambutan & Carousel)
const storageHomepage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/homepage/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const uploadHomepage = multer({
    storage: storageHomepage,
    limits: { fileSize: 10 * 1024 * 1024 }, // Maksimal 2MB
    fileFilter: fileFilter // filter tipe gambar yang sama
});

// Upload untuk Foto Sambutan Kepala Desa
export const uploadSambutanImage = uploadHomepage.single('image');

//
// 

export const uploadCarouselImage = uploadHomepage.single('image');

// 
// 

// Konfigurasi storage untuk gambar Potensi Desa
const storagePotensi = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/potensi/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const uploadPotensi = multer({
    storage: storagePotensi,
    limits: { fileSize: 10 * 1024 * 1024 }, // Maksimal 2MB per gambar
    fileFilter: fileFilter
});

// Menangkap array gambar dengan nama field 'images', maksimal 6 file
export const uploadPotensiImages = uploadPotensi.array('images', 6);

// 
// 

const storagePemetaan = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/pemetaan/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const uploadPemetaan = multer({
    storage: storagePemetaan,
    limits: { fileSize: 20 * 1024 * 1024 }, // Maksimal 20MB khusus untuk peta
    fileFilter: fileFilter
});

// Upload untuk Foto Peta (1 gambar per upload)
export const uploadPetaImage = uploadPemetaan.single('image');


// 
// 

const storageApbdes = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/apbdes/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const uploadApbdes = multer({
    storage: storageApbdes,
    limits: { fileSize: 5 * 1024 * 1024 }, // Limit 5MB agar infografis tidak pecah
    fileFilter: fileFilter
});

// Menangkap 2 field gambar sekaligus untuk APBDES
export const uploadApbdesImages = uploadApbdes.fields([
    { name: 'fotoApbdes', maxCount: 1 },
    { name: 'fotoRealisasi', maxCount: 1 }
]);