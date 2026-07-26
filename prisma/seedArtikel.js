import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const kegiatanWarga = await prisma.category.findUnique({
        where: {
            name: 'Kegiatan Warga',
        },
    });

    const pengumumanResmi = await prisma.category.findUnique({
        where: {
            name: 'Pengumuman Resmi',
        },
    });

    if (!kegiatanWarga || !pengumumanResmi) {
        throw new Error(
            'Category belum ada. Jalankan seeder category terlebih dahulu.',
        );
    }

    const articles = [
        {
            title: 'Gotong Royong Membersihkan Lingkungan Desa',
            slug: 'gotong-royong-membersihkan-lingkungan-desa',
            thumbnail: '/uploads/articles/gotong-royong.jpg',
            content: `
        Pemerintah desa bersama masyarakat mengadakan kegiatan gotong royong
        untuk membersihkan lingkungan desa. Kegiatan ini bertujuan menjaga
        kebersihan dan meningkatkan rasa kebersamaan antarwarga.
      `,
            categoryId: kegiatanWarga.id,
            date: new Date('2025-01-15'),
        },
        {
            title: 'Pelatihan UMKM Bagi Warga Desa',
            slug: 'pelatihan-umkm-bagi-warga-desa',
            thumbnail: '/uploads/articles/pelatihan-umkm.jpg',
            content: `
        Pemerintah desa bekerja sama dengan dinas terkait mengadakan pelatihan
        UMKM guna meningkatkan kemampuan masyarakat dalam mengembangkan usaha.
      `,
            categoryId: kegiatanWarga.id,
            date: new Date('2025-02-20'),
        },
        {
            title: 'Pengumuman Jadwal Musyawarah Desa',
            slug: 'pengumuman-jadwal-musyawarah-desa',
            thumbnail: '/uploads/articles/musyawarah.jpg',
            content: `
        Diberitahukan kepada seluruh warga desa agar dapat menghadiri
        musyawarah desa yang akan dilaksanakan pada hari Sabtu pukul 09.00 WIB
        di Balai Desa.
      `,
            categoryId: pengumumanResmi.id,
            date: new Date('2025-03-05'),
        },
        {
            title: 'Libur Pelayanan Kantor Desa',
            slug: 'libur-pelayanan-kantor-desa',
            thumbnail: '/uploads/articles/libur-pelayanan.jpg',
            content: `
        Pelayanan administrasi di kantor desa diliburkan pada tanggal yang telah
        ditentukan sehubungan dengan hari libur nasional. Pelayanan akan kembali
        normal pada hari kerja berikutnya.
      `,
            categoryId: pengumumanResmi.id,
            date: new Date('2025-04-10'),
        },
    ];

    for (const article of articles) {
        await prisma.article.upsert({
            where: {
                slug: article.slug,
            },
            update: {
                ...article,
            },
            create: article,
        });
    }

    console.log('✅ Seeder article berhasil dijalankan!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });