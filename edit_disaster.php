<?php
session_start();
require_once 'config.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

$id = $_POST['id'] ?? null;
$jenisBencana = trim($_POST['jenisBencana'] ?? ''); // Ini akan readonly, jadi aman
$lokasi = trim($_POST['lokasi'] ?? '');
$jiwaTerdampak = (int)($_POST['jiwaTerdampak'] ?? 0);
$kkTerdampak = (int)($_POST['kkTerdampak'] ?? 0);
$tingkatKerusakan = trim($_POST['tingkatKerusakan'] ?? '');
$disasterDate = trim($_POST['disasterDate'] ?? '');
$keterangan = trim($_POST['keterangan'] ?? null); // AMBIL KETERANGAN BARU

if (!$id || empty($jenisBencana) || empty($lokasi) || $jiwaTerdampak < 0 || $kkTerdampak < 0 || empty($tingkatKerusakan) || empty($disasterDate)) {
    echo json_encode(['success' => false, 'message' => 'All fields are required and must be valid']);
    exit;
}

// Cek kepemilikan
$role = $_SESSION['role'];
$userId = $_SESSION['user_id'];

try {
    $checkStmt = $pdo->prepare("SELECT submitted_by FROM disasters WHERE id = ?");
    $checkStmt->execute([$id]);
    $disaster = $checkStmt->fetch();

    if (!$disaster) {
        echo json_encode(['success' => false, 'message' => 'Laporan tidak ditemukan']);
        exit;
    }

    if ($role !== 'head' && $disaster['submitted_by'] != $userId) {
        echo json_encode(['success' => false, 'message' => 'Access denied']);
        exit;
    }

    // SQL DIPERBARUI: Tambahkan 'keterangan = ?'
    $sql = "UPDATE disasters SET 
                jenisBencana = ?, 
                lokasi = ?, 
                jiwaTerdampak = ?, 
                kkTerdampak = ?, 
                tingkatKerusakan = ?, 
                disaster_date = ?,
                keterangan = ?
            WHERE id = ?";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        $jenisBencana,
        $lokasi,
        $jiwaTerdampak,
        $kkTerdampak,
        $tingkatKerusakan,
        $disasterDate,
        $keterangan, // Tambahkan di sini
        $id
    ]);

    echo json_encode(['success' => true, 'message' => 'Laporan berhasil diperbarui']);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>