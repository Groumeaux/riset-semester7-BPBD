<?php
session_start();
require_once 'config.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit;
}

$role = $_SESSION['role'];

try {
    if ($role === 'head') {
        // Head sees all disasters
        $stmt = $pdo->query("SELECT d.*, u.username as submitted_by_name FROM disasters d JOIN users u ON d.submitted_by = u.id ORDER BY d.created_at DESC");
    } else {
        // Users see all approved disasters
        $stmt = $pdo->query("SELECT d.*, u.username as submitted_by_name FROM disasters d JOIN users u ON d.submitted_by = u.id WHERE d.status = 'approved' ORDER BY d.created_at DESC");
    }

    $disasters = $stmt->fetchAll();

    // Get photos for each disaster
    foreach ($disasters as &$disaster) {
        $photoStmt = $pdo->prepare("SELECT id, filename, original_filename, file_path, uploaded_at FROM disaster_photos WHERE disaster_id = ? ORDER BY uploaded_at ASC");
        $photoStmt->execute([$disaster['id']]);
        $disaster['photos'] = $photoStmt->fetchAll();
    }

    echo json_encode(['success' => true, 'data' => $disasters]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
