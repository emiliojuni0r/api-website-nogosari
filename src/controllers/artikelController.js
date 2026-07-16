import fs from 'fs';
import path from 'path';
import prisma from '../config/db.js';

// Helper untuk membuat Slug otomatis
const createSlug = (title) => {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
};

// 1. GET ALL ARTICLES (Public - Dengan Pagination & Filter Kategori)
export const getArticles = async (req, res) => {
    try {
        // Ambil query params dari URL (Contoh: /api/artikel?page=1&limit=5&category=kegiatan)
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 6; // Default 6 artikel per halaman
        const categorySlug = req.query.category || null;

        const skip = (page - 1) * limit;

        // Validasi kondisi filter jika ada category
        const whereCondition = categorySlug
            ? { category: { name: { contains: categorySlug } } }
            : {};

        // Ambil data dan hitung total data secara bersamaan (Parallel Queries)
        const [articles, totalData] = await prisma.$transaction([
            prisma.article.findMany({
                where: whereCondition,
                skip: skip,
                take: limit,
                include: {
                    category: {
                        select: { id: true, name: true }
                    }
                },
                orderBy: { date: 'desc' } // Artikel terbaru dahulu
            }),
            prisma.article.count({ where: whereCondition })
        ]);

        const totalPage = Math.ceil(totalData / limit);

        res.status(200).json({
            message: "Berhasil mengambil data artikel",
            pagination: {
                totalData,
                totalPage,
                currentPage: page,
                limit
            },
            data: articles
        });
    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil data artikel.", error: error.message });
    }
};

// 2. GET ARTICLE BY SLUG (Public - Detail Artikel)
export const getArticleBySlug = async (req, res) => {
    try {
        const { slug } = req.params;

        const article = await prisma.article.findUnique({
            where: { slug: slug },
            include: {
                category: { select: { id: true, name: true } }
            }
        });

        if (!article) {
            return res.status(404).json({ message: "Artikel tidak ditemukan." });
        }

        res.status(200).json({
            message: "Berhasil mengambil detail artikel",
            data: article
        });
    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil detail artikel.", error: error.message });
    }
};

// 3. CREATE ARTICLE (Admin - Protected)
export const createArticle = async (req, res) => {
    try {
        const { title, content, categoryId } = req.body;

        // Validasi gambar wajib diisi saat membuat artikel baru
        if (!req.file) {
            return res.status(400).json({ message: "Gambar thumbnail wajib diunggah." });
        }

        const slug = createSlug(title);

        // Cek apakah slug sudah dipakai artikel lain
        const existingSlug = await prisma.article.findUnique({ where: { slug } });
        const finalSlug = existingSlug ? `${slug}-${Date.now()}` : slug;

        const imageUrl = `/uploads/articles/${req.file.filename}`;

        const newArticle = await prisma.article.create({
            data: {
                title,
                slug: finalSlug,
                content,
                thumbnail: imageUrl,
                categoryId: parseInt(categoryId)
            },
            include: { category: true }
        });

        res.status(201).json({
            message: "Artikel berhasil diterbitkan",
            data: newArticle
        });
    } catch (error) {
        // Hapus gambar yang terlanjur terupload jika query database gagal
        if (req.file) fs.unlinkSync(req.file.path);
        res.status(500).json({ message: "Gagal membuat artikel.", error: error.message });
    }
};

// 4. UPDATE ARTICLE (Admin - Protected)
export const updateArticle = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, categoryId } = req.body;

        // Cari dulu artikel lama
        const oldArticle = await prisma.article.findUnique({
            where: { id: parseInt(id) }
        });

        if (!oldArticle) {
            if (req.file) fs.unlinkSync(req.file.path); // Hapus gambar baru jika artikel ga ada
            return res.status(404).json({ message: "Artikel tidak ditemukan." });
        }

        // Siapkan data yang mau diupdate
        let updatedData = {
            title,
            content,
            categoryId: categoryId ? parseInt(categoryId) : oldArticle.categoryId
        };

        // Jika judul diubah, regenerasi slug baru
        if (title && title !== oldArticle.title) {
            updatedData.slug = createSlug(title);
        }

        // KUNCI UTAMA: Gambar bersifat OPSIONAL pada rute PUT
        if (req.file) {
            updatedData.thumbnail = `/uploads/articles/${req.file.filename}`;

            // Hapus file fisik gambar lama di folder uploads agar server tidak penuh
            const oldImagePath = path.join(process.cwd(), oldArticle.thumbnail);
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
            }
        }

        const updatedArticle = await prisma.article.update({
            where: { id: parseInt(id) },
            data: updatedData,
            include: { category: true }
        });

        res.status(200).json({
            message: "Artikel berhasil diperbarui",
            data: updatedArticle
        });
    } catch (error) {
        if (req.file) fs.unlinkSync(req.file.path);
        res.status(500).json({ message: "Gagal memperbarui artikel.", error: error.message });
    }
};

// 5. DELETE ARTICLE (Admin - Protected)
export const deleteArticle = async (req, res) => {
    try {
        const { id } = req.params;

        const article = await prisma.article.findUnique({
            where: { id: parseInt(id) }
        });

        if (!article) {
            return res.status(404).json({ message: "Artikel tidak ditemukan." });
        }

        // Hapus berkas gambar di server sebelum menghapus record di database
        const imagePath = path.join(process.cwd(), article.thumbnail);
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }

        await prisma.article.delete({
            where: { id: parseInt(id) }
        });

        res.status(200).json({
            message: "Artikel berhasil dihapus secara permanen"
        });
    } catch (error) {
        res.status(500).json({ message: "Gagal menghapus artikel.", error: error.message });
    }
};