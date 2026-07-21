import prisma from '../config/db.js';

export const getFooter = async (req, res) => {
    try {
        const footer = await prisma.footerInfo.findFirst();

        // Berikan default respon jika admin belum pernah menyetel data footer
        if (!footer) {
            return res.status(200).json({
                message: "Data footer belum diatur",
                data: { address: "-", phone: "-", email: "-" }
            });
        }

        res.status(200).json({ data: footer });
    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil data informasi footer." });
    }
};

export const updateFooter = async (req, res) => {
    try {
        const { address, phone, email } = req.body;

        // Upsert dengan ID selalu 1
        const footer = await prisma.footerInfo.upsert({
            where: { id: 1 },
            update: {
                address: address || "",
                phone: phone || "",
                email: email || ""
            },
            create: {
                id: 1,
                address: address || "",
                phone: phone || "",
                email: email || ""
            }
        });

        res.status(200).json({
            message: "Informasi kontak footer berhasil diperbarui",
            data: footer
        });
    } catch (error) {
        res.status(500).json({ message: "Gagal memperbarui informasi footer.", error: error.message });
    }
};