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
// SAMBUTAN KEPALA DESA
// ==========================================

export const getSambutan = async (req, res) => {
    try {
        let sambutan = await prisma.sambutanKades.findFirst();

        // Jika belum ada data yang diinput oleh Admin
        if (!sambutan) {
            return res.status(200).json({
                message: "Data sambutan belum diatur.",
                data: null
            });
        }

        res.status(200).json({ data: sambutan });
    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil data sambutan." });
    }
};

export const updateSambutan = async (req, res) => {
    try {
        const { name, content } = req.body;

        // Ambil data sambutan lama (karena ID-nya selalu 1)
        const oldSambutan = await prisma.sambutanKades.findUnique({ where: { id: 1 } });

        let updateData = {
            name: name || oldSambutan?.name || "",
            content: content || oldSambutan?.content || ""
        };

        // KUNCI: Cek apakah ada file foto kepala desa baru yang diunggah
        if (req.file) {
            updateData.image = `/uploads/homepage/${req.file.filename}`;

            // Hapus foto kepala desa yang lama agar penyimpanan server tidak menumpuk
            if (oldSambutan && oldSambutan.image) {
                deleteFile(oldSambutan.image);
            }
        }

        // Jalankan Upsert (Update jika ada ID 1, Create jika belum ada)
        const sambutan = await prisma.sambutanKades.upsert({
            where: { id: 1 },
            update: updateData,
            create: {
                id: 1,
                name: updateData.name,
                content: updateData.content,
                // Beri string kosong jika saat create awal tidak ada file
                image: updateData.image || ""
            }
        });

        res.status(200).json({
            message: "Sambutan Kepala Desa berhasil diperbarui",
            data: sambutan
        });

    } catch (error) {
        // Hapus file yang terlanjur terupload jika terjadi error saat simpan database
        if (req.file) deleteFile(req.file.path);
        res.status(500).json({ message: "Gagal memperbarui sambutan", error: error.message });
    }
};


// ==========================================
// CAROUSEL HOMEPAGE
// ==========================================

// 1. GET ALL CAROUSEL (Public)
export const getCarousels = async (req, res) => {
    try {
        const carousels = await prisma.carousel.findMany({
            orderBy: { createdAt: 'desc' } // Gambar terbaru muncul duluan
        });
        res.status(200).json({ message: "berhasil mendapatkan data carousel.",data: carousels });
    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil data carousel." });
    }
};

// 2. CREATE CAROUSEL (Admin)
export const createCarousel = async (req, res) => {
    try {
        const { title, subtitle } = req.body;

        if (!req.file) {
            return res.status(400).json({ message: "Gambar carousel wajib diunggah." });
        }

        const imageUrl = `/uploads/homepage/${req.file.filename}`;

        const newCarousel = await prisma.carousel.create({
            data: {
                title: title || "",
                subtitle: subtitle || "",
                image: imageUrl
            }
        });

        res.status(201).json({ message: "Carousel berhasil ditambahkan", data: newCarousel });
    } catch (error) {
        if (req.file) deleteFile(`/uploads/homepage/${req.file.filename}`);
        res.status(500).json({ message: "Gagal menambahkan carousel", error: error.message });
    }
};

// 3. UPDATE CAROUSEL (Admin)
export const updateCarousel = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, subtitle } = req.body;

        const oldCarousel = await prisma.carousel.findUnique({ where: { id: parseInt(id) } });

        if (!oldCarousel) {
            if (req.file) deleteFile(`/uploads/homepage/${req.file.filename}`);
            return res.status(404).json({ message: "Data carousel tidak ditemukan." });
        }

        let updateData = {
            title: title || oldCarousel.title,
            subtitle: subtitle || oldCarousel.subtitle
        };

        // Jika admin mengunggah gambar baru
        if (req.file) {
            updateData.image = `/uploads/homepage/${req.file.filename}`;
            deleteFile(oldCarousel.image); // Hapus gambar fisik yang lama
        }

        const updatedCarousel = await prisma.carousel.update({
            where: { id: parseInt(id) },
            data: updateData
        });

        res.status(200).json({ message: "Carousel berhasil diperbarui", data: updatedCarousel });
    } catch (error) {
        if (req.file) deleteFile(`/uploads/homepage/${req.file.filename}`);
        res.status(500).json({ message: "Gagal memperbarui carousel", error: error.message });
    }
};

// 4. DELETE CAROUSEL (Admin)
export const deleteCarousel = async (req, res) => {
    try {
        const { id } = req.params;

        const carousel = await prisma.carousel.findUnique({ where: { id: parseInt(id) } });

        if (!carousel) return res.status(404).json({ message: "Data carousel tidak ditemukan." });

        deleteFile(carousel.image); // Hapus gambar fisik dari server

        await prisma.carousel.delete({ where: { id: parseInt(id) } });

        res.status(200).json({ message: "Carousel berhasil dihapus" });
    } catch (error) {
        res.status(500).json({ message: "Gagal menghapus carousel", error: error.message });
    }
};