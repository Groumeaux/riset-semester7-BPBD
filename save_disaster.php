<?php
session_start();
require_once 'config.php';

// Fungsi helper thumbnail dari file asli Anda
function create_thumbnail($originalPath, $thumbPath, $maxWidth = 150, $maxHeight = 150) {
    list($origWidth, $origHeight, $type) = @getimagesize($originalPath);
    if (!$origWidth || !$origHeight) return false;
    $ratio = min($maxWidth / $origWidth, $maxHeight / $origHeight);
    $thumbWidth = (int)($origWidth * $ratio);
    $thumbHeight = (int)($origHeight * $ratio);
    $thumbImage = imagecreatetruecolor($thumbWidth, $thumbHeight);
    switch ($type) {
        case IMAGETYPE_JPEG: $sourceImage = @imagecreatefromjpeg($originalPath); break;
        case IMAGETYPE_PNG: $sourceImage = @imagecreatefrompng($originalPath); imagealphablending($thumbImage, false); imagesavealpha($thumbImage, true); break;
        case IMAGETYPE_GIF: $sourceImage = @imagecreatefromgif($originalPath); break;
        case IMAGETYPE_WEBP: $sourceImage = @imagecreatefromwebp($originalPath); break;
        default: return false;
    }
    if (!$sourceImage) return false;
    imagecopyresampled($thumbImage, $sourceImage, 0, 0, 0, 0, $thumbWidth, $thumbHeight, $origWidth, $origHeight);
    $success = false;
    switch ($type) {
        case IMAGETYPE_JPEG: $success = imagejpeg($thumbImage, $thumbPath, 90); break;
        case IMAGETYPE_PNG: $success = imagepng($thumbImage, $thumbPath, 9); break;
        case IMAGETYPE_GIF: $success = imagegif($thumbImage, $thumbPath); break;
        case IMAGETYPE_WEBP: $success = imagewebp($thumbImage, $thumbPath, 90); break;
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

// --- LOGIKA BARU UNTUK KATEGORI ---
$kategoriLaporan = trim($_POST['kategoriLaporan'] ?? 'bencana');

// Bidang Umum
$lokasi = trim($_POST['lokasi'] ?? '');
$disasterDate = trim($_POST['disasterDate'] ?? '');
$userId = $_SESSION['user_id'];
$status = ($_SESSION['role'] === 'head') ? 'approved' : 'pending';
$validated_at = ($_SESSION['role'] === 'head') ? date('Y-m-d H:i:s') : null;

// Bidang Spesifik
$jenisBencana = '';
$keterangan = null;
$jiwaTerdampak = 0;
$kkTerdampak = 0;
$tingkatKerusakan = 'Ringan'; // Default

if (empty($lokasi) || empty($disasterDate)) {
    echo json_encode(['success' => false, 'message' => 'Lokasi dan Tanggal wajib diisi']);
    exit;
}

if ($kategoriLaporan === 'bencana') {
    $jenisBencana = trim($_POST['jenisBencana'] ?? '');
    $jiwaTerdampak = (int)($_POST['jiwaTerdampak'] ?? 0);
    $kkTerdampak = (int)($_POST['kkTerdampak'] ?? 0);
    $tingkatKerusakan = trim($_POST['tingkatKerusakan'] ?? 'Ringan');
    
    if (empty($jenisBencana)) {
        echo json_encode(['success' => false, 'message' => 'Jenis Bencana wajib diisi untuk kategori ini']);
        exit;
    }

} else if ($kategoriLaporan === 'insiden') {
    $jenisBencana = trim($_POST['jenisInsiden'] ?? ''); // Simpan "Pohon Tumbang" di kolom jenisBencana
    $keterangan = trim($_POST['keteranganInsiden'] ?? null);
    
    // Set nilai default non-SAW ke 0
    $jiwaTerdampak = 0;
    $kkTerdampak = 0;
    $tingkatKerusakan = 'Ringan'; // Atau N/A, tapi 'Ringan' lebih aman
    
    if (empty($jenisBencana)) {
        echo json_encode(['success' => false, 'message' => 'Jenis Insiden wajib diisi untuk kategori ini']);
        exit;
    }
}
// --- AKHIR LOGIKA KATEGORI ---


// Logika Upload Foto (tidak berubah)
$uploadedPhotos = [];
$uploadDir = 'uploads/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

if (isset($_FILES['photos']) && is_array($_FILES['photos']['name'])) {
    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    $maxFileSize = 5 * 1024 * 1024; // 5MB

    foreach ($_FILES['photos']['name'] as $key => $filename) {
        if (empty($filename)) continue;
        
        $fileTmp = $_FILES['photos']['tmp_name'][$key];
        $fileError = $_FILES['photos']['error'][$key];
        
        if ($fileError !== UPLOAD_ERR_OK) continue;
        
        $fileSize = @filesize($fileTmp); // Gunakan filesize() yg aman
        if ($fileSize === false || $fileSize > $maxFileSize) continue;

        $fileType = @mime_content_type($fileTmp);
        if (!in_array($fileType, $allowedTypes)) continue;

        $fileExtension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
        if (!in_array($fileType, $allowedTypes)) {
             // Cek ekstensi jika mime_content_type gagal
            if (!in_array('image/' . $fileExtension, $allowedTypes)) {
                 continue;
            }
        }

        $uniqueFilename = uniqid('disaster_', true) . '.' . $fileExtension;
        $filePath = $uploadDir . $uniqueFilename;

        if (move_uploaded_file($fileTmp, $filePath)) {
            $thumbFilename = 'thumb_' . $uniqueFilename;
            $thumbPath = $uploadDir . $thumbFilename;
            $thumbnail_created = create_thumbnail($filePath, $thumbPath);

            $uploadedPhotos[] = [
                'filename' => $uniqueFilename,
                'original_filename' => $filename,
                'file_path' => $filePath,
                'thumbnail_path' => $thumbnail_created ? $thumbPath : null
            ];
        }
    }
}


try {
    $pdo->beginTransaction();

    // SQL DIPERBARUI untuk kolom baru
    $sql = "INSERT INTO disasters (
                jenisBencana, lokasi, jiwaTerdampak, kkTerdampak, tingkatKerusakan, keterangan, 
                disaster_date, status, submitted_by, validated_at, kategori_laporan
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        $jenisBencana,
        $lokasi,
        $jiwaTerdampak,
        $kkTerdampak,
        $tingkatKerusakan,
        $keterangan,
        $disasterDate,
        $status,
        $userId,
        $validated_at,
        $kategoriLaporan
    ]);
    $disasterId = $pdo->lastInsertId();

    // Logika Insert Foto (tidak berubah)
    if (!empty($uploadedPhotos)) {
        $photoStmt = $pdo->prepare("INSERT INTO disaster_photos (disaster_id, filename, original_filename, file_path) VALUES (?, ?, ?, ?)");
        foreach ($uploadedPhotos as $photo) {
            $photoStmt->execute([$disasterId, $photo['filename'], $photo['original_filename'], $photo['file_path']]);
        }
    }

    $pdo->commit();
    echo json_encode(['success' => true, 'message' => 'Laporan berhasil disimpan']);
} catch (PDOException $e) {
    $pdo->rollBack();
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>