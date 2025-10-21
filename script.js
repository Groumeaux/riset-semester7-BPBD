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
        tableBody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">Belum ada data bencana.</td></tr>`;
        return;
    }

    rankedData.forEach((item, index) => {
        const rank = index + 1;
        const rankColor = rank === 1 ? 'bg-danger-subtle text-danger-emphasis' : (rank === 2 ? 'bg-warning-subtle text-warning-emphasis' : 'bg-success-subtle text-success-emphasis');

        const row = `
            <tr>
                <td>
                    <span class="badge ${rankColor} rounded-pill fs-6">${rank}</span>
                </td>
                <td class="fw-medium">${item.jenisBencana}</td>
                <td>${item.lokasi}</td>
                <td>${item.jiwaTerdampak} Jiwa / ${item.kkTerdampak} KK</td>
                <td>
                     <span class="badge ${
                        item.tingkatKerusakan === 'Berat' ? 'bg-danger-subtle text-danger-emphasis' :
                        item.tingkatKerusakan === 'Sedang' ? 'bg-warning-subtle text-warning-emphasis' : 'bg-secondary-subtle text-secondary-emphasis'
                     } rounded-pill">${item.tingkatKerusakan}</span>
                </td>
                <td class="fw-bold text-primary">${item.finalScore.toFixed(4)}</td>
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
            alert(data.message);
            form.reset();
            loadDisasterData(); // Reload data from server
        } else {
            alert('Error: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error saving disaster report');
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
            // Reload page to show main content based on session
            window.location.reload();
        } else {
            alert('Error: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error during login');
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
    window.location.href = 'logout.php';
}

/**
 * Membuat dan memicu proses cetak laporan bulanan
 */
function handlePrintReport() {
    const rankedData = runSAW(disasterData);
    const printArea = document.getElementById('print-area');
    const previewContent = document.getElementById('preview-content');
    const today = new Date();
    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const month = monthNames[today.getMonth()];
    const year = today.getFullYear();
    const reportDate = `${today.getDate()} ${month} ${year}`;

    let tableRows = '';
    rankedData.forEach((item, index) => {
        tableRows += `
            <tr style="border-bottom: 1px solid #ddd; page-break-inside: avoid;">
                <td style="padding: 8px; text-align: center;">${index + 1}</td>
                <td style="padding: 8px;">${item.jenisBencana}</td>
                <td style="padding: 8px;">${item.lokasi}</td>
                <td style="padding: 8px; text-align: center;">${item.jiwaTerdampak}</td>
                <td style="padding: 8px; text-align: center;">${item.kkTerdampak}</td>
                <td style="padding: 8px;">${item.tingkatKerusakan}</td>
                <td style="padding: 8px; font-weight: bold;">${item.finalScore.toFixed(4)}</td>
            </tr>
        `;
    });

    const printContent = `
        <div style="font-family: Arial, sans-serif; width: 100%; transform: scale(0.8); transform-origin: top left;">
            <div style="text-align: center; border-bottom: 2px solid black; padding-bottom: 10px; margin-bottom: 20px;">
                <!-- Anda bisa menambahkan logo di sini -->
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
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Jiwa</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">KK</th>
                        <th style="padding: 8px; border: 1px solid #ddd;">Kerusakan</th>
                        <th style="padding: 8px; border: 1px solid #ddd;">Indeks Dampak</th>
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
    const printArea = document.getElementById('print-area');
    const previewContent = document.getElementById('preview-content');
    printArea.innerHTML = previewContent.innerHTML.replace('transform: scale(0.8); transform-origin: top left;', ''); // Remove scale for actual print
    window.print();
    printArea.innerHTML = ''; // Clean up after printing
    const modal = bootstrap.Modal.getInstance(document.getElementById('preview-modal'));
    modal.hide();
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
