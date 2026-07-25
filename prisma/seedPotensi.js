import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const potensiList = [
        {
            title: 'Pertanian Padi',
            description:
                'Desa memiliki lahan pertanian padi yang luas dengan sistem irigasi yang baik sehingga mampu menghasilkan panen berkualitas.',
            images: [
                '/uploads/potensi/padi-1.jpg',
                '/uploads/potensi/padi-2.jpg',
            ],
        },
        {
            title: 'Perkebunan Jagung',
            description:
                'Jagung menjadi salah satu komoditas unggulan yang dibudidayakan oleh masyarakat sebagai sumber pendapatan.',
            images: [
                '/uploads/potensi/jagung-1.jpg',
                '/uploads/potensi/jagung-2.jpg',
            ],
        },
        {
            title: 'UMKM Kerajinan',
            description:
                'Masyarakat desa mengembangkan berbagai produk kerajinan tangan yang memiliki nilai ekonomi dan dipasarkan hingga luar daerah.',
            images: [
                '/uploads/potensi/umkm-1.jpg',
                '/uploads/potensi/umkm-2.jpg',
            ],
        },
        {
            title: 'Peternakan Sapi',
            description:
                'Peternakan sapi menjadi salah satu sektor ekonomi masyarakat dengan hasil berupa sapi potong dan pupuk organik.',
            images: [
                '/uploads/potensi/sapi-1.jpg',
                '/uploads/potensi/sapi-2.jpg',
            ],
        },
        {
            title: "Pertanian Padi",
            description: "Pertanian padi merupakan sektor utama yang menopang perekonomian masyarakat desa.",
            images: ["/uploads/potensi/padi-1.jpg", "/uploads/potensi/padi-2.jpg"],
        },
        {
            title: "Perkebunan Jagung",
            description: "Budidaya jagung menjadi salah satu komoditas unggulan dengan hasil panen setiap musim.",
            images: ["/uploads/potensi/jagung-1.jpg"],
        },
        {
            title: "Perkebunan Tebu",
            description: "Lahan tebu dimanfaatkan sebagai bahan baku industri gula dan meningkatkan pendapatan petani.",
            images: ["/uploads/potensi/tebu-1.jpg"],
        },
        {
            title: "Perkebunan Tembakau",
            description: "Tanaman tembakau dibudidayakan oleh masyarakat sebagai komoditas bernilai ekonomi.",
            images: ["/uploads/potensi/tembakau-1.jpg"],
        },
        {
            title: "Perkebunan Cabai",
            description: "Cabai menjadi salah satu hasil pertanian yang dipasarkan ke berbagai daerah.",
            images: ["/uploads/potensi/cabai-1.jpg"],
        },
        {
            title: "Perkebunan Bawang Merah",
            description: "Bawang merah menjadi komoditas hortikultura yang memiliki nilai jual tinggi.",
            images: ["/uploads/potensi/bawang-1.jpg"],
        },
        {
            title: "Budidaya Tomat",
            description: "Budidaya tomat dilakukan oleh kelompok tani dengan hasil berkualitas.",
            images: ["/uploads/potensi/tomat-1.jpg"],
        },
        {
            title: "Budidaya Kangkung",
            description: "Sayuran kangkung dipasarkan ke pasar tradisional dan modern.",
            images: ["/uploads/potensi/kangkung-1.jpg"],
        },
        {
            title: "Budidaya Bayam",
            description: "Bayam menjadi salah satu sayuran favorit hasil pertanian desa.",
            images: ["/uploads/potensi/bayam-1.jpg"],
        },
        {
            title: "Budidaya Sawi",
            description: "Sawi ditanam sepanjang tahun dengan sistem irigasi yang baik.",
            images: ["/uploads/potensi/sawi-1.jpg"],
        },
        {
            title: "Perkebunan Pisang",
            description: "Pisang dipasarkan dalam bentuk buah segar maupun olahan.",
            images: ["/uploads/potensi/pisang-1.jpg"],
        },
        {
            title: "Perkebunan Mangga",
            description: "Mangga lokal menjadi buah unggulan yang diminati masyarakat.",
            images: ["/uploads/potensi/mangga-1.jpg"],
        },
        {
            title: "Perkebunan Durian",
            description: "Durian menjadi daya tarik ekonomi sekaligus wisata musiman.",
            images: ["/uploads/potensi/durian-1.jpg"],
        },
        {
            title: "Perkebunan Rambutan",
            description: "Rambutan dipanen setiap musim dan dipasarkan ke kota sekitar.",
            images: ["/uploads/potensi/rambutan-1.jpg"],
        },
        {
            title: "Budidaya Pepaya",
            description: "Pepaya menjadi buah konsumsi harian masyarakat dengan hasil melimpah.",
            images: ["/uploads/potensi/pepaya-1.jpg"],
        },
        {
            title: "Peternakan Sapi",
            description: "Peternakan sapi menjadi sumber penghasilan tambahan masyarakat.",
            images: ["/uploads/potensi/sapi-1.jpg"],
        },
        {
            title: "Peternakan Kambing",
            description: "Budidaya kambing berkembang untuk kebutuhan kurban dan konsumsi.",
            images: ["/uploads/potensi/kambing-1.jpg"],
        },
        {
            title: "Peternakan Domba",
            description: "Domba dipelihara oleh kelompok ternak desa.",
            images: ["/uploads/potensi/domba-1.jpg"],
        },
        {
            title: "Peternakan Ayam Kampung",
            description: "Ayam kampung menjadi komoditas unggulan peternak lokal.",
            images: ["/uploads/potensi/ayam-kampung-1.jpg"],
        },
        {
            title: "Peternakan Ayam Petelur",
            description: "Telur ayam dipasarkan ke berbagai wilayah sekitar desa.",
            images: ["/uploads/potensi/petelur-1.jpg"],
        },
        {
            title: "Peternakan Bebek",
            description: "Bebek dimanfaatkan untuk produksi telur dan daging.",
            images: ["/uploads/potensi/bebek-1.jpg"],
        },
        {
            title: "Budidaya Lele",
            description: "Kolam lele menghasilkan panen rutin untuk pasar lokal.",
            images: ["/uploads/potensi/lele-1.jpg"],
        },
        {
            title: "Budidaya Nila",
            description: "Ikan nila dibudidayakan menggunakan kolam air tawar.",
            images: ["/uploads/potensi/nila-1.jpg"],
        },
        {
            title: "Budidaya Gurame",
            description: "Gurame memiliki nilai ekonomi tinggi di sektor perikanan.",
            images: ["/uploads/potensi/gurame-1.jpg"],
        },
        {
            title: "Budidaya Ikan Mas",
            description: "Budidaya ikan mas berkembang melalui kelompok pembudidaya ikan.",
            images: ["/uploads/potensi/ikan-mas-1.jpg"],
        },
        {
            title: "UMKM Kerajinan Bambu",
            description: "Produk bambu dibuat menjadi berbagai kerajinan bernilai jual.",
            images: ["/uploads/potensi/bambu-1.jpg"],
        },
        {
            title: "UMKM Anyaman Rotan",
            description: "Anyaman rotan dipasarkan sebagai produk rumah tangga.",
            images: ["/uploads/potensi/rotan-1.jpg"],
        },
        {
            title: "UMKM Batik",
            description: "Pengrajin batik menghasilkan motif khas desa.",
            images: ["/uploads/potensi/batik-1.jpg"],
        },
        {
            title: "UMKM Tenun",
            description: "Produk tenun menjadi salah satu identitas budaya desa.",
            images: ["/uploads/potensi/tenun-1.jpg"],
        },
        {
            title: "UMKM Mebel",
            description: "Mebel kayu diproduksi oleh pengrajin lokal.",
            images: ["/uploads/potensi/mebel-1.jpg"],
        },
        {
            title: "UMKM Pengolahan Keripik",
            description: "Keripik singkong dan pisang dipasarkan hingga luar daerah.",
            images: ["/uploads/potensi/keripik-1.jpg"],
        },
        {
            title: "UMKM Kopi Bubuk",
            description: "Kopi lokal diolah menjadi produk siap konsumsi.",
            images: ["/uploads/potensi/kopi-1.jpg"],
        },
        {
            title: "UMKM Gula Aren",
            description: "Gula aren diproduksi secara tradisional oleh masyarakat.",
            images: ["/uploads/potensi/gula-aren-1.jpg"],
        },
        {
            title: "UMKM Madu Hutan",
            description: "Madu alami dipanen dan dikemas sebagai produk unggulan.",
            images: ["/uploads/potensi/madu-1.jpg"],
        },
        {
            title: "Wisata Air Terjun",
            description: "Air terjun menjadi destinasi wisata alam favorit.",
            images: ["/uploads/potensi/air-terjun-1.jpg"],
        },
        {
            title: "Wisata Bukit",
            description: "Bukit menawarkan panorama alam dan spot fotografi.",
            images: ["/uploads/potensi/bukit-1.jpg"],
        },
        {
            title: "Wisata Embung",
            description: "Embung dimanfaatkan sebagai wisata sekaligus irigasi.",
            images: ["/uploads/potensi/embung-1.jpg"],
        },
        {
            title: "Wisata Sungai",
            description: "Sungai menjadi lokasi rekreasi keluarga dan aktivitas alam.",
            images: ["/uploads/potensi/sungai-1.jpg"],
        },
        {
            title: "Wisata Camping Ground",
            description: "Area perkemahan mendukung kegiatan wisata alam.",
            images: ["/uploads/potensi/camping-1.jpg"],
        },
        {
            title: "Agrowisata",
            description: "Agrowisata memberikan pengalaman edukasi pertanian.",
            images: ["/uploads/potensi/agrowisata-1.jpg"],
        },
        {
            title: "Wisata Edukasi Pertanian",
            description: "Pengunjung dapat belajar proses budidaya tanaman.",
            images: ["/uploads/potensi/edukasi-1.jpg"],
        },
        {
            title: "Sentra Bibit Tanaman",
            description: "Pembibitan tanaman hortikultura memenuhi kebutuhan petani.",
            images: ["/uploads/potensi/bibit-1.jpg"],
        },
        {
            title: "Sentra Pupuk Organik",
            description: "Pupuk organik diproduksi dari limbah peternakan.",
            images: ["/uploads/potensi/pupuk-1.jpg"],
        },
        {
            title: "Produksi Kompos",
            description: "Kompos dimanfaatkan untuk meningkatkan kesuburan tanah.",
            images: ["/uploads/potensi/kompos-1.jpg"],
        },
        {
            title: "Budidaya Jamur Tiram",
            description: "Jamur tiram dibudidayakan untuk kebutuhan pasar lokal.",
            images: ["/uploads/potensi/jamur-1.jpg"],
        },
        {
            title: "Budidaya Melon",
            description: "Melon memiliki kualitas unggul dan dipasarkan ke supermarket.",
            images: ["/uploads/potensi/melon-1.jpg"],
        },
        {
            title: "Budidaya Semangka",
            description: "Semangka dipanen pada musim tertentu dengan hasil melimpah.",
            images: ["/uploads/potensi/semangka-1.jpg"],
        },
        {
            title: "Budidaya Timun",
            description: "Timun menjadi salah satu komoditas hortikultura utama.",
            images: ["/uploads/potensi/timun-1.jpg"],
        },
        {
            title: "Budidaya Terong",
            description: "Terong dipasarkan ke pasar tradisional setiap hari.",
            images: ["/uploads/potensi/terong-1.jpg"],
        },
        {
            title: "Budidaya Kacang Panjang",
            description: "Kacang panjang memiliki permintaan pasar yang stabil.",
            images: ["/uploads/potensi/kacang-1.jpg"],
        },
        {
            title: "Budidaya Ubi Kayu",
            description: "Ubi kayu menjadi bahan baku industri pangan.",
            images: ["/uploads/potensi/ubi-1.jpg"],
        },
        {
            title: "Budidaya Ubi Jalar",
            description: "Ubi jalar diolah menjadi berbagai produk pangan.",
            images: ["/uploads/potensi/ubi-jalar-1.jpg"],
        },
        {
            title: "Perkebunan Kelapa",
            description: "Kelapa dimanfaatkan untuk berbagai produk turunan.",
            images: ["/uploads/potensi/kelapa-1.jpg"],
        },
        {
            title: "Perkebunan Kakao",
            description: "Kakao menjadi komoditas perkebunan bernilai tinggi.",
            images: ["/uploads/potensi/kakao-1.jpg"],
        },
        {
            title: "Perkebunan Kopi",
            description: "Kopi lokal memiliki cita rasa khas dan dipasarkan dalam bentuk biji maupun bubuk.",
            images: ["/uploads/potensi/kopi-kebun-1.jpg"],
        },
        {
            title: "Perkebunan Karet",
            description: "Getah karet menjadi sumber pendapatan masyarakat.",
            images: ["/uploads/potensi/karet-1.jpg"],
        },
        {
            title: "Budidaya Anggrek",
            description: "Tanaman hias anggrek menjadi produk unggulan desa.",
            images: ["/uploads/potensi/anggrek-1.jpg"],
        },
        {
            title: "Budidaya Tanaman Hias",
            description: "Berbagai tanaman hias dipasarkan ke berbagai kota.",
            images: ["/uploads/potensi/tanaman-hias-1.jpg"],
        },
        {
            title: "Sentra Kuliner Desa",
            description: "Kuliner khas desa menjadi daya tarik wisatawan.",
            images: ["/uploads/potensi/kuliner-1.jpg"],
        },
        {
            title: "Pasar Desa",
            description: "Pasar desa menjadi pusat aktivitas ekonomi masyarakat.",
            images: ["/uploads/potensi/pasar-1.jpg"],
        }
    ];

    for (const item of potensiList) {
        // Cek berdasarkan title
        const existing = await prisma.potensiEkonomi.findFirst({
            where: {
                title: item.title,
            },
        });

        if (existing) {
            // Update data
            await prisma.potensiEkonomi.update({
                where: {
                    id: existing.id,
                },
                data: {
                    description: item.description,
                    images: {
                        deleteMany: {},
                        create: item.images.map((imageUrl) => ({
                            imageUrl,
                        })),
                    },
                },
            });

            console.log(`✅ Updated: ${item.title}`);
        } else {
            // Create data baru
            await prisma.potensiEkonomi.create({
                data: {
                    title: item.title,
                    description: item.description,
                    images: {
                        create: item.images.map((imageUrl) => ({
                            imageUrl,
                        })),
                    },
                },
            });

            console.log(`✅ Created: ${item.title}`);
        }
    }

    console.log('🎉 Seeder Potensi Ekonomi selesai.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });