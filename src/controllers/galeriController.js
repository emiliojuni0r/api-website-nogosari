import fs from 'fs';
import path from 'path';
import prisma from '../config/db.js';

const deleteFile = (filePath) => {
    if (!filePath) return;
    const fullPath = path.join(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
};

// ==========================================
// KATEGORI GALERI
// ==========================================
export const getKategoriGaleri = async (req, res) => {
    try {
        const kategori = await prisma.kategoriGaleri.findMany({ orderBy: { name: 'asc' } });
        res.status(200).json({ message: "Berhasil mengambil kategori galeri.", data: kategori });
    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil kategori galeri." });
    }
};

export const createKategoriGaleri = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ message: "Nama kategori wajib diisi." });

        const newKategori = await prisma.kategoriGaleri.create({ data: { name } });
        res.status(201).json({ message: "Kategori berhasil dibuat", data: newKategori });
    } catch (error) {
        res.status(500).json({ message: "Gagal membuat kategori galeri.", error: error.message });
    }
};

export const updateKategoriGaleri = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        const updated = await prisma.kategoriGaleri.update({ where: { id: parseInt(id) }, data: { name } });
        res.status(200).json({ message: "Kategori berhasil diperbarui", data: updated });
    } catch (error) {
        res.status(500).json({ message: "Gagal memperbarui kategori.", error: error.message });
    }
};

export const deleteKategoriGaleri = async (req, res) => {
    try {
        const { id } = req.params;
        // Cari gambar yang terkait untuk dihapus fisiknya sebelum kategori dihapus
        const galeris = await prisma.galeri.findMany({ where: { kategoriId: parseInt(id) } });
        galeris.forEach(g => deleteFile(g.image));

        await prisma.kategoriGaleri.delete({ where: { id: parseInt(id) } });
        res.status(200).json({ message: "Kategori dan seluruh isinya berhasil dihapus." });
    } catch (error) {
        res.status(500).json({ message: "Gagal menghapus kategori.", error: error.message });
    }
};

// ==========================================
// GALERI DESA (Dengan Pagination)
// ==========================================
export const getGaleri = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 9;
        const kategoriId = req.query.kategoriId
            ? parseInt(req.query.kategoriId)
            : null;
        const search = req.query.search?.trim() || "";

        const skip = (page - 1) * limit;

        const whereCondition = {
            ...(kategoriId && { kategoriId }),
            ...(search && {
                title: {
                    contains: search,
                    // mode: "insensitive",
                },
            }),
        };

        const [galeri, totalData] = await prisma.$transaction([
            prisma.galeri.findMany({
                where: whereCondition,
                skip,
                take: limit,
                include: {
                    kategori: true,
                },
                orderBy: {
                    createdAt: "desc",
                },
            }),
            prisma.galeri.count({
                where: whereCondition,
            }),
        ]);

        res.status(200).json({
            message: "Berhasil mengambil galeri",
            pagination: {
                totalData,
                totalPage: Math.ceil(totalData / limit),
                currentPage: page,
                limit,
            },
            data: galeri,
        });
    } catch (error) {
        res.status(500).json({
            message: "Gagal mengambil data galeri.",
            error: error.message,
        });
    }
};
export const createGaleri = async (req, res) => {
    try {
        const { title, kategoriId } = req.body;
        if (!req.file) return res.status(400).json({ message: "Gambar wajib diunggah." });

        const newGaleri = await prisma.galeri.create({
            data: {
                title,
                kategoriId: parseInt(kategoriId),
                image: `/uploads/galeri/${req.file.filename}`
            },
            include: { kategori: true }
        });

        res.status(201).json({ message: "Galeri berhasil ditambahkan", data: newGaleri });
    } catch (error) {
        if (req.file) deleteFile(`/uploads/galeri/${req.file.filename}`);
        res.status(500).json({ message: "Gagal menambahkan galeri", error: error.message });
    }
};

export const deleteGaleri = async (req, res) => {
    try {
        const { id } = req.params;
        const galeri = await prisma.galeri.findUnique({ where: { id: parseInt(id) } });
        if (!galeri) return res.status(404).json({ message: "Gambar tidak ditemukan." });

        deleteFile(galeri.image);
        await prisma.galeri.delete({ where: { id: parseInt(id) } });

        res.status(200).json({ message: "Gambar berhasil dihapus dari galeri" });
    } catch (error) {
        res.status(500).json({ message: "Gagal menghapus galeri." });
    }
};