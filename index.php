<?php
session_start();
require_once 'config.php';

// Check if user is logged in
$loggedIn = isset($_SESSION['user_id']);
$userRole = $_SESSION['role'] ?? 'user';
$username = $_SESSION['username'] ?? '';
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Prototipe Laporan Bencana BPBD</title>
    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" xintegrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <!-- Login Page -->
    <div id="login-page" style="display: <?php echo $loggedIn ? 'none' : 'flex'; ?>;">
        <div class="bg-white p-5 rounded shadow-sm" style="width: 400px;">
            <h2 class="text-center mb-4">Login BPBD</h2>
            <form id="login-form">
                <div class="mb-3">
                    <label for="username" class="form-label">Username</label>
                    <input type="text" id="username" class="form-control" required>
                </div>
                <div class="mb-3">
                    <label for="password" class="form-label">Password</label>
                    <input type="password" id="password" class="form-control" required>
                </div>
                <button type="submit" class="btn btn-primary w-100">Login</button>
            </form>
        </div>
    </div>

    <!-- Main Content -->
    <div id="main-content" style="display: <?php echo $loggedIn ? 'block' : 'none'; ?>;" class="p-4 p-md-5">
        <div class="container">
        <!-- Header -->
        <header class="bg-white shadow-sm rounded p-4 mb-4">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <h1 class="h2 h1-md fw-bold text-dark">Rekapitulasi & Prioritisasi Dampak Bencana</h1>
                    <p class="text-muted mt-1">Selamat datang, <?php echo htmlspecialchars($username); ?> (<?php echo htmlspecialchars($userRole); ?>)</p>
                </div>
                <div>
                    <a href="validation.php" class="btn btn-outline-primary me-2 <?php echo $userRole !== 'head' ? 'd-none' : ''; ?>" id="validate-link">Validasi Laporan</a>
                    <button id="logout-btn" class="btn btn-outline-secondary">Logout</button>
                </div>
            </div>
        </header>

        <div class="row g-4">
            <!-- Input Section -->
            <div class="col-lg-4">
                <div class="bg-white p-4 rounded shadow-sm">
                    <h2 class="h5 fw-semibold mb-3 text-dark border-bottom pb-2">Tambah Data Bencana Baru</h2>
                    <form id="disaster-form">
                        <div class="mb-3">
                            <label for="jenisBencana" class="form-label">Jenis Bencana</label>
                            <select id="jenisBencana" name="jenisBencana" class="form-select">
                                <option value="Banjir">Banjir</option>
                                <option value="Tanah Longsor">Tanah Longsor</option>
                                <option value="Angin Puting Beliung">Angin Puting Beliung</option>
                                <option value="Gempa Bumi">Gempa Bumi</option>
                            </select>
                        </div>
                        <div class="mb-3">
                            <label for="lokasi" class="form-label">Lokasi (Desa/Kecamatan)</label>
                            <input type="text" id="lokasi" name="lokasi" required class="form-control" placeholder="Contoh: Desa Rerer">
                        </div>
                        <div class="mb-3">
                            <label for="jiwaTerdampak" class="form-label">Jumlah Jiwa Terdampak</label>
                            <input type="number" id="jiwaTerdampak" name="jiwaTerdampak" min="0" required class="form-control" placeholder="0">
                        </div>
                        <div class="mb-3">
                            <label for="kkTerdampak" class="form-label">Jumlah KK Terdampak</label>
                            <input type="number" id="kkTerdampak" name="kkTerdampak" min="0" required class="form-control" placeholder="0">
                        </div>
                        <div class="mb-3">
                            <label for="tingkatKerusakan" class="form-label">Tingkat Kerusakan</label>
                            <select id="tingkatKerusakan" name="tingkatKerusakan" class="form-select">
                                <option value="Ringan">Ringan</option>
                                <option value="Sedang">Sedang</option>
                                <option value="Berat">Berat</option>
                            </select>
                        </div>
                        <button type="submit" class="w-100 btn btn-primary fw-bold py-2">
                            Simpan & Hitung Prioritas
                        </button>
                    </form>
                </div>
            </div>

            <!-- Report Section -->
            <div class="col-lg-8">
                <div class="bg-white p-4 rounded shadow-sm">
                    <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3 border-bottom pb-2">
                        <h2 class="h5 fw-semibold text-dark">Laporan Rekapitulasi & Prioritas Bencana</h2>
                        <button id="print-report" class="btn btn-success mt-2 mt-md-0 d-flex align-items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-printer-fill me-2" viewBox="0 0 16 16">
                              <path d="M5 1a2 2 0 0 0-2 2v2H2a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h1v1a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-1h1a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1V3a2 2 0 0 0-2-2H5zm4 8.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5zM6 11.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5z"/>
                              <path d="M0 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-1v-1a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v1H2a2 2 0 0 1-2-2V7zm2.5 1a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1z"/>
                            </svg>
                            Cetak Laporan
                        </button>
                    </div>
                    <div class="table-responsive">
                        <table class="table table-hover align-middle">
                            <thead class="table-light">
                                <tr>
                                    <th scope="col">Peringkat</th>
                                    <th scope="col">Jenis Bencana</th>
                                    <th scope="col">Lokasi</th>
                                    <th scope="col">Terdampak</th>
                                    <th scope="col">Kerusakan</th>
                                    <th scope="col">Indeks Dampak (SAW)</th>
                                </tr>
                            </thead>
                            <tbody id="report-table-body">
                                <!-- Data rows will be inserted here by JavaScript -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Preview Modal -->
    <div class="modal fade" id="preview-modal" tabindex="-1" aria-labelledby="previewModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-xl">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="previewModalLabel">Preview Laporan</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body" id="preview-content">
                    <!-- Preview content will be inserted here -->
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Tutup</button>
                    <button type="button" class="btn btn-primary" id="confirm-print">Cetak</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Hidden Printable Area -->
    <div id="print-area" class="d-none"></div>

    <!-- Bootstrap JS Bundle -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" xintegrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" crossorigin="anonymous"></script>
    <script src="script.js"></script>
</body>
</html>
