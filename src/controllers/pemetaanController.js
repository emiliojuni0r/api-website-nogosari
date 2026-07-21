import fs from 'fs';
import path from 'path';
import prisma from '../config/db.js';

const deleteFile = (filePath) => {
    if (!filePath) return;
    const fullPath = path.join(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
    }
};

// ==========================================
// 1. BATAS WILAYAH (Teks Saja, Konsep Upsert)
// ==========================================

export const getBatasWilayah = async (req, res) => {
    try {
        const batas = await prisma.batasWilayah.findFirst();
        if (!batas) {
            return res.status(200).json({ message: "Data batas wilayah belum diatur", data: null });
        }
        res.status(200).json({ data: batas });
    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil batas wilayah." });
    }
};

export const updateBatasWilayah = async (req, res) => {
    try {

        console.log(req.body);

        const { utara, timur, selatan, barat } = req.body;

        // Upsert dengan ID tetap 1
        const batas = await prisma.batasWilayah.upsert({
            where: { id: 1 },
            update: {
                utara: utara || "",
                timur: timur || "",
                selatan: selatan || "",
                barat: barat || ""
            },
            create: {
                id: 1,
                utara: utara || "",
                timur: timur || "",
                selatan: selatan || "",
                barat: barat || ""
            }
        });

        res.status(200).json({ message: "Batas wilayah berhasil diperbarui", data: batas });
    } catch (error) {
        res.status(500).json({ message: "Gagal memperbarui batas wilayah.", error: error.message });
    }
};


// ==========================================
// 2. PETA DESA (Gambar, CRUD Standar)
// ==========================================

export const getPeta = async (req, res) => {
    try {
        const peta = await prisma.petaDesa.findMany({
            orderBy: { updatedAt: 'desc' }
        });
        res.status(200).json({ message: "berhasil mendapatkan data peta desa", data: peta });
    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil data peta desa." });
    }
};

export const createPeta = async (req, res) => {
    try {
        const { type, title } = req.body;

        if (!req.file) {
            return res.status(400).json({ message: "Gambar peta wajib diunggah." });
        }

        // Cek apakah tipe peta ini sudah ada (karena field type @unique di schema)
        // Contoh tipe: ADMIN, DUSUN, PENGGUNA_LAHAN, PHBS, LERENG, KESESUAIAN_LAHAN
        const existingPeta = await prisma.petaDesa.findUnique({ where: { type: type.toUpperCase() } });
        if (existingPeta) {
            deleteFile(`/uploads/pemetaan/${req.file.filename}`);
            return res.status(400).json({ message: `Peta dengan tipe '${type}' sudah ada. Silakan gunakan fitur update.` });
        }

        const newPeta = await prisma.petaDesa.create({
            data: {
                type: type.toUpperCase(),
                title: title || type,
                image: `/uploads/pemetaan/${req.file.filename}`
            }
        });

        res.status(201).json({ message: "Peta berhasil ditambahkan", data: newPeta });
    } catch (error) {
        if (req.file) deleteFile(`/uploads/pemetaan/${req.file.filename}`);
        res.status(500).json({ message: "Gagal menambahkan peta desa.", error: error.message });
    }
};

export const updatePeta = async (req, res) => {
    try {
        const { id } = req.params;
        const { type, title } = req.body;

        const oldPeta = await prisma.petaDesa.findUnique({ where: { id: parseInt(id) } });

        if (!oldPeta) {
            if (req.file) deleteFile(`/uploads/pemetaan/${req.file.filename}`);
            return res.status(404).json({ message: "Data peta tidak ditemukan." });
        }

        let updateData = {
            title: title || oldPeta.title,
            type: type ? type.toUpperCase() : oldPeta.type
        };

        // Jika upload gambar peta baru
        if (req.file) {
            updateData.image = `/uploads/pemetaan/${req.file.filename}`;
            deleteFile(oldPeta.image); // Hapus peta fisik yang lama
        }

        const updatedPeta = await prisma.petaDesa.update({
            where: { id: parseInt(id) },
            data: updateData
        });

        res.status(200).json({ message: "Peta berhasil diperbarui", data: updatedPeta });
    } catch (error) {
        if (req.file) deleteFile(`/uploads/pemetaan/${req.file.filename}`);
        // Menangani error jika admin mencoba mengganti tipe ke tipe yang sudah dipakai peta lain
        if (error.code === 'P2002') {
            return res.status(400).json({ message: "Tipe peta tersebut sudah digunakan oleh gambar lain." });
        }
        res.status(500).json({ message: "Gagal memperbarui peta.", error: error.message });
    }
};

export const deletePeta = async (req, res) => {
    try {
        const { id } = req.params;

        const peta = await prisma.petaDesa.findUnique({ where: { id: parseInt(id) } });

        if (!peta) return res.status(404).json({ message: "Data peta tidak ditemukan." });

        deleteFile(peta.image); // Hapus file fisiknya

        await prisma.petaDesa.delete({ where: { id: parseInt(id) } });

        res.status(200).json({ message: "Peta berhasil dihapus" });
    } catch (error) {
        res.status(500).json({ message: "Gagal menghapus peta.", error: error.message });
    }
};