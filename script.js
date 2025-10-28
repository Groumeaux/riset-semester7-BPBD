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
let disasterData = [];

/**
 * Format date to Indonesian format: "16 Oktober 2025"
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {string} Formatted date string
 */
function formatDate(dateString) {
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
 * @param {Array} data - Array objek data bencana
 * @returns {Array} Array objek data bencana yang sudah dihitung skor dan diurutkan
 */
function runSAW(data) {
    if (data.length === 0) return [];

    // Langkah 1: Kuantifikasi -> Ubah data kualitatif (string) menjadi angka (skor)
    const quantifiedData = data.map(item => ({
        ...item,
        skorKerusakan: quantificationScores.kerusakan[item.tingkatKerusakan],
        skorJenis: quantificationScores.jenis[item.jenisBencana]
    }));

    // Langkah 2: Cari nilai maksimum untuk setiap kriteria (untuk normalisasi)
    const maxValues = {
        jiwa: Math.max(...quantifiedData.map(d => d.jiwaTerdampak)),
        kk: Math.max(...quantifiedData.map(d => d.kkTerdampak)),
        kerusakan: Math.max(...quantifiedData.map(d => d.skorKerusakan)),
        jenis: Math.max(...quantifiedData.map(d => d.skorJenis))
    };

    // Hindari pembagian dengan nol jika semua nilai adalah 0
    for (const key in maxValues) {
        if (maxValues[key] === 0) maxValues[key] = 1;
    }

    // Langkah 3: Normalisasi -> Ubah semua skor ke skala 0-1
    const normalizedData = quantifiedData.map(item => ({
        ...item,
        normJiwa: item.jiwaTerdampak / maxValues.jiwa,
        normKk: item.kkTerdampak / maxValues.kk,
        normKerusakan: item.skorKerusakan / maxValues.kerusakan,
        normJenis: item.skorJenis / maxValues.jenis,
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
 * Fungsi untuk menampilkan data yang sudah diolah ke dalam tabel HTML
 */
function generateReportTable() {
    const rankedData = runSAW(disasterData);
    const tableBody = document.getElementById('report-table-body');

    tableBody.innerHTML = ''; // Kosongkan tabel sebelum diisi

    if (rankedData.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-muted">Belum ada data bencana.</td></tr>`;
        return;
    }

    rankedData.forEach((item, index) => {
        const rank = index + 1;
        const rankColor = rank === 1 ? 'bg-danger-subtle text-danger-emphasis' : (rank === 2 ? 'bg-warning-subtle text-warning-emphasis' : 'bg-success-subtle text-success-emphasis');

        // Generate photo thumbnails
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
                <td>
                    <span class="badge ${rankColor} rounded-pill fs-6">${rank}</span>
                </td>
                <td class="fw-medium">${item.jenisBencana}</td>
                <td>${item.lokasi}</td>
                <td>${formatDate(item.disaster_date)}</td>
                <td>${item.jiwaTerdampak} Jiwa / ${item.kkTerdampak} KK</td>
                <td>
                     <span class="badge ${
                        item.tingkatKerusakan === 'Berat' ? 'bg-danger-subtle text-danger-emphasis' :
                        item.tingkatKerusakan === 'Sedang' ? 'bg-warning-subtle text-warning-emphasis' : 'bg-secondary-subtle text-secondary-emphasis'
                     } rounded-pill">${item.tingkatKerusakan}</span>
                </td>
                <td class="fw-bold text-primary">${item.finalScore.toFixed(4)}</td>
                <td>${photoThumbnails}</td>
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
            loadDisasterData(); // Reload data from server
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
            text: 'Terjadi kesalahan saat menyimpan laporan bencana',
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
                // Reload page to show main content based on session
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
 * Load disaster data from server
 */
function loadDisasterData() {
    fetch('get_disasters.php')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                disasterData = data.data;
                generateReportTable();
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
 * Membuat dan memicu proses cetak laporan bulanan
 */
function handlePrintReport() {
    const rankedData = runSAW(disasterData);
    const previewContent = document.getElementById('preview-content');
    const today = new Date();
    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const month = monthNames[today.getMonth()];
    const year = today.getFullYear();
    const reportDate = `${today.getDate()} ${month} ${year}`;

    let tableRows = '';
    rankedData.forEach((item, index) => {
        // NEW: Generate photo cell for print view
        let photoCell = '<span style="font-size: 10px; color: #666;">Tidak ada foto</span>';
        if (item.photos && item.photos.length > 0) {
            // We'll just show the first photo in the report for brevity
            // The image path needs to be a full URL for the print view to access it
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

    previewContent.innerHTML = printContent;
    const modal = new bootstrap.Modal(document.getElementById('preview-modal'));
    modal.show();
}

/**
 * Menangani konfirmasi cetak dari modal preview
 */
function handleConfirmPrint() {
    const previewContent = document.getElementById('preview-content');

    // Get the print content and ensure it's properly formatted
    let printContent = previewContent.innerHTML;

    // Remove the scale transform for printing
    printContent = printContent.replace('transform: scale(0.8); transform-origin: top left;', '');

    // Ensure the content has proper HTML structure
    if (!printContent.includes('<html>')) {
        printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Laporan Bencana</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                    .text-center { text-align: center; }
                    .text-right { text-align: right; }
                    .font-weight-bold { font-weight: bold; }
                    .text-decoration-underline { text-decoration: underline; }
                    .border-bottom { border-bottom: 2px solid black; padding-bottom: 10px; margin-bottom: 20px; }
                    @page { size: A4; margin: 2cm; }
                </style>
            </head>
            <body>
                ${printContent}
            </body>
            </html>
        `;
    }

    // Open a new window with the print content
    const printWindow = window.open('', '_blank', 'width=800,height=600');

    // Write the print content to the new window
    printWindow.document.write(printContent);
    printWindow.document.close();

    // Wait for the content to load, then trigger print
    printWindow.onload = function() {
        printWindow.print();

        // Close the print window after printing (optional, or let user close)
        printWindow.onafterprint = function() {
            printWindow.close();
        };
    };

    // Hide the modal after opening print window
    const modalElement = document.getElementById('preview-modal');
    if (modalElement) {
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) {
            modal.hide();
        }
    }
}


// --- EVENT LISTENERS ---

// Panggil fungsi loadDisasterData saat halaman pertama kali dimuat
document.addEventListener('DOMContentLoaded', function() {
    loadDisasterData();
    // Check if validate link exists and add click handler
    const validateLink = document.getElementById('validate-link');
    if (validateLink) {
        validateLink.addEventListener('click', function(e) {
            // Optional: Add any client-side validation or loading state
        });
    }
});

// Tambahkan event listener untuk form submit
document.getElementById('disaster-form').addEventListener('submit', handleFormSubmit);

// Tambahkan event listener untuk login form
document.getElementById('login-form').addEventListener('submit', handleLogin);

// Tambahkan event listener untuk logout button
document.getElementById('logout-btn').addEventListener('click', handleLogout);

// Tambahkan event listener untuk tombol cetak
document.getElementById('print-report').addEventListener('click', handlePrintReport);

// Tambahkan event listener untuk konfirmasi cetak
document.getElementById('confirm-print').addEventListener('click', handleConfirmPrint);

// Handle photo modal
document.addEventListener('click', function(e) {
    if (e.target.matches('[data-bs-target="#photo-modal"]')) {
        const imgSrc = e.target.getAttribute('data-photo-src');
        const imgTitle = e.target.getAttribute('data-photo-title');
        document.getElementById('photo-modal-image').src = imgSrc;
        document.getElementById('photoModalLabel').textContent = imgTitle || 'Foto Bencana';
    }
});

