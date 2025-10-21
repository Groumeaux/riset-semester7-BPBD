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
            <header class="bg-white shadow-sm rounded p-4 mb-4">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h1 class="h2 h1-md fw-bold text-dark">Validasi Laporan Bencana</h1>
                        <p class="text-muted mt-1">Selamat datang, <?php echo htmlspecialchars($username); ?> (Kepala)</p>
                    </div>
                    <div>
                        <a href="index.php" class="btn btn-outline-primary me-2">Kembali ke Dashboard</a>
                        <button id="logout-btn" class="btn btn-outline-secondary">Logout</button>
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

    <!-- Bootstrap JS Bundle -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" xintegrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" crossorigin="anonymous"></script>
    <script src="validate.js"></script>
</body>
</html>
