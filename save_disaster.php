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

$jenisBencana = trim($_POST['jenisBencana'] ?? '');
$lokasi = trim($_POST['lokasi'] ?? '');
$jiwaTerdampak = (int)($_POST['jiwaTerdampak'] ?? 0);
$kkTerdampak = (int)($_POST['kkTerdampak'] ?? 0);
$tingkatKerusakan = trim($_POST['tingkatKerusakan'] ?? '');

if (empty($jenisBencana) || empty($lokasi) || $jiwaTerdampak < 0 || $kkTerdampak < 0 || empty($tingkatKerusakan)) {
    echo json_encode(['success' => false, 'message' => 'All fields are required and must be valid']);
    exit;
}

try {
    $stmt = $pdo->prepare("INSERT INTO disasters (jenisBencana, lokasi, jiwaTerdampak, kkTerdampak, tingkatKerusakan, submitted_by) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([$jenisBencana, $lokasi, $jiwaTerdampak, $kkTerdampak, $tingkatKerusakan, $_SESSION['user_id']]);

    echo json_encode(['success' => true, 'message' => 'Disaster report saved successfully']);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
