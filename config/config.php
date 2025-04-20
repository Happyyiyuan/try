<?php
// 数据库配置
define('DB_HOST', 'localhost');
define('DB_NAME', 'techvault_club');
define('DB_USER', 'techvault_club');
define('DB_PASS', 'KCpDHpdt1cYYD8rp');
define('DB_CHARSET', 'utf8mb4');

// JWT配置
define('JWT_SECRET', 'ai-tech-knowledge-base-secret-key');
define('JWT_EXPIRES_IN', 86400); // 24小时

// 文件上传配置
define('UPLOAD_DIR', __DIR__ . '/../uploads/');
define('MAX_FILE_SIZE', 10 * 1024 * 1024); // 10MB
define('MAX_EXECUTION_TIME', 300); // 设置最大执行时间为300秒
define('MEMORY_LIMIT', '256M'); // 设置内存限制为256M
ini_set('max_execution_time', MAX_EXECUTION_TIME);
ini_set('memory_limit', MEMORY_LIMIT);
ini_set('post_max_size', '10M');
ini_set('upload_max_filesize', '10M');

define('ALLOWED_FILE_TYPES', [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/x-httpd-php'
]);

// 数据库连接函数
function getDBConnection() {
    try {
        $dsn = sprintf('mysql:host=%s;dbname=%s;charset=%s',
            DB_HOST,
            DB_NAME,
            DB_CHARSET
        );
        
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];
        
        return new PDO($dsn, DB_USER, DB_PASS, $options);
    } catch (PDOException $e) {
        error_log('数据库连接错误: ' . $e->getMessage());
        // 在生产环境中，可能需要更友好的错误处理
        die('数据库连接失败，请稍后重试。');
    }
}