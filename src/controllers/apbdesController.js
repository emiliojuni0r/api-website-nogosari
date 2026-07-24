import fs from 'fs';
import path from 'path';
import prisma from '../config/db.js';

// Helper untuk hapus file fisik
const deleteFile = (filePath) => {
    if (!filePath) return;
    const fullPath = path.join(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
    }
};

// 1. GET DATA APBDES (Public)
export const getApbdes = async (req, res) => {
    try {
        const apbdes = await prisma.apbdes.findFirst();

        if (!apbdes) {
            return res.status(200).json({
                message: "Data APBDES belum diatur.",
                data: null
            });
        }

        res.status(200).json({ data: apbdes });
    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil data APBDES." });
    }
};

// 2. UPDATE / CREATE DATA APBDES (Admin)
export const updateApbdes = async (req, res) => {
    try {
        const { narasiApbdes, narasiRealisasi } = req.body;

        const oldApbdes = await prisma.apbdes.findUnique({ where: { id: 1 } });

        let updateData = {
            narasiApbdes: narasiApbdes || oldApbdes?.narasiApbdes || "",
            narasiRealisasi: narasiRealisasi || oldApbdes?.narasiRealisasi || ""
        };

        // Jika admin mengunggah foto APBDES baru
        if (req.files && req.files['fotoApbdes']) {
            updateData.fotoApbdes = `/uploads/apbdes/${req.files['fotoApbdes'][0].filename}`;
            if (oldApbdes?.fotoApbdes) deleteFile(oldApbdes.fotoApbdes); // Hapus foto lama
        }

        // Jika admin mengunggah foto Realisasi baru
        if (req.files && req.files['fotoRealisasi']) {
            updateData.fotoRealisasi = `/uploads/apbdes/${req.files['fotoRealisasi'][0].filename}`;
            if (oldApbdes?.fotoRealisasi) deleteFile(oldApbdes.fotoRealisasi); // Hapus foto lama
        }

        // Jalankan Upsert (Update jika ada ID 1, Create jika belum ada)
        const apbdes = await prisma.apbdes.upsert({
            where: { id: 1 },
            update: updateData,
            create: {
                id: 1,
                narasiApbdes: updateData.narasiApbdes,
                narasiRealisasi: updateData.narasiRealisasi,
                fotoApbdes: updateData.fotoApbdes || "",
                fotoRealisasi: updateData.fotoRealisasi || ""
            }
        });

        res.status(200).json({ message: "Data APBDES berhasil diperbarui", data: apbdes });
    } catch (error) {
        // Hapus file yang terlanjur terupload jika error
        if (req.files && req.files['fotoApbdes']) deleteFile(`/uploads/apbdes/${req.files['fotoApbdes'][0].filename}`);
        if (req.files && req.files['fotoRealisasi']) deleteFile(`/uploads/apbdes/${req.files['fotoRealisasi'][0].filename}`);

        res.status(500).json({ message: "Gagal memperbarui data APBDES", error: error.message });
    }
};