<?php
// 设置错误报告
error_reporting(E_ALL);
ini_set('display_errors', 1);

// 设置时区
date_default_timezone_set('Asia/Shanghai');

// 启用会话
session_start();

// 加载配置文件
require_once __DIR__ . '/config/config.php';

// 设置响应头
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// 处理OPTIONS请求
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 获取请求路径
$request_uri = $_SERVER['REQUEST_URI'];
$path = parse_url($request_uri, PHP_URL_PATH);

// 路由处理
switch ($path) {
    case '/api/auth/login':
        require_once __DIR__ . '/api/auth/login.php';
        break;
        
    case '/api/auth/register':
        require_once __DIR__ . '/api/auth/register.php';
        break;
        
    case '/api/auth/logout':
        require_once __DIR__ . '/api/auth/logout.php';
        break;
        
    case '/api/auth/me':
        require_once __DIR__ . '/api/auth/me.php';
        break;
        
    case '/api/products':
        require_once __DIR__ . '/api/products/index.php';
        break;
        
    case '/api/submissions':
        require_once __DIR__ . '/api/submissions/index.php';
        break;
        
    case '/api/uploads':
        require_once __DIR__ . '/api/uploads/index.php';
        break;
        
    default:
        http_response_code(404);
        echo json_encode(['error' => '请求的资源不存在']);
        break;
}