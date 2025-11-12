<?php
// --- MULAI BLOK PENGGANTI UNTUK TES ---

// Tampilkan semua error
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Kita butuh ini untuk koneksi database
require_once 'config.php';

// Kita buat data pengguna palsu HANYA UNTUK TES
$username = 'Test User (Head)';

// Ambil ID dari URL (Sama seperti sebelumnya)
$id = $_GET['id'] ?? null;

if (!$id) {
    die('Error: ID Laporan tidak ditemukan di URL.');
}

try {
    // Ambil data bencana (Sama seperti sebelumnya)
    $stmt = $pdo->prepare("SELECT * FROM disasters WHERE id = ?");
    $stmt->execute([$id]);
    $disaster = $stmt->fetch();

    if (!$disaster) {
        die('Error: Laporan bencana tidak ditemukan untuk ID ' . $id);
    }
} catch (PDOException $e) {
    die('Database error: ' . $e->getMessage());
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Edit Laporan Bencana - BPBD</title>
    
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="style.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/sweetalert2@11.10.1/dist/sweetalert2.min.css">
</head>
<body class="logged-in">
    <div id="main-content" class="p-4 p-md-5">
        <div class="container">
            <header class="bpbd-header shadow-sm rounded p-4 mb-4">
                <div class="d-flex justify-content-between align-items-center">
                    <div class="d-flex align-items-center">
                        <div class="header-logo me-3">
                            <img src="uploads/bpbd-logo.png" alt="BPBD Logo" class="header-bpbd-logo">
                        </div>
                        <div>
                            <h1 class="h2 h1-md fw-bold text-dark mb-1">Edit Laporan Bencana</h1>
                            <p class="text-muted mb-0">Sistem Pencetakan Laporan Bencana BPBD Kabupaten Minahasa</p>
                            <p class="text-muted small mb-0">Selamat datang, <?php echo htmlspecialchars($username); ?></p>
                        </div>
                    </div>
                </div>
            </header>

            <div class="row g-4 justify-content-center">
                <div class="col-lg-6">
                    <div class="bg-white p-4 rounded shadow-sm">
                        <h2 class="h5 fw-semibold mb-3 text-dark border-bottom pb-2">Formulir Edit Laporan</h2>
                        
                        <form id="edit-disaster-form" action="edit_disaster.php" method="POST">
                            
                            <input type="hidden" name="id" value="<?php echo htmlspecialchars($disaster['id']); ?>">
                            
                            <div class="mb-3">
                                <label for="jenisBencana" class="form-label">Jenis Bencana</label>
                                <select id="jenisBencana" name="jenisBencana" class="form-select">
                                    <option value="Banjir" <?php echo ($disaster['jenisBencana'] == 'Banjir') ? 'selected' : ''; ?>>Banjir</option>
                                    <option value="Tanah Longsor" <?php echo ($disaster['jenisBencana'] == 'Tanah Longsor') ? 'selected' : ''; ?>>Tanah Longsor</option>
                                    <option value="Angin Puting Beliung" <?php echo ($disaster['jenisBencana'] == 'Angin Puting Beliung') ? 'selected' : ''; ?>>Angin Puting Beliung</option>
                                    <option value="Gempa Bumi" <?php echo ($disaster['jenisBencana'] == 'Gempa Bumi') ? 'selected' : ''; ?>>Gempa Bumi</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label for="lokasi" class="form-label">Lokasi (Desa/Kecamatan)</label>
                                <input type="text" id="lokasi" name="lokasi" required class="form-control" value="<?php echo htmlspecialchars($disaster['lokasi']); ?>">
                            </div>
                            <div class="mb-3">
                                <label for="jiwaTerdampak" class="form-label">Jumlah Jiwa Terdampak</label>
                                <input type="number" id="jiwaTerdampak" name="jiwaTerdampak" min="0" required class="form-control" value="<?php echo htmlspecialchars($disaster['jiwaTerdampak']); ?>">
                            </div>
                            <div class="mb-3">
                                <label for="kkTerdampak" class="form-label">Jumlah KK Terdampak</label>
                                <input type="number" id="kkTerdampak" name="kkTerdampak" min="0" required class="form-control" value="<?php echo htmlspecialchars($disaster['kkTerdampak']); ?>">
                            </div>
                            <div class="mb-3">
                                <label for="tingkatKerusakan" class="form-label">Tingkat Kerusakan</label>
                                <select id="tingkatKerusakan" name="tingkatKerusakan" class="form-select">
                                    <option value="Ringan" <?php echo ($disaster['tingkatKerusakan'] == 'Ringan') ? 'selected' : ''; ?>>Ringan</option>
                                    <option value="Sedang" <?php echo ($disaster['tingkatKerusakan'] == 'Sedang') ? 'selected' : ''; ?>>Sedang</option>
                                    <option value="Berat" <?php echo ($disaster['tingkatKerusakan'] == 'Berat') ? 'selected' : ''; ?>>Berat</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label for="disasterDate" class="form-label">Tanggal Kejadian Bencana</label>
                                <input type="date" id="disasterDate" name="disasterDate" required class="form-control" value="<?php echo htmlspecialchars($disaster['disaster_date']); ?>">
                            </div>
                            <div class="d-flex justify-content-between">
                                <a href="index.php" class="btn btn-secondary">Batal</a>
                                <button type="submit" class="btn btn-bpbd-primary fw-bold">Simpan Perubahan</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11.10.1/dist/sweetalert2.all.min.js"></script>
    
    <script>
        document.getElementById('edit-disaster-form').addEventListener('submit', function(event) {
            event.preventDefault(); // Mencegah form submit biasa
            const form = event.target;
            const formData = new FormData(form);

            // Mengirim data form menggunakan fetch
            fetch('edit_disaster.php', {
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
                    }).then(() => {
                        window.location.href = 'index.php'; // Arahkan kembali ke dashboard
                    });
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
                    text: 'Terjadi kesalahan saat menyimpan perubahan.',
                    confirmButtonColor: '#e60013'
                });
            });
        });
    </script>
</body>
</html>