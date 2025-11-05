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

if (!$id) {
    echo json_encode(['success' => false, 'message' => 'Disaster ID is required']);
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

    // Get photos to delete files
    $photoStmt = $pdo->prepare("SELECT file_path FROM disaster_photos WHERE disaster_id = ?");
    $photoStmt->execute([$id]);
    $photos = $photoStmt->fetchAll();

    // Delete photo files
    foreach ($photos as $photo) {
        if (file_exists($photo['file_path'])) {
            unlink($photo['file_path']);
        }
        // Also delete thumbnail if exists
        $thumbPath = str_replace('disaster_', 'thumb_disaster_', $photo['file_path']);
        if (file_exists($thumbPath)) {
            unlink($thumbPath);
        }
    }

    // Delete disaster (photos will be deleted via CASCADE)
    $stmt = $pdo->prepare("DELETE FROM disasters WHERE id = ?");
    $stmt->execute([$id]);

    echo json_encode(['success' => true, 'message' => 'Disaster report deleted successfully']);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
