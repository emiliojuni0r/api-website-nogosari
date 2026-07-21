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

// ==========================================
// BAGIAN 1: PROFIL DESA (SEJARAH, VISI MISI)
// ==========================================

export const getProfil = async (req, res) => {
    try {
        let profil = await prisma.profilDesa.findFirst();

        // Jika data kosong (belum pernah diisi admin), kirim object kosong
        if (!profil) {
            return res.status(200).json({ message: "Data profil belum diatur.", data: {} });
        }

        res.status(200).json({ data: profil });
    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil profil desa." });
    }
};

export const updateProfil = async (req, res) => {
    try {
        const { sejarahDescription, visi, misi, videoProfilUrl } = req.body;

        // Cek data lama di database (ID selalu 1)
        const oldProfil = await prisma.profilDesa.findUnique({ where: { id: 1 } });

        let updateData = {
            sejarahDescription: sejarahDescription || oldProfil?.sejarahDescription || "",
            visi: visi || oldProfil?.visi || "",
            misi: misi || oldProfil?.misi || "",
            videoProfilUrl: videoProfilUrl || oldProfil?.videoProfilUrl || "",
        };

        // Jika admin mengunggah sejarahImage baru
        if (req.files && req.files['sejarahImage']) {
            updateData.sejarahImage = `/uploads/profil/${req.files['sejarahImage'][0].filename}`;
            if (oldProfil?.sejarahImage) deleteFile(oldProfil.sejarahImage);
        }

        // Jika admin mengunggah baganOrganisasi baru
        if (req.files && req.files['baganOrganisasi']) {
            updateData.baganOrganisasi = `/uploads/profil/${req.files['baganOrganisasi'][0].filename}`;
            if (oldProfil?.baganOrganisasi) deleteFile(oldProfil.baganOrganisasi);
        }

        // Gunakan UPSERT: Jika ID 1 sudah ada maka Update, jika belum ada maka Create
        const profil = await prisma.profilDesa.upsert({
            where: { id: 1 },
            update: updateData,
            create: {
                id: 1,
                sejarahDescription: updateData.sejarahDescription,
                visi: updateData.visi,
                misi: updateData.misi,
                sejarahImage: updateData.sejarahImage || "",
                baganOrganisasi: updateData.baganOrganisasi || "",
                videoProfilUrl: updateData.videoProfilUrl
            }
        });

        res.status(200).json({ message: "Profil desa berhasil diperbarui", data: profil });
    } catch (error) {
        res.status(500).json({ message: "Gagal memperbarui profil desa", error: error.message });
    }
};

// ==========================================
// BAGIAN 2: PERANGKAT DESA (STRUKTUR ORG)
// ==========================================

export const getPerangkat = async (req, res) => {
    try {
        const perangkat = await prisma.perangkatDesa.findMany({
            orderBy: { order: 'asc' } // Mengurutkan berdasarkan hierarki jabatan (order)
        });
        res.status(200).json({
            message: "Berhasil mengambil data artikel",
            data: perangkat
        });
    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil data perangkat desa." });
    }
};

export const createPerangkat = async (req, res) => {
    try {
        const { name, position, order } = req.body;

        if (!req.file) {
            return res.status(400).json({ message: "Foto perangkat desa wajib diunggah." });
        }

        const photoUrl = `/uploads/profil/${req.file.filename}`;

        const newPerangkat = await prisma.perangkatDesa.create({
            data: {
                name,
                position,
                photo: photoUrl,
                order: parseInt(order) || 0
            }
        });

        res.status(201).json({ message: "Perangkat desa berhasil ditambahkan", data: newPerangkat });
    } catch (error) {
        if (req.file) deleteFile(req.file.path);
        res.status(500).json({ message: "Gagal menambahkan perangkat desa", error: error.message });
    }
};

export const updatePerangkat = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, position, order } = req.body;

        const oldPerangkat = await prisma.perangkatDesa.findUnique({ where: { id: parseInt(id) } });
        if (!oldPerangkat) return res.status(404).json({ message: "Data perangkat tidak ditemukan" });

        let updateData = {
            name: name || oldPerangkat.name,
            position: position || oldPerangkat.position,
            order: order ? parseInt(order) : oldPerangkat.order
        };

        // Jika upload foto baru, ganti path-nya dan hapus fisik foto lama
        if (req.file) {
            updateData.photo = `/uploads/profil/${req.file.filename}`;
            deleteFile(oldPerangkat.photo);
        }

        const updated = await prisma.perangkatDesa.update({
            where: { id: parseInt(id) },
            data: updateData
        });

        res.status(200).json({ message: "Data perangkat berhasil diperbarui", data: updated });
    } catch (error) {
        if (req.file) deleteFile(req.file.path);
        res.status(500).json({ message: "Gagal memperbarui data perangkat", error: error.message });
    }
};

export const deletePerangkat = async (req, res) => {
    try {
        const { id } = req.params;
        const perangkat = await prisma.perangkatDesa.findUnique({ where: { id: parseInt(id) } });

        if (!perangkat) return res.status(404).json({ message: "Data perangkat tidak ditemukan" });

        deleteFile(perangkat.photo); // Hapus foto fisik dari server

        await prisma.perangkatDesa.delete({ where: { id: parseInt(id) } });

        res.status(200).json({ message: "Perangkat desa berhasil dihapus" });
    } catch (error) {
        res.status(500).json({ message: "Gagal menghapus perangkat desa", error: error.message });
    }
};