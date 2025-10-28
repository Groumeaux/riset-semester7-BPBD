<?php
session_start();
require_once 'config.php';

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'head') {
    header('Location: index.php');
    exit;
}

$username = $_SESSION['username'] ?? '';
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Validasi Laporan Bencana - BPBD</title>
    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" xintegrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="p-4 p-md-5">
        <div class="container">
            <!-- Header -->
            <header class="bpbd-header shadow-sm rounded p-4 mb-4">
                <div class="d-flex justify-content-between align-items-center">
                    <div class="d-flex align-items-center">
                        <div class="header-logo me-3">
                            <img src="uploads/bpbd-logo.png" alt="BPBD Logo" class="header-bpbd-logo">
                        </div>
                        <div>
                            <h1 class="h2 h1-md fw-bold text-dark mb-1">Validasi Laporan Bencana</h1>
                            <p class="text-muted mb-0">Sistem Informasi Bencana BPBD Kabupaten Minahasa</p>
                            <p class="text-muted small mb-0">Selamat datang, <?php echo htmlspecialchars($username); ?> (Kepala)</p>
                        </div>
                    </div>
                    <div>
                        <a href="index.php" class="btn btn-bpbd-primary me-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-left me-1" viewBox="0 0 16 16">
                                <path fill-rule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/>
                            </svg>
                            Kembali ke Dashboard
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

            <!-- Monthly Validation Section -->
            <div class="bg-white p-4 rounded shadow-sm">
                <h2 class="h5 fw-semibold mb-3 text-dark border-bottom pb-2">Validasi Laporan Bulanan</h2>
                <div class="mb-4">
                    <p class="text-muted">Laporan bencana bulan ini akan divalidasi secara batch. Pastikan semua laporan telah ditinjau sebelum menyetujui.</p>
                    <div class="row g-3">
                        <div class="col-md-4">
                            <div class="card bg-light">
                                <div class="card-body text-center">
                                    <h5 class="card-title text-primary" id="pending-count">0</h5>
                                    <p class="card-text">Laporan Menunggu</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="card bg-success-subtle">
                                <div class="card-body text-center">
                                    <h5 class="card-title text-success" id="approved-count">0</h5>
                                    <p class="card-text">Sudah Disetujui</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="card bg-danger-subtle">
                                <div class="card-body text-center">
                                    <h5 class="card-title text-danger" id="rejected-count">0</h5>
                                    <p class="card-text">Ditolak</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="d-flex gap-2 mb-4">
                    <button id="approve-all-btn" class="btn btn-success">Setujui Semua Laporan Bulan Ini</button>
                    <button id="reject-all-btn" class="btn btn-danger">Tolak Semua Laporan Bulan Ini</button>
                </div>

                <div class="table-responsive">
                    <table class="table table-hover align-middle">
                        <thead class="table-light">
                            <tr>
                                <th scope="col"><input type="checkbox" id="select-all"></th>
                                <th scope="col">Jenis Bencana</th>
                                <th scope="col">Lokasi</th>
                                <th scope="col">Terdampak</th>
                                <th scope="col">Kerusakan</th>
                                <th scope="col">Pengirim</th>
                                <th scope="col">Tanggal</th>
                                <th scope="col">Foto</th>
                                <th scope="col">Status</th>
                            </tr>
                        </thead>
                        <tbody id="pending-reports-body">
                            <!-- Pending reports will be loaded here -->
                        </tbody>
                    </table>
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

    <!-- Bootstrap JS Bundle -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" xintegrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" crossorigin="anonymous"></script>
    <!-- SweetAlert2 JS -->
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <script src="validate.js"></script>
</body>
</html>
