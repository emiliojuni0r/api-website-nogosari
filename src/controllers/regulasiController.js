import fs from 'fs';
import path from 'path';
import prisma from '../config/db.js';

const deleteFile = (filePath) => {
    if (!filePath) return;
    const fullPath = path.join(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
};

export const getRegulasi = async (req, res) => {
    try {
        const regulasi = await prisma.regulasi.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json({ data: regulasi });
    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil data regulasi." });
    }
};

export const createRegulasi = async (req, res) => {
    try {
        const { title, linkUrl } = req.body;

        if (!title) return res.status(400).json({ message: "Judul regulasi wajib diisi." });
        if (!req.file && !linkUrl) {
            return res.status(400).json({ message: "Harus melampirkan file dokumen atau link tautan." });
        }

        const newRegulasi = await prisma.regulasi.create({
            data: {
                title,
                linkUrl: linkUrl || null,
                fileUrl: req.file ? `/uploads/regulasi/${req.file.filename}` : null
            }
        });

        res.status(201).json({ message: "Regulasi berhasil ditambahkan", data: newRegulasi });
    } catch (error) {
        if (req.file) deleteFile(`/uploads/regulasi/${req.file.filename}`);
        res.status(500).json({ message: "Gagal menambahkan regulasi", error: error.message });
    }
};

export const deleteRegulasi = async (req, res) => {
    try {
        const { id } = req.params;
        const regulasi = await prisma.regulasi.findUnique({ where: { id: parseInt(id) } });

        if (!regulasi) return res.status(404).json({ message: "Regulasi tidak ditemukan." });

        if (regulasi.fileUrl) deleteFile(regulasi.fileUrl); // Hapus file fisik jika ada

        await prisma.regulasi.delete({ where: { id: parseInt(id) } });
        res.status(200).json({ message: "Regulasi berhasil dihapus" });
    } catch (error) {
        res.status(500).json({ message: "Gagal menghapus regulasi." });
    }
};