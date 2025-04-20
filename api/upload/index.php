<?php
require_once __DIR__ . '/../../config/config.php';

// 启用错误日志记录
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../../logs/upload_errors.log');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    errorResponse('不支持的请求方法', 405);
}

// 验证文件是否上传成功
if (empty($_FILES['file'])) {
    error_log('文件上传失败：未检测到上传文件');
    errorResponse('未检测到上传文件');
}

$file = $_FILES['file'];
$error = $file['error'];

// 检查上传错误
if ($error !== UPLOAD_ERR_OK) {
    $errorMessage = '';
    switch ($error) {
        case UPLOAD_ERR_INI_SIZE:
        case UPLOAD_ERR_FORM_SIZE:
            $errorMessage = '文件大小超过限制';
            break;
        case UPLOAD_ERR_PARTIAL:
            $errorMessage = '文件上传不完整';
            break;
        case UPLOAD_ERR_NO_FILE:
            $errorMessage = '未选择上传文件';
            break;
        default:
            $errorMessage = '文件上传失败';
    }
    error_log('文件上传错误：' . $errorMessage);
    errorResponse($errorMessage);
}

// 验证文件大小
if ($file['size'] > MAX_FILE_SIZE) {
    errorResponse('文件大小超过限制');
}

// 验证文件类型
$fileType = mime_content_type($file['tmp_name']);
if (!in_array($fileType, ALLOWED_FILE_TYPES)) {
    errorResponse('不支持的文件类型');
}

// 生成唯一文件名
$extension = pathinfo($file['name'], PATHINFO_EXTENSION);
$filename = uniqid() . '.' . $extension;

// 确保上传目录存在
if (!file_exists(UPLOAD_DIR)) {
    mkdir(UPLOAD_DIR, 0777, true);
}

// 移动文件到目标目录
$targetPath = UPLOAD_DIR . $filename;
if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
    $moveError = error_get_last();
    error_log('文件保存失败：' . ($moveError ? $moveError['message'] : '未知错误'));
    errorResponse('文件保存失败');
}

// 确保文件权限正确
chmod($targetPath, 0644);

// 返回文件信息
jsonResponse([
    'message' => '文件上传成功',
    'filename' => $filename,
    'originalName' => $file['name'],
    'type' => $fileType,
    'size' => $file['size'],
    'url' => '/uploads/' . $filename
]);