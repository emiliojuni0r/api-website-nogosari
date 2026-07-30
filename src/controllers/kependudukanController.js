import xlsx from 'xlsx';
import prisma from '../config/db.js';

// --- FUNGSI HELPER UNTUK MEMBACA SHEET LAPORAN (Reg Lahir & Mati) ---
const hitungDataLaporan = (sheet) => {
    if (!sheet) return 0;
    
    // Pada gambar Anda, Header tabel selalu berada di baris ke-5 (index 4)
    const rows = xlsx.utils.sheet_to_json(sheet, { range: 4 });
    let count = 0;

    for (const row of rows) {
        // Gabungkan semua nilai di baris ini menjadi satu teks untuk mempermudah pengecekan
        const rowString = Object.values(row).join(' ').toUpperCase();

        // 1. Cek jika bulan tersebut tidak ada data (Ada teks NIHIL besar)
        if (rowString.includes('NIHIL')) {
            return 0; // Langsung kembalikan 0
        }

        // 2. Berhenti menghitung jika sudah sampai di area tanda tangan pengesahan
        if (rowString.includes('MENGETAHUI') || rowString.includes('KEPALA DESA') || rowString.includes('SEKRETARIS')) {
            break;
        }

        // 3. Validasi baris: Data yang sah harus punya Nomor Urut dan Nama
        const no = row['NO'] || row['NO.'] || row['no'];
        const nama = row['NAMA'] || row['nama'] || row['Nama'];

        if (no !== undefined && !isNaN(parseInt(no)) && nama) {
            count++;
        }
    }
    return count;
};


// 1. UPLOAD & OLAH FILE EXCEL (Admin - Protected)
export const uploadKependudukanExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Berkas Excel wajib diunggah." });
        }

        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });

        const sheetDataFix = workbook.Sheets['DATA FIX'];
        if (!sheetDataFix) {
            return res.status(400).json({ message: "Lembar kerja 'DATA FIX' tidak ditemukan di dalam Excel." });
        }

        const dataFixRows = xlsx.utils.sheet_to_json(sheetDataFix);

        // --- TAMBAHAN: PROSES SHEET LAHIR & MATI MENGGUNAKAN FUNGSI HELPER ---
        const sheetLahir = workbook.Sheets['Reg. Lahir'];
        const sheetMati = workbook.Sheets['Reg. Mati'];

        const totalKelahiran = hitungDataLaporan(sheetLahir);
        const totalKematian = hitungDataLaporan(sheetMati);
        // ---------------------------------------------------------------------

        const stats = {
            UMUR: {}, PENDIDIKAN: {}, PEKERJAAN: {}, PERKAWINAN: {}, AGAMA: {}, DUSUN: {}, RT: {}
        };

        const uniqueKK = new Set();

        dataFixRows.forEach(row => {
            const rawGender = String(row.jenis_klmn || row.jenis_klmin || '').toUpperCase().trim();
            if (!['L', 'P', 'LAKI-LAKI', 'PEREMPUAN'].includes(rawGender)) {
                return;
            }
            const gender = (rawGender === 'LAKI-LAKI' || rawGender === 'L') ? 'L' : 'P';
            const umur = parseInt(row.Umur) || 0;

            let dusun = String(row['alamat (Dusun)'] || 'TIDAK DIKETAHUI').toUpperCase().trim();
            dusun = dusun.replace(/^DUSUN\s+/i, '');
            if (dusun === 'SONGAI KENIK') dusun = 'SUNGAI KENIK';

            let rt = String(row.no_rt || row.NO_RT || row.No_RT || 'TIDAK DIKETAHUI').trim();
            if (rt !== 'TIDAK DIKETAHUI') {
                if (!rt.toUpperCase().startsWith('RT')) {
                    rt = 'RT ' + rt.padStart(2, '0');
                } else {
                    rt = rt.toUpperCase();
                }
            }

            let agama = String(row.agama || 'LAINNYA').toUpperCase().trim();
            let statusKawin = String(row.stat_kwn || 'BELUM KAWIN').toUpperCase().trim();

            let pendidikan = String(row.pddk_akh || 'TIDAK DIKETAHUI').toUpperCase().trim();
            if (['BELUM SEKOLAH', 'BELUM/TIDAK BERSEKOLAH'].includes(pendidikan)) pendidikan = 'TIDAK/BELUM SEKOLAH';
            if (pendidikan === 'SD/SEDERAJAT') pendidikan = 'TAMAT SD/SEDERAJAT';
            if (pendidikan === 'TAMAT SLTA/SEDERAJAT') pendidikan = 'SLTA/SEDERAJAT';
            if (['DIPLOMA IV/STRATA 1', 'S1/SEDERAJAT', 'SARJANA/S1'].includes(pendidikan)) pendidikan = 'DIPLOMA IV/STRATA I';

            let pekerjaan = String(row.jenis_pkrjn || 'BELUM/TIDAK BEKERJA').toUpperCase().trim();
            if (pekerjaan === 'TIDAK/BELUM BEKERJA') pekerjaan = 'BELUM/TIDAK BEKERJA';
            if (pekerjaan === 'IBU RUMAH TANGGA') pekerjaan = 'MENGURUS RUMAH TANGGA';
            if (pekerjaan === 'BURUH TANI') pekerjaan = 'BURUH TANI/PERKEBUNAN';

            const noKK = row.no_kk || row.NO_KK || row.No_KK;
            if (noKK) uniqueKK.add(noKK);

            let kelompokUmur = '65+ thn';
            if (umur <= 5) kelompokUmur = '0-5 thn';
            else if (umur <= 12) kelompokUmur = '6-12 thn';
            else if (umur <= 21) kelompokUmur = '13-21 thn';
            else if (umur <= 49) kelompokUmur = '22-49 thn';
            else if (umur <= 64) kelompokUmur = '50-64 thn';

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
            akumulasi('RT', rt); 
        });

        await prisma.$transaction([
            prisma.kependudukanStat.deleteMany({}),

            prisma.kependudukanStat.createMany({
                data: [
                    ...Object.keys(stats.DUSUN).map(label => ({ type: 'DUSUN', label, maleCount: stats.DUSUN[label].male, femaleCount: stats.DUSUN[label].female, totalCount: stats.DUSUN[label].total })),
                    ...Object.keys(stats.RT).map(label => ({ type: 'RT', label, maleCount: stats.RT[label].male, femaleCount: stats.RT[label].female, totalCount: stats.RT[label].total })),
                    ...Object.keys(stats.UMUR).map(label => ({ type: 'UMUR', label, maleCount: stats.UMUR[label].male, femaleCount: stats.UMUR[label].female, totalCount: stats.UMUR[label].total })),
                    ...Object.keys(stats.AGAMA).map(label => ({ type: 'AGAMA', label, totalCount: stats.AGAMA[label].total })),
                    ...Object.keys(stats.PENDIDIKAN).map(label => ({ type: 'PENDIDIKAN', label, totalCount: stats.PENDIDIKAN[label].total })),
                    ...Object.keys(stats.PEKERJAAN).map(label => ({ type: 'PEKERJAAN', label, totalCount: stats.PEKERJAAN[label].total })),
                    ...Object.keys(stats.PERKAWINAN).map(label => ({ type: 'PERKAWINAN', label, totalCount: stats.PERKAWINAN[label].total })),

                    { type: 'SUMMARY', label: 'TOTAL_KK', totalCount: uniqueKK.size },
                    // --- SIMPAN HASIL PERHITUNGAN LAHIR & MATI ---
                    { type: 'SUMMARY', label: 'TOTAL_LAHIR', totalCount: totalKelahiran },
                    { type: 'SUMMARY', label: 'TOTAL_MATI', totalCount: totalKematian }
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

        const lastUpdated = records.length > 0 ? records[0].updatedAt : null;

        const umurRecords = records.filter(r => r.type === 'UMUR');
        const dusunRecords = records.filter(r => r.type === 'DUSUN');
        const pendidikanRecords = records.filter(r => r.type === 'PENDIDIKAN');
        const pekerjaanRecords = records.filter(r => r.type === 'PEKERJAAN');
        const agamaRecords = records.filter(r => r.type === 'AGAMA');
        const perkawinanRecords = records.filter(r => r.type === 'PERKAWINAN');
        const rtRecords = records.filter(r => r.type === 'RT').sort((a, b) => a.label.localeCompare(b.label));

        // --- AMBIL RECORD LAHIR & MATI ---
        const kkRecord = records.find(r => r.type === 'SUMMARY' && r.label === 'TOTAL_KK');
        const lahirRecord = records.find(r => r.type === 'SUMMARY' && r.label === 'TOTAL_LAHIR');
        const matiRecord = records.find(r => r.type === 'SUMMARY' && r.label === 'TOTAL_MATI');

        const totalPenduduk = dusunRecords.reduce((sum, item) => sum + item.totalCount, 0);
        const totalLakiLaki = dusunRecords.reduce((sum, item) => sum + (item.maleCount || 0), 0);
        const totalPerempuan = dusunRecords.reduce((sum, item) => sum + (item.femaleCount || 0), 0);
        const totalKK = kkRecord ? kkRecord.totalCount : 0;
        
        const totalLahir = lahirRecord ? lahirRecord.totalCount : 0;
        const totalMati = matiRecord ? matiRecord.totalCount : 0;

        const labelsUmur = ['0-5 thn', '6-12 thn', '13-21 thn', '22-49 thn', '50-64 thn', '65+ thn'];
        const chartDataUmur = {
            labels: labelsUmur,
            datasets: [
                { label: 'Laki-Laki', data: labelsUmur.map(lbl => umurRecords.find(u => u.label === lbl)?.maleCount || 0), backgroundColor: '#3b82f6', borderRadius: 6 },
                { label: 'Perempuan', data: labelsUmur.map(lbl => umurRecords.find(u => u.label === lbl)?.femaleCount || 0), backgroundColor: '#ec4899', borderRadius: 6 }
            ]
        };

        const chartDataDusun = {
            labels: dusunRecords.map(d => d.label),
            datasets: [{ label: 'Jumlah Penduduk', data: dusunRecords.map(d => d.totalCount), backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#6b7280'], borderWidth: 1 }]
        };

        const chartDataPendidikan = {
            labels: pendidikanRecords.map(p => p.label),
            datasets: [{ label: 'Jumlah Penduduk', data: pendidikanRecords.map(p => p.totalCount), backgroundColor: '#10b981', borderRadius: 6 }]
        };

        const chartDataPekerjaan = {
            labels: pekerjaanRecords.map(p => p.label),
            datasets: [{ label: 'Jumlah Penduduk', data: pekerjaanRecords.map(p => p.totalCount), backgroundColor: '#f59e0b', borderRadius: 6 }]
        };

        const chartDataAgama = {
            labels: agamaRecords.map(a => a.label),
            datasets: [{ label: 'Jumlah Penduduk', data: agamaRecords.map(a => a.totalCount), backgroundColor: ['#10b981', '#3b82f6', '#6366f1', '#f59e0b', '#ec4899'], borderWidth: 1 }]
        };

        const chartDataPerkawinan = {
            labels: perkawinanRecords.map(pk => pk.label),
            datasets: [{ label: 'Jumlah Penduduk', data: perkawinanRecords.map(pk => pk.totalCount), backgroundColor: ['#6366f1', '#ec4899', '#f59e0b', '#10b981'], borderWidth: 1 }]
        };

        const chartDataRT = {
            labels: rtRecords.map(rt => rt.label),
            datasets: [{ label: 'Jumlah Penduduk per RT', data: rtRecords.map(rt => rt.totalCount), backgroundColor: '#8b5cf6', borderRadius: 6 }]
        };

        // --- CHART BARU: KELAHIRAN & KEMATIAN ---
        const chartDataLahirMati = {
            labels: ['Kelahiran', 'Kematian'],
            datasets: [
                {
                    label: 'Jumlah Jiwa',
                    data: [totalLahir, totalMati],
                    // Kelahiran menggunakan warna Hijau (#10b981), Kematian menggunakan warna Merah (#ef4444)
                    backgroundColor: ['#10b981', '#ef4444'], 
                    borderRadius: 6
                }
            ]
        };

        res.status(200).json({
            message: "Berhasil memuat statistik kependudukan desa",
            lastUpdated,
            summary: {
                totalPenduduk,
                totalLakiLaki,
                totalPerempuan,
                totalKK,
                totalLahir, 
                totalMati   
            },
            charts: {
                chartDataUmur,
                chartDataDusun,
                chartDataRT,
                chartDataPendidikan,
                chartDataPekerjaan,
                chartDataAgama,
                chartDataPerkawinan,
                chartDataLahirMati // <-- Chart siap ditarik oleh Frontend
            }
        });

    } catch (error) {
        res.status(500).json({ message: "Gagal memuat data statistik kependudukan.", error: error.message });
    }
};