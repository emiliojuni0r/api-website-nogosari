import jwt from 'jsonwebtoken';

export const authMiddleware = (req, res, next) => {
    // Mengambil token dari header 'Authorization: Bearer <TOKEN>'
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Akses ditolak. Token tidak valid atau tidak disediakan.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.admin = decoded; // Menyimpan data admin yang terverifikasi ke object request
        next(); // Lanjut ke controller
    } catch (error) {
        return res.status(403).json({ message: 'Token kadaluwarsa atau tidak sah.' });
    }
};