<?php
session_start();
require_once 'config.php';

header('Content-Type: application/json');

// Security check: only users with the 'head' role can perform this action.
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'head') {
    echo json_encode(['success' => false, 'message' => 'Akses ditolak. Anda tidak memiliki izin untuk melakukan aksi ini.']);
    exit;
}

// Ensure the request is a POST request.
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Metode permintaan tidak valid.']);
    exit;
}

$id = $_POST['id'] ?? null;
$action = $_POST['action'] ?? null; // Expecting 'approved' or 'rejected'

// Validate the input from the frontend.
if ($id === null || !in_array($action, ['approved', 'rejected'])) {
    echo json_encode(['success' => false, 'message' => 'Data input tidak valid.']);
    exit;
}

try {
    // Check if the report exists and is from current month
    $currentMonth = date('Y-m-01'); // First day of current month
    $nextMonth = date('Y-m-01', strtotime('+1 month')); // First day of next month

    $checkStmt = $pdo->prepare("SELECT id FROM disasters WHERE id = ? AND status = 'pending' AND created_at >= ? AND created_at < ?");
    $checkStmt->execute([$id, $currentMonth, $nextMonth]);

    if ($checkStmt->rowCount() === 0) {
        echo json_encode(['success' => false, 'message' => 'Laporan tidak ditemukan, sudah diproses, atau bukan dari bulan ini.']);
        exit;
    }

    // Prepare and execute the database update.
    // We also set the 'validated_at' timestamp.
    $stmt = $pdo->prepare("UPDATE disasters SET status = ?, validated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'pending'");
    $stmt->execute([$action, $id]);

    // Check if any row was actually updated.
    if ($stmt->rowCount() > 0) {
        $message = 'Laporan berhasil di-' . ($action === 'approved' ? 'setujui' : 'tolak') . '.';
        echo json_encode(['success' => true, 'message' => $message]);
    } else {
        // This happens if the report was already validated or the ID doesn't exist.
        echo json_encode(['success' => false, 'message' => 'Laporan tidak ditemukan atau sudah diproses sebelumnya.']);
    }

} catch (PDOException $e) {
    // Handle potential database errors.
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>