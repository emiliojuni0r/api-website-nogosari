import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';


// Import Rute (folder .src/routes/)
import adminRoutes from './src/routes/adminRoutes.js';
import artikelRoutes from './src/routes/artikelRoutes.js';
import kependudukanRoutes from './src/routes/kependudukanRoutes.js';
import profilRoutes from './src/routes/profilRoutes.js';
import homepageRoutes from './src/routes/homepageRoutes.js';
import potensiRoutes from './src/routes/potensiRoutes.js';
import pemetaanRoutes from './src/routes/pemetaanRoutes.js';
import footerRoutes from './src/routes/footerRoutes.js';
import categoryArtikelRoutes from './src/routes/categoryArtikelRoutes.js';
import apbdesRoutes from './src/routes/apbdesRoutes.js';
import path from 'path';

dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//  MIDDLEWARE GLOBAL (Best Practice Keamanan & Logging *kata gemini)
// app.use(helmet()); // Mengamankan HTTP Headers
// app.use(cors({ origin: '*' })); // Sesuaikan dengan URL frontend Anda nantinya demi keamanan ekstra

app.use(
    helmet({
        crossOriginResourcePolicy: {
            policy: "cross-origin",
        },
    })
);

const allowedOrigins = [
    process.env.FRONTEND_URL,
    process.env.ADMIN_URL,
];

app.use(cors({
    origin: allowedOrigins
}));

app.use(morgan('dev')); // Log setiap request di terminal
app.use(express.json()); // Membaca body request berformat JSON
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// API ROUTES loh y
app.use('/api/admin', adminRoutes);
app.use('/api/artikel', artikelRoutes);
app.use('/api/kependudukan', kependudukanRoutes);
app.use('/api/profildesa', profilRoutes);
app.use('/api/homepage', homepageRoutes);
app.use('/api/potensi', potensiRoutes);
app.use('/api/pemetaan', pemetaanRoutes);
app.use('/api/footer', footerRoutes);
app.use('/api/categoryartikel', categoryArtikelRoutes);
app.use('/api/apbdes', apbdesRoutes);


// CENTRALIZED ERROR HANDLER
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        message: err.message || 'Terjadi kesalahan internal pada server',
    });
});

export default app;