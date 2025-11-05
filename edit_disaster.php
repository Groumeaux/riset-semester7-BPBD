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
$jenisBencana = trim($_POST['jenisBencana'] ?? '');
$lokasi = trim($_POST['lokasi'] ?? '');
$jiwaTerdampak = (int)($_POST['jiwaTerdampak'] ?? 0);
$kkTerdampak = (int)($_POST['kkTerdampak'] ?? 0);
$tingkatKerusakan = trim($_POST['tingkatKerusakan'] ?? '');
$disasterDate = trim($_POST['disasterDate'] ?? '');

if (!$id || empty($jenisBencana) || empty($lokasi) || $jiwaTerdampak < 0 || $kkTerdampak < 0 || empty($tingkatKerusakan) || empty($disasterDate)) {
    echo json_encode(['success' => false, 'message' => 'All fields are required and must be valid']);
    exit;
}

// Check if user owns the disaster or is head
$role = $_SESSION['role'];
$userId = $_SESSION['user_id'];

try {
    // Check ownership
    $checkStmt = $pdo->prepare("SELECT submitted_by FROM disasters WHERE id = ?");
    $checkStmt->execute([$id]);
    $disaster = $checkStmt->fetch();

    if (!$disaster) {
        echo json_encode(['success' => false, 'message' => 'Disaster report not found']);
        exit;
    }

    if ($role !== 'head' && $disaster['submitted_by'] != $userId) {
        echo json_encode(['success' => false, 'message' => 'Access denied']);
        exit;
    }

    // Update disaster report
    $sql = "UPDATE disasters SET jenisBencana = ?, lokasi = ?, jiwaTerdampak = ?, kkTerdampak = ?, tingkatKerusakan = ?, disaster_date = ? WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        $jenisBencana,
        $lokasi,
        $jiwaTerdampak,
        $kkTerdampak,
        $tingkatKerusakan,
        $disasterDate,
        $id
    ]);

    echo json_encode(['success' => true, 'message' => 'Disaster report updated successfully']);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
