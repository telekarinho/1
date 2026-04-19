<?php
/**
 * MilkyPot — Upload de Mídia para TV Indoor
 * ==========================================
 * Faça upload deste arquivo para a raiz do seu hosting no Hostinger.
 * Crie a pasta: public_html/uploads/tv-media/   (permissão 755)
 *
 * ENDPOINTS:
 *   POST   /upload-media.php          → upload de imagem ou vídeo
 *   DELETE /upload-media.php?file=XYZ → remove arquivo
 *
 * SEGURANÇA:
 *   Todas as requisições precisam do header:  X-Upload-Token: SEU_TOKEN
 *   Troque o valor de UPLOAD_TOKEN abaixo por uma string aleatória sua.
 *   O mesmo token deve ser configurado no painel TV Indoor.
 */

// ============================================================
// CONFIGURAÇÃO — altere apenas estas duas linhas
// ============================================================
define('UPLOAD_TOKEN', 'mp_tv_muda_aqui_123');   // ← troque por algo aleatório
define('BASE_URL',     'https://milkypot.com');   // ← URL raiz do seu hosting
// ============================================================

// --- CORS ---
$allowed = ['https://milkypot.com','https://www.milkypot.com',
            'https://milkypot-ad945.web.app','https://milkypot-ad945.firebaseapp.com',
            'https://milkypot.vercel.app','http://localhost:8090','http://localhost:3000'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed) || (str_ends_with($origin, '.vercel.app') && str_contains($origin, 'milkypot'))) {
    header("Access-Control-Allow-Origin: $origin");
}
header('Access-Control-Allow-Methods: POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Upload-Token');
header('Vary: Origin');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

// --- Auth ---
$token = $_SERVER['HTTP_X_UPLOAD_TOKEN'] ?? '';
if ($token !== UPLOAD_TOKEN) {
    http_response_code(401);
    echo json_encode(['ok' => false, 'error' => 'Token inválido']);
    exit;
}

$uploadDir = __DIR__ . '/uploads/tv-media/';

// --- DELETE ---
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $file = basename($_GET['file'] ?? '');
    if (!$file) { http_response_code(400); echo json_encode(['ok'=>false,'error'=>'file missing']); exit; }
    $path = $uploadDir . $file;
    if (file_exists($path)) { unlink($path); }
    echo json_encode(['ok' => true]);
    exit;
}

// --- POST (upload) ---
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    $err = $_FILES['file']['error'] ?? 'no file';
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Upload error: ' . $err]);
    exit;
}

$f      = $_FILES['file'];
$mime   = mime_content_type($f['tmp_name']);
$maxMB  = 300;

// Valida tipo
$imgTypes = ['image/jpeg','image/png','image/webp','image/gif'];
$vidTypes = ['video/mp4','video/webm','video/quicktime','video/x-msvideo','video/avi'];
$allowed_types = array_merge($imgTypes, $vidTypes);

if (!in_array($mime, $allowed_types)) {
    http_response_code(415);
    echo json_encode(['ok' => false, 'error' => 'Tipo não suportado: ' . $mime]);
    exit;
}

if ($f['size'] > $maxMB * 1024 * 1024) {
    http_response_code(413);
    echo json_encode(['ok' => false, 'error' => "Arquivo muito grande (max {$maxMB}MB)"]);
    exit;
}

// Cria pasta se não existir
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

// Gera nome único
$ext      = in_array($mime, $vidTypes) ? 'mp4' : 'jpg';
$filename = 'm_' . bin2hex(random_bytes(8)) . '_' . time() . '.' . $ext;
$dest     = $uploadDir . $filename;

if (!move_uploaded_file($f['tmp_name'], $dest)) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Falha ao salvar arquivo']);
    exit;
}

$url = BASE_URL . '/uploads/tv-media/' . $filename;
echo json_encode(['ok' => true, 'url' => $url, 'filename' => $filename]);
