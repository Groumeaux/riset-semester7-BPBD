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
        // Users see only their own approved disasters
        $stmt = $pdo->prepare("SELECT d.*, u.username as submitted_by_name FROM disasters d JOIN users u ON d.submitted_by = u.id WHERE d.submitted_by = ? AND d.status = 'approved' ORDER BY d.created_at DESC");
        $stmt->execute([$_SESSION['user_id']]);
    }

    $disasters = $stmt->fetchAll();

    echo json_encode(['success' => true, 'data' => $disasters]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
