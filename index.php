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
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" ...>
    
    <link rel="stylesheet" href="https://cdn.datatables.net/2.0.8/css/dataTables.bootstrap5.min.css">
    
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="style.css">
    <link rel="stylesheet" href="login.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/sweetalert2@11.10.1/dist/sweetalert2.min.css">
</head>
<body class="<?php echo $loggedIn ? 'logged-in' : 'login-page'; ?>">
    <!-- Login Page -->
    <div id="login-page" style="display: <?php echo $loggedIn ? 'none' : 'flex'; ?>;">
        <div class="login-container">
            <!-- Login Form Section -->
            <div class="login-form-section">
                <div class="bg-white p-5 rounded shadow-sm">
                    <!-- Welcome Section -->
                    <div class="welcome-section text-center mb-4">
                        <div class="welcome-icon mb-3">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="#00499d" class="bi bi-shield-check" viewBox="0 0 16 16">
                                <path d="M5.338 1.59a61.44 61.44 0 0 0-2.837.856.481.481 0 0 0-.328.39c-.554 4.157.726 7.19 2.253 9.188a10.725 10.725 0 0 0 2.287 2.233c.346.244.652.42.893.533.12.057.218.095.293.118a.55.55 0 0 0 .101.025.615.615 0 0 0 .1-.025c.076-.023.174-.061.294-.118.24-.113.547-.29.893-.533a10.726 10.726 0 0 0 2.287-2.233c1.527-1.997 2.807-5.031 2.253-9.188a.48.48 0 0 0-.328-.39c-.651-.213-1.75-.56-2.837-.855C9.552 1.29 8.531 1.067 8 1.067c-.53 0-1.552.223-2.662.524zM5.072.56C6.157.265 7.31 0 8 0s1.843.265 2.928.56c1.11.3 2.229.655 2.887.87a1.54 1.54 0 0 1 1.044 1.262c.596 4.477-.787 7.795-2.465 9.99a11.775 11.775 0 0 1-2.517 2.485.646.646 0 0 1-.48 0 11.776 11.776 0 0 1-2.517-2.485C4.666 10.355 3.283 7.037 3.887 2.56A1.54 1.54 0 0 1 4.93 1.298c.658-.215 1.777-.57 2.887-.87z"/>
                                <path d="M10.854 5.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 7.793l2.646-2.647a.5.5 0 0 1 .708 0z"/>
                            </svg>
                        </div>
                        <h3 class="welcome-title">Selamat Datang</h3>
                        <p class="welcome-subtitle">Sistem Pencetakan Laporan BPBD Kabupaten Minahasa</p>
                        <p class="welcome-tagline">"Siap Melayani Masyarakat Dalam Penanggulangan Bencana"</p>
                    </div>

                    <h2 class="text-center mb-4">Login  </h2>
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
            <!-- Logo Section -->
            <div class="login-logo-section">
                <div class="logo-container">
                    <img src="uploads/bpbd-logo.png" alt="BPBD Logo" class="bpbd-logo">
                    <h3 class="logo-title">BADAN PENANGGULANGAN <br> BENCANA DAERAH</h3>
                    <p class="logo-subtitle">Kabupaten Minahasa</p>
                </div>
            </div>
        </div>
    </div>

    <!-- Main Content -->
    <div id="main-content" style="display: <?php echo $loggedIn ? 'block' : 'none'; ?>;" class="p-4 p-md-5">
        <div class="container">
        <!-- Header -->
        <header class="bpbd-header shadow-sm rounded p-4 mb-4">
            <div class="d-flex justify-content-between align-items-center">
                <div class="d-flex align-items-center">
                    <div class="header-logo me-3">
                        <img src="uploads/bpbd-logo.png" alt="BPBD Logo" class="header-bpbd-logo">
                    </div>
                    <div>
                        <h1 class="h2 h1-md fw-bold text-dark mb-1">Rekapitulasi & Prioritisasi Dampak Bencana</h1>
                        <p class="text-muted mb-0">Sistem Pencetakan Laporan Bencana BPBD Kabupaten Minahasa</p>
                        <p class="text-muted small mb-0">Selamat datang, <?php echo htmlspecialchars($username); ?> (<?php echo htmlspecialchars($userRole); ?>)</p>
                    </div>
                </div>
                <div>
                    <a href="validation.php" class="btn btn-bpbd-primary me-2 <?php echo $userRole !== 'head' ? 'd-none' : ''; ?>" id="validate-link">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check-circle me-1" viewBox="0 0 16 16">
                            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                            <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z"/>
                        </svg>
                        Validasi Laporan
                    </a>
                    <button id="logout-btn" class="btn btn-bpbd-secondary">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-box-arrow-right me-1" viewBox="0 0 16 16">
                            <path fill-rule="evenodd" d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0v2z"/>
                            <path fill-rule="evenodd" d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3z"/>
                        </svg>
                        Logout
                    </button>
                </div>
            </div>
        </header>

        <div class="row g-4">
            <!-- Input Section -->
            <div class="col-lg-4">
                <div class="bg-white p-4 rounded shadow-sm">
                    <h2 class="h5 fw-semibold mb-3 text-dark border-bottom pb-2">Tambah Data Bencana Baru</h2>
                    <form id="disaster-form" enctype="multipart/form-data">
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
                        <div class="mb-3">
                            <label for="disasterDate" class="form-label">Tanggal Kejadian Bencana</label>
                            <input type="date" id="disasterDate" name="disasterDate" required class="form-control" value="<?php echo date('Y-m-d'); ?>">
                        </div>
                        <div class="mb-3">
                            <label for="photos" class="form-label">Foto Bencana (Opsional, maksimal 5 foto)</label>
                            <input type="file" id="photos" name="photos[]" class="form-control" multiple accept="image/*">
                            <div class="form-text">Pilih multiple foto dengan menekan Ctrl/Cmd + klik. Maksimal 5MB per foto.</div>
                        </div>
                        <button type="submit" class="w-100 btn btn-bpbd-primary fw-bold py-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-plus-circle me-2" viewBox="0 0 16 16">
                                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                                <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                            </svg>
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
                        <table id="disaster-report-table" class="table table-hover align-middle">
                            <thead class="table-light">
                                <tr>
                                    <th scope="col">Peringkat</th>
                                    <th scope="col">Jenis Bencana</th>
                                    <th scope="col">Lokasi</th>
                                    <th scope="col">Tanggal Kejadian</th>
                                    <th scope="col">Terdampak</th>
                                    <th scope="col">Kerusakan</th>
                                    <th scope="col">Indeks Dampak (SAW)</th>
                                    <th scope="col">Foto</th>
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

    <!-- Photo Modal -->
    <div class="modal fade" id="photo-modal" tabindex="-1" aria-labelledby="photoModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="photoModalLabel">Foto Bencana</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body text-center">
                    <img id="photo-modal-image" src="" alt="Foto bencana" class="img-fluid">
                </div>
            </div>
        </div>
    </div>

    <!-- Hidden Printable Area -->
    <div id="print-area" class="d-none"></div>

    <script src="https://code.jquery.com/jquery-3.7.1.min.js" integrity="sha256-/JqT3SQfawRcv/BIHPThkBvs0OEvtFFmqPF/lYI/Cxo=" crossorigin="anonymous"></script>
    
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" ...></script>
    
    <script src="https://cdn.datatables.net/2.0.8/js/dataTables.min.js"></script>
    <script src="https://cdn.datatables.net/2.0.8/js/dataTables.bootstrap5.min.js"></script>
    
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11.10.1/dist/sweetalert2.all.min.js"></script>
    
    <script src="script.js"></script>
</body>
</html>
