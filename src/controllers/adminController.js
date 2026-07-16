import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';

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