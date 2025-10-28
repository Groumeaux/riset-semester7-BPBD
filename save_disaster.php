<?php
session_start();
require_once 'config.php';

function create_thumbnail($originalPath, $thumbPath, $maxWidth = 150, $maxHeight = 150) {
    list($origWidth, $origHeight, $type) = @getimagesize($originalPath);
    if (!$origWidth || !$origHeight) {
        return false;
    }

    $ratio = min($maxWidth / $origWidth, $maxHeight / $origHeight);
    $thumbWidth = (int)($origWidth * $ratio);
    $thumbHeight = (int)($origHeight * $ratio);

    $thumbImage = imagecreatetruecolor($thumbWidth, $thumbHeight);

    switch ($type) {
        case IMAGETYPE_JPEG:
            $sourceImage = @imagecreatefromjpeg($originalPath);
            break;
        case IMAGETYPE_PNG:
            $sourceImage = @imagecreatefrompng($originalPath);
            imagealphablending($thumbImage, false);
            imagesavealpha($thumbImage, true);
            break;
        case IMAGETYPE_GIF:
            $sourceImage = @imagecreatefromgif($originalPath);
            break;
        case IMAGETYPE_WEBP:
            $sourceImage = @imagecreatefromwebp($originalPath);
            break;
        default:
            return false; // Unsupported type
    }

    if (!$sourceImage) {
        return false;
    }

    imagecopyresampled($thumbImage, $sourceImage, 0, 0, 0, 0, $thumbWidth, $thumbHeight, $origWidth, $origHeight);

    $success = false;
    switch ($type) {
        case IMAGETYPE_JPEG:
            $success = imagejpeg($thumbImage, $thumbPath, 90);
            break;
        case IMAGETYPE_PNG:
            $success = imagepng($thumbImage, $thumbPath, 9);
            break;
        case IMAGETYPE_GIF:
            $success = imagegif($thumbImage, $thumbPath);
            break;
        case IMAGETYPE_WEBP:
            $success = imagewebp($thumbImage, $thumbPath, 90);
            break;
    }

    imagedestroy($sourceImage);
    imagedestroy($thumbImage);

    return $success;
}

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
$disasterDate = trim($_POST['disasterDate'] ?? '');

if (empty($jenisBencana) || empty($lokasi) || $jiwaTerdampak < 0 || $kkTerdampak < 0 || empty($tingkatKerusakan) || empty($disasterDate)) {
    echo json_encode(['success' => false, 'message' => 'All fields are required and must be valid']);
    exit;
}

// Handle photo uploads
$uploadedPhotos = [];
$uploadDir = 'uploads/';

if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

// Handle photo uploads
$uploadedPhotos = [];
$uploadDir = 'uploads/';

if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

if (isset($_FILES['photos']) && is_array($_FILES['photos']['name'])) {
    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    $maxFileSize = 5 * 1024 * 1024; // 5MB

    foreach ($_FILES['photos']['name'] as $key => $filename) {
        if (!empty($filename)) {
            $fileTmp = $_FILES['photos']['tmp_name'][$key];
            $fileType = $_FILES['photos']['type'][$key];
            $fileSize = $_FILES['photos']['size'][$key];
            $fileError = $_FILES['photos']['error'][$key];

            // Validasi file
            if ($fileError !== UPLOAD_ERR_OK) {
                continue; // Lewati file ini
            }
            if (!in_array($fileType, $allowedTypes)) {
                continue; // Lewati tipe file yang tidak valid
            }
            if ($fileSize > $maxFileSize) {
                continue; // Lewati file yang terlalu besar
            }

            // Buat nama file unik
            $fileExtension = pathinfo($filename, PATHINFO_EXTENSION);
            $uniqueFilename = uniqid('disaster_', true) . '.' . $fileExtension;
            $filePath = $uploadDir . $uniqueFilename;

            // Pindahkan file YANG DIUPLOAD
            if (move_uploaded_file($fileTmp, $filePath)) {
                
                // --- LOGIKA THUMBNAIL PINDAH KE SINI ---
                $thumbFilename = 'thumb_' . $uniqueFilename;
                $thumbPath = $uploadDir . $thumbFilename;
                $thumbnail_created = create_thumbnail($filePath, $thumbPath);
                // ------------------------------------

                // Tambahkan ke array $uploadedPhotos DENGAN thumbnail_path
                $uploadedPhotos[] = [
                    'filename' => $uniqueFilename,
                    'original_filename' => $filename,
                    'file_path' => $filePath,
                    'thumbnail_path' => $thumbnail_created ? $thumbPath : null
                ];
            }
        }
    }
}

// Determine status based on user role: head reports are auto-approved
$status = ($_SESSION['role'] === 'head') ? 'approved' : 'pending';
$validated_at = ($_SESSION['role'] === 'head') ? date('Y-m-d H:i:s') : null;

try {


    // Start transaction
    $pdo->beginTransaction();

    // Insert disaster report
    $sql = "INSERT INTO disasters (jenisBencana, lokasi, jiwaTerdampak, kkTerdampak, tingkatKerusakan, disaster_date, status, submitted_by, validated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        $jenisBencana,
        $lokasi,
        $jiwaTerdampak,
        $kkTerdampak,
        $tingkatKerusakan,
        $disasterDate,
        $status,
        $_SESSION['user_id'],
        $validated_at
    ]);
    $disasterId = $pdo->lastInsertId();

// --- MODIFIKASI: Kueri INSERT untuk foto ---
    if (!empty($uploadedPhotos)) {
        $photoStmt = $pdo->prepare("INSERT INTO disaster_photos (disaster_id, filename, original_filename, file_path) VALUES (?, ?, ?, ?)");
        foreach ($uploadedPhotos as $photo) {
            $photoStmt->execute([$disasterId, $photo['filename'], $photo['original_filename'], $photo['file_path']]);
        }
    }
    // ---------------------------------------------

    $pdo->commit();
    echo json_encode(['success' => true, 'message' => 'Disaster report saved successfully']);
} catch (PDOException $e) {
    $pdo->rollBack();
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
