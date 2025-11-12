// --- KONFIGURASI DAN DATA AWAL ---

// 1. Definisikan Bobot Kriteria (W) - Total harus 1.0
const weights = {
    jiwa: 0.40,
    kk: 0.25,
    kerusakan: 0.20,
    jenis: 0.15,
};

// 2. Definisikan Skor Kuantifikasi untuk Kriteria Kualitatif
const quantificationScores = {
    kerusakan: { 'Ringan': 1, 'Sedang': 2, 'Berat': 3 },
    jenis: { 'Angin Puting Beliung': 1, 'Banjir': 2, 'Tanah Longsor': 3, 'Gempa Bumi': 4 }
};

// 3. Data will be loaded from database
let allReportData = []; // Variabel global untuk semua data

/**
 * Format date to Indonesian format: "16 Oktober 2025"
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {string} Formatted date string
 */
function formatDate(dateString) {
    if (!dateString || dateString === '0000-00-00') {
        return 'Tanggal tidak valid';
    }
    const date = new Date(dateString);
    const day = date.getDate();
    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
}

// --- FUNGSI UTAMA APLIKASI ---

/**
 * Fungsi inti yang menjalankan algoritma Simple Additive Weighting (SAW)
 * @param {Array} data - Array objek data BENCANA (BUKAN INSIDEN)
 * @returns {Array} Array objek data bencana yang sudah dihitung skor dan diurutkan
 */
function runSAW(data) {
    if (data.length === 0) return [];

    // Langkah 1: Kuantifikasi -> Ubah data kualitatif (string) menjadi angka (skor)
    const quantifiedData = data.map(item => ({
        ...item,
        skorKerusakan: quantificationScores.kerusakan[item.tingkatKerusakan] || 0,
        skorJenis: quantificationScores.jenis[item.jenisBencana] || 0
    }));

    // Langkah 2: Cari nilai maksimum untuk setiap kriteria (untuk normalisasi)
    const maxValues = {
        jiwa: Math.max(1, ...quantifiedData.map(d => d.jiwaTerdampak)),
        kk: Math.max(1, ...quantifiedData.map(d => d.kkTerdampak)),
        kerusakan: Math.max(1, ...quantifiedData.map(d => d.skorKerusakan)),
        jenis: Math.max(1, ...quantifiedData.map(d => d.skorJenis))
    };

    // Langkah 3: Normalisasi -> Ubah semua skor ke skala 0-1
    const normalizedData = quantifiedData.map(item => ({
        ...item,
        normJiwa: (item.jiwaTerdampak || 0) / maxValues.jiwa,
        normKk: (item.kkTerdampak || 0) / maxValues.kk,
        normKerusakan: (item.skorKerusakan || 0) / maxValues.kerusakan,
        normJenis: (item.skorJenis || 0) / maxValues.jenis,
    }));

    // Langkah 4: Hitung Skor Akhir (V) -> Kalikan nilai normalisasi dengan bobot
    const scoredData = normalizedData.map(item => {
        const score =
            (item.normJiwa * weights.jiwa) +
            (item.normKk * weights.kk) +
            (item.normKerusakan * weights.kerusakan) +
            (item.normJenis * weights.jenis);
        return { ...item, finalScore: score };
    });

    // Langkah 5: Urutkan berdasarkan skor tertinggi
    const sortedData = scoredData.sort((a, b) => b.finalScore - a.finalScore);

    return sortedData;
}

/**
 * Menampilkan data BENCANA (SAW) ke tabel #report-table-body-bencana
 */
function generateBencanaTable(data) {
    const rankedData = runSAW(data); // Jalankan SAW
    const tableBody = document.getElementById('report-table-body-bencana');
    tableBody.innerHTML = '';

    if (rankedData.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="9" class="text-center py-4 text-muted">Belum ada data bencana.</td></tr>`;
        return;
    }

    rankedData.forEach((item, index) => {
        const rank = index + 1;
        const rankColor = rank === 1 ? 'bg-danger-subtle text-danger-emphasis' : (rank === 2 ? 'bg-warning-subtle text-warning-emphasis' : 'bg-success-subtle text-success-emphasis');

        let photoThumbnails = '';
        if (item.photos && item.photos.length > 0) {
            photoThumbnails = '<div class="d-flex flex-wrap gap-1">';
            item.photos.forEach(photo => {
                photoThumbnails += `<img src="${photo.file_path}" alt="Foto bencana" class="img-thumbnail" style="width: 40px; height: 40px; object-fit: cover; cursor: pointer;" data-bs-toggle="modal" data-bs-target="#photo-modal" data-photo-src="${photo.file_path}" data-photo-title="${photo.original_filename}">`;
            });
            photoThumbnails += '</div>';
        } else {
            photoThumbnails = '<span class="text-muted">Tidak ada foto</span>';
        }

        const row = `
            <tr>
                <td class="text-center">
                    <span class="badge ${rankColor} rounded-pill fs-6">${rank}</span>
                </td>
                <td class="fw-medium">${item.jenisBencana}</td>
                <td>${item.lokasi}</td>
                <td>${formatDate(item.disaster_date)}</td>
                <td>${item.jiwaTerdampak} Jiwa / ${item.kkTerdampak} KK</td>
                <td class="text-center">
                     <span class="badge ${
                        item.tingkatKerusakan === 'Berat' ? 'bg-danger-subtle text-danger-emphasis' :
                        item.tingkatKerusakan === 'Sedang' ? 'bg-warning-subtle text-warning-emphasis' : 'bg-secondary-subtle text-secondary-emphasis'
                     } rounded-pill">${item.tingkatKerusakan}</span>
                </td>
                <td class="fw-bold text-primary">${item.finalScore.toFixed(4)}</td>
                <td>${photoThumbnails}</td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-outline-primary edit-btn" data-id="${item.id}" title="Edit">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil" viewBox="0 0 16 16"><path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11a.5.5 0 0 1 .108-.191z"/></svg>
                        </button>
                        <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${item.id}" title="Delete">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5a.5.5 0 0 1-.5-.5V6a.5.5 0 0 0-1 0v6.5A1.5 1.5 0 0 0 9.5 14h1a1.5 1.5 0 0 0 1.5-1.5V6a.5.5 0 0 0-1 0z"/><path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg>
                        </button>
                    </div>
                </td>
            </tr>
        `;
        tableBody.innerHTML += row;
    });
}

/**
 * Menampilkan data INSIDEN (Kronologis) ke tabel #report-table-body-insiden
 */
function generateInsidenTable(data) {
    const tableBody = document.getElementById('report-table-body-insiden');
    tableBody.innerHTML = '';

    if (data.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">Belum ada laporan insiden.</td></tr>`;
        return;
    }

    // Urutkan berdasarkan tanggal terbaru
    data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    data.forEach(item => {
        let photoThumbnails = '';
        if (item.photos && item.photos.length > 0) {
            photoThumbnails = '<div class="d-flex flex-wrap gap-1">';
            item.photos.forEach(photo => {
                photoThumbnails += `<img src="${photo.file_path}" alt="Foto insiden" class="img-thumbnail" style="width: 40px; height: 40px; object-fit: cover; cursor: pointer;" data-bs-toggle="modal" data-bs-target="#photo-modal" data-photo-src="${photo.file_path}" data-photo-title="${photo.original_filename}">`;
            });
            photoThumbnails += '</div>';
        } else {
            photoThumbnails = '<span class="text-muted">Tidak ada foto</span>';
        }

        const row = `
            <tr>
                <td class="fw-medium">${item.jenisBencana}</td>
                <td>${item.lokasi}</td>
                <td>${item.keterangan || '<span class="text-muted">N/A</span>'}</td>
                <td>${formatDate(item.disaster_date)}</td>
                <td>${photoThumbnails}</td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-outline-primary edit-btn" data-id="${item.id}" title="Edit">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil" viewBox="0 0 16 16"><path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11a.5.5 0 0 1 .108-.191z"/></svg>
                        </button>
                        <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${item.id}" title="Delete">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5a.5.5 0 0 1-.5-.5V6a.5.5 0 0 0-1 0v6.5A1.5 1.5 0 0 0 9.5 14h1a1.5 1.5 0 0 0 1.5-1.5V6a.5.5 0 0 0-1 0z"/><path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg>
                        </button>
                    </div>
                </td>
            </tr>
        `;
        tableBody.innerHTML += row;
    });
}


/**
 * Menangani submit form untuk menambah data bencana baru
 * @param {Event} event - Event object dari form submission
 */
function handleFormSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    // Validasi manual untuk input yang mungkin non-required
    const kategori = formData.get('kategoriLaporan');
    if (kategori === 'bencana') {
        if (!formData.get('jiwaTerdampak') || !formData.get('kkTerdampak')) {
             Swal.fire({
                icon: 'error',
                title: 'Gagal!',
                text: 'Untuk Kategori Bencana, Jiwa dan KK Terdampak wajib diisi.',
                confirmButtonColor: '#e60013'
            });
            return;
        }
    }

    // Send data to server
    fetch('save_disaster.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            Swal.fire({
                icon: 'success',
                title: 'Berhasil!',
                text: data.message,
                confirmButtonColor: '#00499d'
            });
            form.reset();
            // Reset form dinamis ke default
            document.getElementById('form-grup-bencana').style.display = 'block';
            document.getElementById('form-grup-insiden').style.display = 'none';
            document.getElementById('jiwaTerdampak').required = true;
            document.getElementById('kkTerdampak').required = true;
            
            loadAndDisplayAllReports(); // Memuat ulang SEMUA data
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Gagal!',
                text: data.message,
                confirmButtonColor: '#e60013'
            });
        }
    })
    .catch(error => {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: 'Terjadi kesalahan saat menyimpan laporan',
            confirmButtonColor: '#e60013'
        });
    });
}

/**
 * Menangani login form
 */
function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    fetch('login.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            Swal.fire({
                icon: 'success',
                title: 'Login Berhasil!',
                text: 'Selamat datang di sistem BPBD.',
                confirmButtonColor: '#00499d',
                timer: 1500,
                showConfirmButton: false
            }).then(() => {
                window.location.reload();
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Login Gagal!',
                text: data.message,
                confirmButtonColor: '#e60013'
            });
        }
    })
    .catch(error => {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: 'Terjadi kesalahan saat login',
            confirmButtonColor: '#e60013'
        });
    });
}

/**
 * [FUNGSI DIPERBARUI] Load disaster data from server
 */
function loadAndDisplayAllReports() {
    fetch('get_disasters.php')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                allReportData = data.data; // Simpan semua data di global

                // 1. Pisahkan data berdasarkan kategori
                const bencanaData = allReportData.filter(d => d.kategori_laporan === 'bencana' || !d.kategori_laporan);
                const insidenData = allReportData.filter(d => d.kategori_laporan === 'insiden');

                // 2. Hancurkan DataTable yang ada
                if ($.fn.DataTable.isDataTable('#disaster-report-table')) {
                    $('#disaster-report-table').DataTable().destroy();
                }
                if ($.fn.DataTable.isDataTable('#insiden-report-table')) {
                    $('#insiden-report-table').DataTable().destroy();
                }

                // 3. Generate HTML untuk setiap tabel
                generateBencanaTable(bencanaData);
                generateInsidenTable(insidenData);

                // Penundaan 10ms untuk memastikan DOM 100% siap
                setTimeout(function() {
                    // HANYA inisialisasi jika ada data bencana
                    if (bencanaData.length > 0) {
                        $('#disaster-report-table').DataTable({
                            "pageLength": 5, "lengthMenu": [3, 5], "responsive": true, "order": [[0, "asc"]],
                            "columnDefs": [ { "orderable": false, "targets": [1, 2, 3, 4, 5, 7, 8] } ],
                            "language": { "search": "Cari:", "lengthMenu": "Tampilkan _MENU_ data", "info": "Menampilkan _START_ sampai _END_ dari _TOTAL_ data", "infoEmpty": "Tidak ada data", "infoFiltered": "(difilter dari _MAX_ total data)", "paginate": { "first": "Pertama", "last": "Terakhir", "next": "Berikutnya", "previous": "Sebelumnya" } }
                        });
                    }
                    
                    // HANYA inisialisasi jika ada data insiden
                    if (insidenData.length > 0) {
                        $('#insiden-report-table').DataTable({
                            "pageLength": 5, "lengthMenu": [3, 5], "responsive": true, "order": [[3, "desc"]],
                            "columnDefs": [ { "orderable": false, "targets": [0, 1, 2, 4, 5] } ],
                            "language": { "search": "Cari:", "lengthMenu": "Tampilkan _MENU_ data", "info": "Menampilkan _START_ sampai _END_ dari _TOTAL_ data", "infoEmpty": "Tidak ada data", "infoFiltered": "(difilter dari _MAX_ total data)", "paginate": { "first": "Pertama", "last": "Terakhir", "next": "Berikutnya", "previous": "Sebelumnya" } }
                        });
                    }
                }, 10); 

            } else {
                console.error('Error loading data:', data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

/**
 * Handle logout
 */
function handleLogout() {
    Swal.fire({
        title: 'Konfirmasi Logout',
        text: 'Apakah Anda yakin ingin keluar dari sistem?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#00499d',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Ya, Logout',
        cancelButtonText: 'Batal'
    }).then((result) => {
        if (result.isConfirmed) {
            Swal.fire({
                title: 'Logout Berhasil!',
                text: 'Terima kasih telah menggunakan sistem BPBD.',
                icon: 'success',
                confirmButtonColor: '#00499d',
                timer: 1500,
                showConfirmButton: false
            }).then(() => {
                window.location.href = 'logout.php';
            });
        }
    });
}

/**
 * [FUNGSI PRINT 1] Mencetak laporan BENCANA (SAW)
 */
function handlePrintReport() {
    const bencanaData = allReportData.filter(d => d.kategori_laporan === 'bencana' || !d.kategori_laporan);
    const rankedData = runSAW(bencanaData);
    
    const previewContent = document.getElementById('preview-content');
    const today = new Date();
    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const month = monthNames[today.getMonth()];
    const year = today.getFullYear();
    const reportDate = `${today.getDate()} ${month} ${year}`;

    let tableRows = '';
    rankedData.forEach((item, index) => {
        let photoCell = '<span style="font-size: 10px; color: #666;">Tidak ada foto</span>';
        if (item.photos && item.photos.length > 0) {
            const imageUrl = new URL(item.photos[0].file_path, window.location.href).href;
            photoCell = `<img src="${imageUrl}" alt="Foto Bencana" style="width: 100%; height: 100%; object-fit: cover;">`;
        }

        tableRows += `
            <tr style="border-bottom: 1px solid #ddd; page-break-inside: avoid;">
                <td style="padding: 8px; text-align: center; vertical-align: middle;">${index + 1}</td>
                <td style="padding: 8px; vertical-align: middle;">${item.jenisBencana}</td>
                <td style="padding: 8px; vertical-align: middle;">${item.lokasi}</td>
                <td style="padding: 8px; text-align: center; vertical-align: middle;">${formatDate(item.disaster_date)}</td>
                <td style="padding: 8px; text-align: center; vertical-align: middle;">${item.jiwaTerdampak}</td>
                <td style="padding: 8px; text-align: center; vertical-align: middle;">${item.kkTerdampak}</td>
                <td style="padding: 8px; vertical-align: middle;">${item.tingkatKerusakan}</td>
                <td style="padding: 8px; font-weight: bold; vertical-align: middle;">${item.finalScore.toFixed(4)}</td>
                <td style="padding: 0; text-align: center; vertical-align: middle; width: 120px; height: 120px;">${photoCell}</td>
            </tr>
        `;
    });

    const printContent = `
        <div style="font-family: Arial, sans-serif; width: 100%; transform: scale(0.8); transform-origin: top left;">
            <div style="text-align: center; border-bottom: 2px solid black; padding-bottom: 10px; margin-bottom: 20px; page-break-before: always; page-break-after: avoid;">
                <h2 style="margin: 0; font-size: 24px; font-weight: bold;">BADAN PENANGGULANGAN BENCANA DAERAH</h2>
                <h3 style="margin: 0; font-size: 20px;">KABUPATEN MINAHASA</h3>
                <p style="margin: 5px 0 0; font-size: 12px;">Alamat: Jl. Instansi No. 123, Tondano, Minahasa, Sulawesi Utara</p>
            </div>
            <h1 style="text-align: center; font-size: 18px; text-decoration: underline; margin-bottom: 20px;">LAPORAN REKAPITULASI DAN PRIORITAS DAMPAK BENCANA</h1>
            <p style="text-align: center; margin-top: -10px; margin-bottom: 30px;">Periode: Bulan ${month} ${year}</p>
            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                <thead>
                    <tr style="background-color: #f2f2f2; text-align: left;">
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Peringkat</th>
                        <th style="padding: 8px; border: 1px solid #ddd;">Jenis Bencana</th>
                        <th style="padding: 8px; border: 1px solid #ddd;">Lokasi</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Tanggal</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Jiwa</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">KK</th>
                        <th style="padding: 8px; border: 1px solid #ddd;">Kerusakan</th>
                        <th style="padding: 8px; border: 1px solid #ddd;">Indeks Dampak</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Dokumentasi</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
            <div style="margin-top: 50px; width: 100%; page-break-inside: avoid;">
                <div style="float: right; width: 250px; text-align: center;">
                    <p>Tondano, ${reportDate}</p>
                    <p>Mengetahui,</p>
                    <br><br><br><br>
                    <p style="font-weight: bold; text-decoration: underline;">(Nama Kepala Pelaksana)</p>
                    <p>NIP. 123456789012345678</p>
                </div>
                <div style="clear: both;"></div>
            </div>
        </div>
    `;

    document.getElementById('previewModalLabel').textContent = 'Preview Laporan Bencana (SAW)';
    previewContent.innerHTML = printContent;
    const modal = new bootstrap.Modal(document.getElementById('preview-modal'));
    modal.show();
}

/**
 * [FUNGSI BARU - PRINT 2] Mencetak laporan INSIDEN (Kronologis)
 */
function handlePrintInsidenReport() {
    const insidenData = allReportData.filter(d => d.kategori_laporan === 'insiden');
    insidenData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); // Sortir terbaru dulu
    
    const previewContent = document.getElementById('preview-content');
    const today = new Date();
    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const month = monthNames[today.getMonth()];
    const year = today.getFullYear();
    const reportDate = `${today.getDate()} ${month} ${year}`;

    let tableRows = '';
    insidenData.forEach((item, index) => {
        let photoCell = '<span style="font-size: 10px; color: #666;">Tidak ada foto</span>';
        if (item.photos && item.photos.length > 0) {
            const imageUrl = new URL(item.photos[0].file_path, window.location.href).href;
            photoCell = `<img src="${imageUrl}" alt="Foto Insiden" style="width: 100%; height: 100%; object-fit: cover;">`;
        }

        tableRows += `
            <tr style="border-bottom: 1px solid #ddd; page-break-inside: avoid;">
                <td style="padding: 8px; vertical-align: middle;">${item.jenisBencana}</td>
                <td style="padding: 8px; vertical-align: middle;">${item.lokasi}</td>
                <td style="padding: 8px; vertical-align: middle; font-size: 11px;">${item.keterangan || 'N/A'}</td>
                <td style="padding: 8px; text-align: center; vertical-align: middle;">${formatDate(item.disaster_date)}</td>
                <td style="padding: 0; text-align: center; vertical-align: middle; width: 120px; height: 120px;">${photoCell}</td>
            </tr>
        `;
    });

    const printContent = `
        <div style="font-family: Arial, sans-serif; width: 100%; transform: scale(0.8); transform-origin: top left;">
            <div style="text-align: center; border-bottom: 2px solid black; padding-bottom: 10px; margin-bottom: 20px; page-break-before: always; page-break-after: avoid;">
                <h2 style="margin: 0; font-size: 24px; font-weight: bold;">BADAN PENANGGULANGAN BENCANA DAERAH</h2>
                <h3 style="margin: 0; font-size: 20px;">KABUPATEN MINAHASA</h3>
                <p style="margin: 5px 0 0; font-size: 12px;">Alamat: Jl. Instansi No. 123, Tondano, Minahasa, Sulawesi Utara</p>
            </div>
            <h1 style="text-align: center; font-size: 18px; text-decoration: underline; margin-bottom: 20px;">LAPORAN REKAPITULASI INSIDEN DARURAT</h1>
            <p style="text-align: center; margin-top: -10px; margin-bottom: 30px;">Periode: Bulan ${month} ${year}</p>
            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                <thead>
                    <tr style="background-color: #f2f2f2; text-align: left;">
                        <th style="padding: 8px; border: 1px solid #ddd;">Jenis Insiden</th>
                        <th style="padding: 8px; border: 1px solid #ddd;">Lokasi</th>
                        <th style="padding: 8px; border: 1px solid #ddd;">Keterangan</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Tanggal</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Dokumentasi</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
            <div style="margin-top: 50px; width: 100%; page-break-inside: avoid;">
                <div style="float: right; width: 250px; text-align: center;">
                    <p>Tondano, ${reportDate}</p>
                    <p>Mengetahui,</p>
                    <br><br><br><br>
                    <p style="font-weight: bold; text-decoration: underline;">(Nama Kepala Pelaksana)</p>
                    <p>NIP. 123456789012345678</p>
                </div>
                <div style="clear: both;"></div>
            </div>
        </div>
    `;

    document.getElementById('previewModalLabel').textContent = 'Preview Laporan Insiden Darurat';
    previewContent.innerHTML = printContent;
    const modal = new bootstrap.Modal(document.getElementById('preview-modal'));
    modal.show();
}

/**
 * Menangani konfirmasi cetak dari modal preview
 */
function handleConfirmPrint() {
    const previewContent = document.getElementById('preview-content');
    let printContent = previewContent.innerHTML;
    printContent = printContent.replace('transform: scale(0.8); transform-origin: top left;', '');

    if (!printContent.includes('<html>')) {
        printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Laporan BPBD</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                    @page { size: A4; margin: 2cm; }
                </style>
            </head>
            <body>
                ${printContent}
            </body>
            </html>
        `;
    }

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.onload = function() {
        printWindow.print();
        printWindow.onafterprint = function() {
            printWindow.close();
        };
    };
    const modalElement = document.getElementById('preview-modal');
    if (modalElement) {
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) {
            modal.hide();
        }
    }
}


// --- EVENT LISTENERS ---

document.addEventListener('DOMContentLoaded', function() {
    // Panggil fungsi pemuatan data yang baru
    loadAndDisplayAllReports();

    // Check if validate link exists
    const validateLink = document.getElementById('validate-link');
    if (validateLink) {
        validateLink.addEventListener('click', function(e) {
            // (Tidak perlu aksi khusus di sini)
        });
    }

    // --- [LOGIKA BARU] Pengatur Form Dinamis ---
    const kategoriSelect = document.getElementById('kategoriLaporan');
    const formGrupBencana = document.getElementById('form-grup-bencana');
    const formGrupInsiden = document.getElementById('form-grup-insiden');
    const jiwaInput = document.getElementById('jiwaTerdampak');
    const kkInput = document.getElementById('kkTerdampak');

    if (kategoriSelect) {
        kategoriSelect.addEventListener('change', function() {
            if (this.value === 'bencana') {
                formGrupBencana.style.display = 'block';
                formGrupInsiden.style.display = 'none';
                jiwaInput.required = true;
                kkInput.required = true;
            } else { // 'insiden'
                formGrupBencana.style.display = 'none';
                formGrupInsiden.style.display = 'block';
                jiwaInput.required = false;
                kkInput.required = false;
            }
        });
    }

    // Listener untuk form submit utama
    const disasterForm = document.getElementById('disaster-form');
    if (disasterForm) {
        disasterForm.addEventListener('submit', handleFormSubmit);
    }

    // Listener untuk form login
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Listener untuk logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // --- LISTENER TOMBOL CETAK BARU ---
    const printBtn = document.getElementById('print-report');
    if (printBtn) {
        printBtn.addEventListener('click', handlePrintReport);
    }
    const printInsidenBtn = document.getElementById('print-insiden-report');
    if (printInsidenBtn) {
        printInsidenBtn.addEventListener('click', handlePrintInsidenReport); // Panggil fungsi baru
    }
    // --- AKHIR LISTENER TOMBOL CETAK BARU ---
    
    // Listener untuk konfirmasi cetak
    const confirmPrintBtn = document.getElementById('confirm-print');
    if (confirmPrintBtn) {
        confirmPrintBtn.addEventListener('click', handleConfirmPrint);
    }

    // --- [DIPERBARUI] Handle edit button (Tombol Edit) ---
    document.addEventListener('click', function(e) {
        if (e.target.closest('.edit-btn')) {
            const id = e.target.closest('.edit-btn').getAttribute('data-id');
            
            // Ambil data dari server
            fetch(`get_single_disaster.php?id=${id}`)
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        const disaster = data.data;
                        
                        // Isi formulir modal
                        document.getElementById('edit-disaster-id').value = disaster.id;
                        document.getElementById('edit-jenisBencana').value = disaster.jenisBencana; // Ini akan berisi "Banjir" atau "Pohon Tumbang"
                        document.getElementById('edit-lokasi').value = disaster.lokasi;
                        document.getElementById('edit-jiwaTerdampak').value = disaster.jiwaTerdampak;
                        document.getElementById('edit-kkTerdampak').value = disaster.kkTerdampak;
                        document.getElementById('edit-tingkatKerusakan').value = disaster.tingkatKerusakan;
                        document.getElementById('edit-keterangan').value = disaster.keterangan; // Isi Keterangan
                        document.getElementById('edit-disasterDate').value = disaster.disaster_date;
                        
                        // Tampilkan modal
                        const editModal = new bootstrap.Modal(document.getElementById('edit-modal'));
                        editModal.show();
                        
                    } else {
                        Swal.fire({ icon: 'error', title: 'Gagal!', text: data.message, confirmButtonColor: '#e60013' });
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    Swal.fire({ icon: 'error', title: 'Error!', text: 'Gagal mengambil data laporan.', confirmButtonColor: '#e60013' });
                });
        }
    });

    // Handle delete button
    document.addEventListener('click', function(e) {
        if (e.target.closest('.delete-btn')) {
            const id = e.target.closest('.delete-btn').getAttribute('data-id');
            handleDeleteDisaster(id);
        }
    });

    // --- [DIPERBARUI] Handle submit formulir edit modal ---
    // (Pindahkan listener ke dalam DOMContentLoaded)
    const editForm = document.getElementById('edit-disaster-form');
    if (editForm) {
        editForm.addEventListener('submit', function(event) {
            event.preventDefault(); 
            
            const form = event.target;
            const formData = new FormData(form);
            const modalElement = document.getElementById('edit-modal');
            const modal = bootstrap.Modal.getInstance(modalElement);

            fetch('edit_disaster.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    if (modal) {
                        modal.hide();
                    }
                    Swal.fire({
                        icon: 'success',
                        title: 'Berhasil!',
                        text: data.message,
                        confirmButtonColor: '#00499d',
                        timer: 1500,
                        showConfirmButton: false
                    });
                    loadAndDisplayAllReports(); // Muat ulang SEMUA data
                } else {
                    Swal.fire({ icon: 'error', title: 'Gagal!', text: data.message, confirmButtonColor: '#e60013' });
                }
            })
            .catch(error => {
                console.error('Error:', error);
                Swal.fire({ icon: 'error', title: 'Error!', text: 'Terjadi kesalahan saat menyimpan perubahan.', confirmButtonColor: '#e60013' });
            });
        });
    }

    // Handle photo modal
    document.addEventListener('click', function(e) {
        if (e.target.matches('[data-bs-target="#photo-modal"]')) {
            const imgSrc = e.target.getAttribute('data-photo-src');
            const imgTitle = e.target.getAttribute('data-photo-title');
            document.getElementById('photo-modal-image').src = imgSrc;
            document.getElementById('photoModalLabel').textContent = imgTitle || 'Foto Bencana';
        }
    });
});


/**
 * Handle delete disaster
 */
function handleDeleteDisaster(id) {
    Swal.fire({
        title: 'Konfirmasi Hapus',
        text: 'Apakah Anda yakin ingin menghapus laporan ini?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#e60013',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Ya, Hapus',
        cancelButtonText: 'Batal'
    }).then((result) => {
        if (result.isConfirmed) {
            fetch('delete_disaster.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `id=${id}`
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Berhasil!',
                        text: data.message,
                        confirmButtonColor: '#00499d'
                    });
                    loadAndDisplayAllReports(); // Muat ulang SEMUA data
                } else {
                    Swal.fire({ icon: 'error', title: 'Gagal!', text: data.message, confirmButtonColor: '#e60013' });
                }
            })
            .catch(error => {
                console.error('Error:', error);
                Swal.fire({ icon: 'error', title: 'Error!', text: 'Terjadi kesalahan saat menghapus laporan', confirmButtonColor: '#e60013' });
            });
        }
    });
}