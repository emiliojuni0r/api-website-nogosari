import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';


// 1. GET ALL ADMINS (Melihat daftar semua admin)
export const getAdmins = async (req, res) => {
    try {
        const admins = await prisma.admin.findMany({
            select: {
                id: true,
                username: true,
                createdAt: true,
                updatedAt: true
                // KUNCI KEAMANAN: Jangan masukkan 'password: true' di sini
            },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json({ data: admins });
    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil daftar admin." });
    }
};

// 2. CREATE NEW ADMIN (Menambahkan admin baru)
export const createAdmin = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: "Username dan password wajib diisi." });
        }

        // Cek apakah username sudah dipakai
        const existingAdmin = await prisma.admin.findUnique({
            where: { username }
        });

        if (existingAdmin) {
            return res.status(400).json({ message: "Username sudah digunakan, silakan pilih yang lain." });
        }

        // Enkripsi password sebelum disimpan ke database
        const hashedPassword = await bcrypt.hash(password, 10);

        const newAdmin = await prisma.admin.create({
            data: {
                username,
                password: hashedPassword
            },
            select: {
                id: true,
                username: true,
                createdAt: true
            }
        });

        res.status(201).json({ message: "Admin baru berhasil ditambahkan.", data: newAdmin });
    } catch (error) {
        res.status(500).json({ message: "Gagal membuat akun admin.", error: error.message });
    }
};

// 3. DELETE ADMIN (Menghapus admin)
export const deleteAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const targetId = parseInt(id);

        // KUNCI KEAMANAN: Admin tidak boleh menghapus akunnya sendiri
        // (req.admin.id didapat dari authMiddleware)
        if (req.admin.id === targetId) {
            return res.status(403).json({ message: "Anda tidak dapat menghapus akun Anda sendiri saat sedang login." });
        }

        const admin = await prisma.admin.findUnique({
            where: { id: targetId }
        });

        if (!admin) {
            return res.status(404).json({ message: "Akun admin tidak ditemukan." });
        }

        await prisma.admin.delete({
            where: { id: targetId }
        });

        res.status(200).json({ message: "Akun admin berhasil dihapus." });
    } catch (error) {
        res.status(500).json({ message: "Gagal menghapus akun admin.", error: error.message });
    }
};

// 4. UPDATE PASSWORD ADMIN (Opsional: Jika admin mau ganti password)
export const updatePassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;

        if (!newPassword) {
            return res.status(400).json({ message: "Password baru wajib diisi." });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.admin.update({
            where: { id: parseInt(id) },
            data: { password: hashedPassword }
        });

        res.status(200).json({ message: "Password admin berhasil diperbarui." });
    } catch (error) {
        res.status(500).json({ message: "Gagal memperbarui password.", error: error.message });
    }
};

// Fungsi untuk menangani Login Admin
export const loginAdmin = async (req, res) => {
    try {
        const { username, password } = req.body;

        // 1. Validasi input kosong
        if (!username || !password) {
            return res.status(400).json({ message: "Username dan password wajib diisi." });
        }

        // 2. Cari data admin di database berdasarkan username
        const admin = await prisma.admin.findUnique({
            where: { username: username }
        });

        // Jika admin tidak ditemukan
        if (!admin) {
            return res.status(404).json({ message: "Username tidak ditemukan." });
        }

        // 3. Cocokkan password yang dikirim dari frontend dengan password hash di database
        const isPasswordMatch = await bcrypt.compare(password, admin.password);

        // Jika password salah
        if (!isPasswordMatch) {
            return res.status(401).json({ message: "Password salah." });
        }

        // 4. Jika sukses, buat Token JWT
        // Token ini berisi ID dan Username admin, ditandatangani dengan JWT_SECRET
        // Token ini kadaluwarsa dalam 1 hari (24 jam)
        const token = jwt.sign(
            { id: admin.id, username: admin.username },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        // 5. Kirim respon sukses beserta token ke frontend
        res.status(200).json({
            message: "Login berhasil",
            token: token,
            admin: {
                id: admin.id,
                username: admin.username
            }
        });

    } catch (error) {
        console.error("Error saat login:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server.", error: error.message });
    }
};

// (Opsional) Fungsi untuk mengecek profil admin yang sedang login
export const getMe = async (req, res) => {
    try {
        // req.admin didapatkan dari authMiddleware
        const admin = await prisma.admin.findUnique({
            where: { id: req.admin.id },
            select: { id: true, username: true, createdAt: true } // Jangan kirim password kembali
        });

        res.status(200).json(admin);
    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil data admin." });
    }
};