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

        // ----------------------------------------------------
        // KELOMPOK A: PROSES SHEET 'DATA FIX' (Umur, Agama, Pendidikan, Pekerjaan, Perkawinan)
        // ----------------------------------------------------
        const sheetDataFix = workbook.Sheets['DATA FIX'];
        if (!sheetDataFix) {
            return res.status(400).json({ message: "Lembar kerja 'DATA FIX' tidak ditemukan di dalam Excel." });
        }
        
        const dataFixRows = xlsx.utils.sheet_to_json(sheetDataFix);

        // Wadah akumulator memori untuk kalkulasi data statistik
        const stats = {
            UMUR: {},
            PENDIDIKAN: {},
            PEKERJAAN: {},
            PERKAWINAN: {},
            AGAMA: {}
        };

        dataFixRows.forEach(row => {
            const gender = String(row.jenis_klmn || '').toUpperCase().trim(); // 'L' atau 'P'
            const umur = parseInt(row.umur);
            const agama = String(row.agama || 'Lainnya').trim();
            const pendidikan = String(row.pddk_akh || 'Tidak Diketahui').trim();
            const pekerjaan = String(row.jenis_pkrjn || 'Belum/Tidak Bekerja').trim();
            const statusKawin = String(row.stat_kwn || 'Belum Kawin').trim();

            // Aturan pengelompokan umur sesuai spek ChartJS Anda
            let kelompokUmur = '65+ thn';
            if (umur <= 5) kelompokUmur = '0-5 thn';
            else if (umur <= 12) kelompokUmur = '6-12 thn';
            else if (umur <= 21) kelompokUmur = '13-21 thn';
            else if (umur <= 49) kelompokUmur = '22-49 thn';
            else if (umur <= 64) kelompokUmur = '50-64 thn';

            // Pembantu fungsi (helper) untuk mengagregasikan hitungan ke memori
            const akumulasi = (kategori, label) => {
                if (!label) return;
                if (!stats[kategori][label]) {
                    stats[kategori][label] = { male: 0, female: 0, total: 0 };
                }
                if (gender === 'L' || gender === 'LAKI-LAKI') stats[kategori][label].male++;
                if (gender === 'P' || gender === 'PEREMPUAN') stats[kategori][label].female++;
                stats[kategori][label].total++;
            };

            akumulasi('UMUR', kelompokUmur);
            akumulasi('AGAMA', agama);
            akumulasi('PENDIDIKAN', pendidikan);
            akumulasi('PEKERJAAN', pekerjaan);
            akumulasi('PERKAWINAN', statusKawin);
        });

        // ----------------------------------------------------
        // KELOMPOK B: PROSES SHEET '(1) REKAP' (Untuk Grafik Dusun)
        // ----------------------------------------------------
        const sheetRekap = workbook.Sheets['(1) REKAP'];
        const dusunStats = [];
        
        if (sheetRekap) {
            const rekapRows = xlsx.utils.sheet_to_json(sheetRekap);
            rekapRows.forEach(row => {
                const namaDusun = row['Nama Dusun'] || row['nama_dusun'] || row['Dusun'];
                const wniL = parseInt(row['WNI L'] || row['wni_l'] || 0);
                const wniP = parseInt(row['WNI P'] || row['wni_p'] || 0);

                if (namaDusun) {
                    dusunStats.push({
                        type: 'DUSUN',
                        label: String(namaDusun).trim(),
                        maleCount: wniL,
                        femaleCount: wniP,
                        totalCount: wniL + wniP
                    });
                }
            });
        }

        // ----------------------------------------------------
        // KELOMPOK C: TRANSAKSI DATABASE (Hapus data lama, Tulis baru)
        // ----------------------------------------------------
        // Memakai Prisma Transaction agar jika ada salah satu proses gagal, database tidak rusak/parsial
        await prisma.$transaction([
            prisma.kependudukanStat.deleteMany({}), // Kosongkan statistik lama terlebih dahulu

            prisma.kependudukanStat.createMany({
                data: [
                    ...dusunStats,
                    ...Object.keys(stats.UMUR).map(label => ({ type: 'UMUR', label, maleCount: stats.UMUR[label].male, femaleCount: stats.UMUR[label].female, totalCount: stats.UMUR[label].total })),
                    ...Object.keys(stats.AGAMA).map(label => ({ type: 'AGAMA', label, totalCount: stats.AGAMA[label].total })),
                    ...Object.keys(stats.PENDIDIKAN).map(label => ({ type: 'PENDIDIKAN', label, totalCount: stats.PENDIDIKAN[label].total })),
                    ...Object.keys(stats.PEKERJAAN).map(label => ({ type: 'PEKERJAAN', label, totalCount: stats.PEKERJAAN[label].total })),
                    ...Object.keys(stats.PERKAWINAN).map(label => ({ type: 'PERKAWINAN', label, totalCount: stats.PERKAWINAN[label].total })),
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

        // Total Penduduk & Total Kepala Keluarga (Agregasi global)
        const totalPenduduk = records.filter(r => r.type === 'DUSUN').reduce((sum, item) => sum + item.totalCount, 0);

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
                totalPenduduk: totalPenduduk
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