import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

// Import Rute (Nanti dibuat di folder routes/)
import adminRoutes from './src/routes/adminRoutes.js';
import artikelRoutes from './src/routes/artikelRoutes.js';
import kependudukanRoutes from './src/routes/kependudukanRoutes.js';

const app = express();

// --- MIDDLEWARE GLOBAL (Best Practice Keamanan & Logging) ---
app.use(helmet()); // Mengamankan HTTP Headers
app.use(cors({ origin: '*' })); // Sesuaikan dengan URL frontend Anda nantinya demi keamanan ekstra
app.use(morgan('dev')); // Log setiap request di terminal
app.use(express.json()); // Membaca body request berformat JSON
app.use(express.urlencoded({ extended: true }));

// --- PENDAFTARAN RUTE API ---
app.use('/api/admin', adminRoutes);
app.use('/api/artikel', artikelRoutes);
app.use('/api/kependudukan', kependudukanRoutes);

// --- CENTRALIZED ERROR HANDLER ---
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        message: err.message || 'Terjadi kesalahan internal pada server',
    });
});

export default app;