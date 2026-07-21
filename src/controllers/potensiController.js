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

// 1. GET ALL POTENSI (Dengan Pagination & Search)
export const getPotensi = async (req, res) => {
    try {
        // Ambil parameter dari URL, beri nilai default jika tidak ada
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 6; // Menampilkan 6 potensi per halaman
        const search = req.query.search || '';

        const skip = (page - 1) * limit;

        // Kondisi filter: Jika ada query pencarian, cari di 'title' atau 'description'
        const whereCondition = {
            ...(search && {
                OR: [
                    {
                        title: {
                            contains: search,
                            // mode: "insensitive", // Hapus jika menggunakan MySQL
                        },
                    },
                    {
                        description: {
                            contains: search,
                            // mode: "insensitive", // Hapus jika menggunakan MySQL
                        },
                    },
                ],
            }),
        };

        // Ambil data dan total count secara paralel
        const [potensi, totalData] = await prisma.$transaction([
            prisma.potensiEkonomi.findMany({
                where: whereCondition,
                skip: skip,
                take: limit,
                include: { images: true }, // Ambil data relasi gambarnya
                orderBy: { createdAt: 'desc' }
            }),
            prisma.potensiEkonomi.count({ where: whereCondition })
        ]);

        const totalPage = Math.ceil(totalData / limit);

        res.status(200).json({
            message: "Berhasil mengambil data potensi desa",
            pagination: {
                totalData,
                totalPage,
                currentPage: page,
                limit
            },
            data: potensi
        });
    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil data potensi desa.", error: error.message });
    }
};

// 2. GET POTENSI BY ID
export const getPotensiById = async (req, res) => {
    try {
        const { id } = req.params;
        const potensi = await prisma.potensiEkonomi.findUnique({
            where: { id: parseInt(id) },
            include: { images: true }
        });

        if (!potensi) return res.status(404).json({ message: "Data potensi tidak ditemukan." });

        res.status(200).json({ data: potensi });
    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil detail potensi desa." });
    }
};

// 3. CREATE POTENSI (Admin)
export const createPotensi = async (req, res) => {
    try {
        const { title, description } = req.body;

        // Validasi: Minimal harus ada 1 gambar
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: "Minimal 1 gambar potensi desa wajib diunggah." });
        }

        // Siapkan array data gambar untuk disimpan ke relasi Prisma
        const imageRecords = req.files.map(file => ({
            imageUrl: `/uploads/potensi/${file.filename}`
        }));

        const newPotensi = await prisma.potensiEkonomi.create({
            data: {
                title,
                description,
                images: {
                    create: imageRecords // Prisma otomatis insert ke tabel PotensiImage
                }
            },
            include: { images: true }
        });

        res.status(201).json({ message: "Potensi desa berhasil ditambahkan", data: newPotensi });
    } catch (error) {
        // Jika gagal insert DB, hapus file yang sudah terlanjur di-upload
        if (req.files) req.files.forEach(file => deleteFile(`/uploads/potensi/${file.filename}`));
        res.status(500).json({ message: "Gagal menambahkan potensi desa", error: error.message });
    }
};

// 4. UPDATE POTENSI (Admin)
// 4. UPDATE POTENSI (Admin)
export const updatePotensi = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, deletedImages } = req.body;

        // Parse daftar ID gambar yang akan dihapus
        const deletedIds = deletedImages
            ? JSON.parse(deletedImages)
            : [];

        // Cari data potensi
        const oldPotensi = await prisma.potensiEkonomi.findUnique({
            where: { id: parseInt(id) },
            include: { images: true }
        });

        if (!oldPotensi) {
            // Hapus file yang sudah terlanjur diupload jika data tidak ditemukan
            if (req.files) {
                req.files.forEach(file =>
                    deleteFile(`/uploads/potensi/${file.filename}`)
                );
            }

            return res.status(404).json({
                message: "Data potensi tidak ditemukan."
            });
        }

        // ==========================
        // Update title & description
        // ==========================
        await prisma.potensiEkonomi.update({
            where: {
                id: parseInt(id)
            },
            data: {
                title: title || oldPotensi.title,
                description: description || oldPotensi.description
            }
        });

        // ==========================
        // Hapus gambar yang dipilih
        // ==========================
        if (deletedIds.length > 0) {
            const imagesToDelete = await prisma.potensiImage.findMany({
                where: {
                    id: {
                        in: deletedIds
                    }
                }
            });

            // Hapus file fisik
            imagesToDelete.forEach(img => {
                deleteFile(img.imageUrl);
            });

            // Hapus record database
            await prisma.potensiImage.deleteMany({
                where: {
                    id: {
                        in: deletedIds
                    }
                }
            });
        }

        // ==========================
        // Tambahkan gambar baru
        // ==========================
        if (req.files && req.files.length > 0) {
            await prisma.potensiImage.createMany({
                data: req.files.map(file => ({
                    potensiEkonomiId: parseInt(id),
                    imageUrl: `/uploads/potensi/${file.filename}`
                }))
            });
        }

        // ==========================
        // Ambil data terbaru
        // ==========================
        const updatedPotensi = await prisma.potensiEkonomi.findUnique({
            where: {
                id: parseInt(id)
            },
            include: {
                images: true
            }
        });

        return res.status(200).json({
            message: "Data potensi berhasil diperbarui",
            data: updatedPotensi
        });

    } catch (error) {
        // Jika gagal, hapus file baru yang sudah terupload agar tidak menjadi file sampah
        if (req.files) {
            req.files.forEach(file => {
                deleteFile(`/uploads/potensi/${file.filename}`);
            });
        }

        return res.status(500).json({
            message: "Gagal memperbarui potensi desa",
            error: error.message
        });
    }
};
// export const updatePotensi = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const { title, description } = req.body;

//         const oldPotensi = await prisma.potensiEkonomi.findUnique({
//             where: { id: parseInt(id) },
//             include: { images: true }
//         });

//         if (!oldPotensi) {
//             if (req.files) req.files.forEach(file => deleteFile(`/uploads/potensi/${file.filename}`));
//             return res.status(404).json({ message: "Data potensi tidak ditemukan." });
//         }

//         // Jika admin mengunggah gambar baru, kita ganti semua gambar lama
//         let updateData = {
//             title: title || oldPotensi.title,
//             description: description || oldPotensi.description
//         };

//         if (req.files && req.files.length > 0) {
//             // 1. Hapus file fisik gambar lama
//             oldPotensi.images.forEach(img => deleteFile(img.imageUrl));

//             // 2. Siapkan relasi data gambar baru (hapus semua yg lama, insert yg baru)
//             updateData.images = {
//                 deleteMany: {}, // Hapus record lama di tabel PotensiImage terkait potensi ini
//                 create: req.files.map(file => ({
//                     imageUrl: `/uploads/potensi/${file.filename}`
//                 }))
//             };
//         }

//         const updatedPotensi = await prisma.potensiEkonomi.update({
//             where: { id: parseInt(id) },
//             data: updateData,
//             include: { images: true }
//         });

//         console.log(req.files);
//         console.log(req.files?.length);

//         res.status(200).json({ message: "Data potensi berhasil diperbarui", data: updatedPotensi });
//     } catch (error) {
//         if (req.files) req.files.forEach(file => deleteFile(`/uploads/potensi/${file.filename}`));
//         res.status(500).json({ message: "Gagal memperbarui potensi desa", error: error.message });
//     }
// };

// 5. DELETE POTENSI (Admin)
export const deletePotensi = async (req, res) => {
    try {
        const { id } = req.params;

        const potensi = await prisma.potensiEkonomi.findUnique({
            where: { id: parseInt(id) },
            include: { images: true }
        });

        if (!potensi) return res.status(404).json({ message: "Data potensi tidak ditemukan." });

        // Hapus semua file fisik gambar
        potensi.images.forEach(img => deleteFile(img.imageUrl));

        // Karena di schema.prisma kita pasang onDelete: Cascade, 
        // menghapus potensiEkonomi akan otomatis menghapus data di PotensiImage
        await prisma.potensiEkonomi.delete({
            where: { id: parseInt(id) }
        });

        res.status(200).json({ message: "Potensi desa berhasil dihapus" });
    } catch (error) {
        res.status(500).json({ message: "Gagal menghapus potensi desa", error: error.message });
    }
};