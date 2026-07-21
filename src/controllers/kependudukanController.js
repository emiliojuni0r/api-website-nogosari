import xlsx from 'xlsx';
import prisma from '../config/db.js';

// 1. UPLOAD & OLAH FILE EXCEL (Admin - Protected)
export const uploadKependudukanExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Berkas Excel wajib diunggah." });
        }

        // Membaca file dari buffer RAM
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });

        const sheetDataFix = workbook.Sheets['DATA FIX'];
        if (!sheetDataFix) {
            return res.status(400).json({ message: "Lembar kerja 'DATA FIX' tidak ditemukan di dalam Excel." });
        }

        const dataFixRows = xlsx.utils.sheet_to_json(sheetDataFix);

        // Wadah akumulator memori untuk kalkulasi data statistik
        const stats = {
            UMUR: {}, PENDIDIKAN: {}, PEKERJAAN: {}, PERKAWINAN: {}, AGAMA: {}, DUSUN: {}
        };

        const uniqueKK = new Set();

        dataFixRows.forEach(row => {
            // 1. FILTERING DATA KOTOR (Lewati baris yang isinya cuma nomor kolom)
            const rawGender = String(row.jenis_klmn || row.jenis_klmin || '').toUpperCase().trim();
            // Jika kolom gender isinya bukan L atau P (misal angka "4"), skip baris ini!
            if (!['L', 'P', 'LAKI-LAKI', 'PEREMPUAN'].includes(rawGender)) {
                return;
            }
            const gender = (rawGender === 'LAKI-LAKI' || rawGender === 'L') ? 'L' : 'P';
            const umur = parseInt(row.Umur) || 0;

            // 2. CLEANING DATA (Standarisasi Huruf Besar & Penyatuan Nama)

            // DUSUN: Ubah ke uppercase dan hapus kata "DUSUN " di awal jika ada
            let dusun = String(row['alamat (Dusun)'] || 'TIDAK DIKETAHUI').toUpperCase().trim();
            dusun = dusun.replace(/^DUSUN\s+/i, '');

            // Opsional: Satukan typo spesifik
            if (dusun === 'SONGAI KENIK') dusun = 'SUNGAI KENIK';

            // AGAMA & PERKAWINAN: Cukup di-uppercase agar seragam
            let agama = String(row.agama || 'LAINNYA').toUpperCase().trim();
            let statusKawin = String(row.stat_kwn || 'BELUM KAWIN').toUpperCase().trim();

            // PENDIDIKAN: Uppercase & Satukan label yang bermakna sama
            let pendidikan = String(row.pddk_akh || 'TIDAK DIKETAHUI').toUpperCase().trim();
            if (['BELUM SEKOLAH', 'BELUM/TIDAK BERSEKOLAH'].includes(pendidikan)) pendidikan = 'TIDAK/BELUM SEKOLAH';
            if (pendidikan === 'SD/SEDERAJAT') pendidikan = 'TAMAT SD/SEDERAJAT';
            if (pendidikan === 'TAMAT SLTA/SEDERAJAT') pendidikan = 'SLTA/SEDERAJAT';
            if (['DIPLOMA IV/STRATA 1', 'S1/SEDERAJAT', 'SARJANA/S1'].includes(pendidikan)) pendidikan = 'DIPLOMA IV/STRATA I';

            // PEKERJAAN: Uppercase & Satukan label yang bermakna sama
            let pekerjaan = String(row.jenis_pkrjn || 'BELUM/TIDAK BEKERJA').toUpperCase().trim();
            if (pekerjaan === 'TIDAK/BELUM BEKERJA') pekerjaan = 'BELUM/TIDAK BEKERJA';
            if (pekerjaan === 'IBU RUMAH TANGGA') pekerjaan = 'MENGURUS RUMAH TANGGA';
            if (pekerjaan === 'BURUH TANI') pekerjaan = 'BURUH TANI/PERKEBUNAN';


            // Masukkan no_kk ke dalam Set
            const noKK = row.no_kk || row.NO_KK || row.No_KK;
            if (noKK) uniqueKK.add(noKK);

            // Aturan pengelompokan umur
            let kelompokUmur = '65+ thn';
            if (umur <= 5) kelompokUmur = '0-5 thn';
            else if (umur <= 12) kelompokUmur = '6-12 thn';
            else if (umur <= 21) kelompokUmur = '13-21 thn';
            else if (umur <= 49) kelompokUmur = '22-49 thn';
            else if (umur <= 64) kelompokUmur = '50-64 thn';

            // Pembantu fungsi akumulasi
            const akumulasi = (kategori, label) => {
                if (!label) return;
                if (!stats[kategori][label]) {
                    stats[kategori][label] = { male: 0, female: 0, total: 0 };
                }
                if (gender === 'L') stats[kategori][label].male++;
                if (gender === 'P') stats[kategori][label].female++;
                stats[kategori][label].total++;
            };

            akumulasi('UMUR', kelompokUmur);
            akumulasi('AGAMA', agama);
            akumulasi('PENDIDIKAN', pendidikan);
            akumulasi('PEKERJAAN', pekerjaan);
            akumulasi('PERKAWINAN', statusKawin);
            akumulasi('DUSUN', dusun);
        });

        // Transaksi Database Prisma... (Sama seperti sebelumnya)
        await prisma.$transaction([
            prisma.kependudukanStat.deleteMany({}),

            prisma.kependudukanStat.createMany({
                data: [
                    ...Object.keys(stats.DUSUN).map(label => ({ type: 'DUSUN', label, maleCount: stats.DUSUN[label].male, femaleCount: stats.DUSUN[label].female, totalCount: stats.DUSUN[label].total })),
                    ...Object.keys(stats.UMUR).map(label => ({ type: 'UMUR', label, maleCount: stats.UMUR[label].male, femaleCount: stats.UMUR[label].female, totalCount: stats.UMUR[label].total })),
                    ...Object.keys(stats.AGAMA).map(label => ({ type: 'AGAMA', label, totalCount: stats.AGAMA[label].total })),
                    ...Object.keys(stats.PENDIDIKAN).map(label => ({ type: 'PENDIDIKAN', label, totalCount: stats.PENDIDIKAN[label].total })),
                    ...Object.keys(stats.PEKERJAAN).map(label => ({ type: 'PEKERJAAN', label, totalCount: stats.PEKERJAAN[label].total })),
                    ...Object.keys(stats.PERKAWINAN).map(label => ({ type: 'PERKAWINAN', label, totalCount: stats.PERKAWINAN[label].total })),

                    { type: 'SUMMARY', label: 'TOTAL_KK', totalCount: uniqueKK.size }
                ]
            })
        ]);

        res.status(200).json({ message: "Data kependudukan (.xlsx) berhasil diolah dan diunggah ke database." });
    } catch (error) {
        console.error("Error import Excel kependudukan:", error);
        res.status(500).json({ message: "Gagal memproses file Excel kependudukan.", error: error.message });
    }
};

// 2. AMBIL DATA FORMATTED UNTUK CHARTJS (Public - Web Desa & Admin)
export const getKependudukanData = async (req, res) => {
    try {
        const records = await prisma.kependudukanStat.findMany();

        // Menyaring data mentah berdasarkan jenis pengelompokan
        const umurRecords = records.filter(r => r.type === 'UMUR');
        const dusunRecords = records.filter(r => r.type === 'DUSUN');
        const pendidikanRecords = records.filter(r => r.type === 'PENDIDIKAN');
        const pekerjaanRecords = records.filter(r => r.type === 'PEKERJAAN');
        const agamaRecords = records.filter(r => r.type === 'AGAMA');
        const perkawinanRecords = records.filter(r => r.type === 'PERKAWINAN');

        // Ambil record spesial KK
        const kkRecord = records.find(r => r.type === 'SUMMARY' && r.label === 'TOTAL_KK');

        // Agregasi Data Global (Menggunakan data dari Dusun yang sudah dihitung)
        const totalPenduduk = dusunRecords.reduce((sum, item) => sum + item.totalCount, 0);
        const totalLakiLaki = dusunRecords.reduce((sum, item) => sum + (item.maleCount || 0), 0);
        const totalPerempuan = dusunRecords.reduce((sum, item) => sum + (item.femaleCount || 0), 0);
        const totalKK = kkRecord ? kkRecord.totalCount : 0;

        // 1. Format Objek untuk Grafik Umur (Bar Chart Berlapis Ganda)
        const labelsUmur = ['0-5 thn', '6-12 thn', '13-21 thn', '22-49 thn', '50-64 thn', '65+ thn'];
        const chartDataUmur = {
            labels: labelsUmur,
            datasets: [
                {
                    label: 'Laki-Laki',
                    data: labelsUmur.map(lbl => umurRecords.find(u => u.label === lbl)?.maleCount || 0),
                    backgroundColor: '#3b82f6',
                    borderRadius: 6,
                },
                {
                    label: 'Perempuan',
                    data: labelsUmur.map(lbl => umurRecords.find(u => u.label === lbl)?.femaleCount || 0),
                    backgroundColor: '#ec4899',
                    borderRadius: 6,
                }
            ]
        };

        // 2. Format Objek untuk Grafik Dusun (Pie Chart)
        const chartDataDusun = {
            labels: dusunRecords.map(d => d.label),
            datasets: [
                {
                    label: 'Jumlah Penduduk',
                    data: dusunRecords.map(d => d.totalCount),
                    backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#6b7280'],
                    borderWidth: 1
                }
            ]
        };

        // 3. Format Objek untuk Grafik Pendidikan (Bar Chart Vertikal)
        const chartDataPendidikan = {
            labels: pendidikanRecords.map(p => p.label),
            datasets: [
                {
                    label: 'Jumlah Penduduk',
                    data: pendidikanRecords.map(p => p.totalCount),
                    backgroundColor: '#10b981',
                    borderRadius: 6
                }
            ]
        };

        // 4. Format Objek untuk Grafik Pekerjaan (Horizontal Bar Chart)
        const chartDataPekerjaan = {
            labels: pekerjaanRecords.map(p => p.label),
            datasets: [
                {
                    label: 'Jumlah Penduduk',
                    data: pekerjaanRecords.map(p => p.totalCount),
                    backgroundColor: '#f59e0b',
                    borderRadius: 6
                }
            ]
        };

        // 5. Format Objek untuk Grafik Agama (Doughnut/Pie Chart)
        const chartDataAgama = {
            labels: agamaRecords.map(a => a.label),
            datasets: [
                {
                    label: 'Jumlah Penduduk',
                    data: agamaRecords.map(a => a.totalCount),
                    backgroundColor: ['#10b981', '#3b82f6', '#6366f1', '#f59e0b', '#ec4899'],
                    borderWidth: 1
                }
            ]
        };

        // 6. Format Objek untuk Grafik Perkawinan
        const chartDataPerkawinan = {
            labels: perkawinanRecords.map(pk => pk.label),
            datasets: [
                {
                    label: 'Jumlah Penduduk',
                    data: perkawinanRecords.map(pk => pk.totalCount),
                    backgroundColor: ['#6366f1', '#ec4899', '#f59e0b', '#10b981'],
                    borderWidth: 1
                }
            ]
        };

        // Kirimkan satu paket utuh data ringkasan ke frontend
        res.status(200).json({
            message: "Berhasil memuat statistik kependudukan desa",
            summary: {
                totalPenduduk,
                totalLakiLaki,
                totalPerempuan,
                totalKK
            },
            charts: {
                chartDataUmur,
                chartDataDusun,
                chartDataPendidikan,
                chartDataPekerjaan,
                chartDataAgama,
                chartDataPerkawinan
            }
        });

    } catch (error) {
        res.status(500).json({ message: "Gagal memuat data statistik kependudukan.", error: error.message });
    }
};