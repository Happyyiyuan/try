<?php
require_once __DIR__ . '/../../config/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    errorResponse('不支持的请求方法', 405);
}

// 获取请求数据
$data = json_decode(file_get_contents('php://input'), true);
$username = $data['username'] ?? '';
$password = $data['password'] ?? '';

// 验证必填字段
if (empty($username) || empty($password)) {
    errorResponse('用户名和密码为必填项');
}

try {
    $db = getDBConnection();
    
    // 查找用户
    $stmt = $db->prepare('SELECT * FROM users WHERE username = ? OR email = ?');
    $stmt->execute([$username, $username]);
    $user = $stmt->fetch();
    
    if (!$user || !password_verify($password, $user['password'])) {
        errorResponse('用户名或密码不正确', 401);
    }
    
    // 生成JWT令牌
    $payload = [
        'id' => $user['id'],
        'username' => $user['username'],
        'role' => $user['role'],
        'exp' => time() + JWT_EXPIRES_IN
    ];
    
    $token = jwt_encode($payload, JWT_SECRET);
    
    // 设置cookie
    setcookie('token', $token, [
        'expires' => time() + JWT_EXPIRES_IN,
        'path' => '/',
        'httponly' => true,
        'samesite' => 'Strict'
    ]);
    
    // 返回用户信息
    jsonResponse([
        'message' => '登录成功',
        'user' => [
            'id' => $user['id'],
            'username' => $user['username'],
            'email' => $user['email'],
            'role' => $user['role'],
            'avatar' => $user['avatar']
        ],
        'token' => $token
    ]);
    
} catch (Exception $e) {
    error_log('登录错误: ' . $e->getMessage());
    errorResponse('登录失败，请稍后再试', 500);
}