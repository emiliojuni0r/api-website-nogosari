import prisma from '../config/db.js';

// 1. GET ALL CATEGORIES
export const getCategories = async (req, res) => {
    try {
        const categories = await prisma.category.findMany({
            orderBy: { name: 'asc' } // Urutkan abjad A-Z
        });
        res.status(200).json({ data: categories });
    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil data kategori." });
    }
};

// 2. CREATE CATEGORY
export const createCategory = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ message: "Nama kategori wajib diisi." });
        }

        // Cek apakah nama kategori sudah ada
        const existingCategory = await prisma.category.findUnique({
            where: { name: name }
        });

        if (existingCategory) {
            return res.status(400).json({ message: "Kategori dengan nama tersebut sudah ada." });
        }

        const newCategory = await prisma.category.create({
            data: { name }
        });

        res.status(201).json({ message: "Kategori berhasil dibuat", data: newCategory });
    } catch (error) {
        res.status(500).json({ message: "Gagal membuat kategori.", error: error.message });
    }
};

// 3. UPDATE CATEGORY
export const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ message: "Nama kategori wajib diisi." });
        }

        const category = await prisma.category.findUnique({ where: { id: parseInt(id) } });
        if (!category) {
            return res.status(404).json({ message: "Kategori tidak ditemukan." });
        }

        const updatedCategory = await prisma.category.update({
            where: { id: parseInt(id) },
            data: { name }
        });

        res.status(200).json({ message: "Kategori berhasil diperbarui", data: updatedCategory });
    } catch (error) {
        // Handle error jika nama kategori bentrok dengan yang sudah ada (karena field @unique)
        if (error.code === 'P2002') {
            return res.status(400).json({ message: "Kategori dengan nama tersebut sudah ada." });
        }
        res.status(500).json({ message: "Gagal memperbarui kategori.", error: error.message });
    }
};

// 4. DELETE CATEGORY
export const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        const category = await prisma.category.findUnique({ where: { id: parseInt(id) } });
        if (!category) {
            return res.status(404).json({ message: "Kategori tidak ditemukan." });
        }

        await prisma.category.delete({
            where: { id: parseInt(id) }
        });

        res.status(200).json({ message: "Kategori berhasil dihapus beserta artikel di dalamnya" });
    } catch (error) {
        res.status(500).json({ message: "Gagal menghapus kategori.", error: error.message });
    }
};