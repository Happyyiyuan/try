<?php
require_once __DIR__ . '/../../config/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    errorResponse('不支持的请求方法', 405);
}

// 获取请求数据
$data = json_decode(file_get_contents('php://input'), true);
$username = $data['username'] ?? '';
$email = $data['email'] ?? '';
$password = $data['password'] ?? '';
$avatar = $data['avatar'] ?? 'https://randomuser.me/api/portraits/men/32.jpg';

// 验证必填字段
if (empty($username) || empty($email) || empty($password)) {
    errorResponse('用户名、邮箱和密码为必填项');
}

// 验证邮箱格式
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    errorResponse('邮箱格式不正确');
}

try {
    $db = getDBConnection();
    
    // 检查用户名是否已存在
    $stmt = $db->prepare('SELECT id FROM users WHERE username = ?');
    $stmt->execute([$username]);
    if ($stmt->fetch()) {
        errorResponse('用户名已被占用');
    }
    
    // 检查邮箱是否已存在
    $stmt = $db->prepare('SELECT id FROM users WHERE email = ?');
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        errorResponse('邮箱已被注册');
    }
    
    // 密码加密
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    
    // 创建新用户
    $stmt = $db->prepare('INSERT INTO users (username, email, password, avatar, role, created_at) VALUES (?, ?, ?, ?, ?, NOW())');
    $stmt->execute([$username, $email, $hashedPassword, $avatar, 'user']);
    $userId = $db->lastInsertId();
    
    // 生成JWT令牌
    $payload = [
        'id' => $userId,
        'username' => $username,
        'role' => 'user',
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
        'message' => '注册成功',
        'user' => [
            'id' => $userId,
            'username' => $username,
            'email' => $email,
            'role' => 'user',
            'avatar' => $avatar
        ],
        'token' => $token
    ], 201);
    
} catch (Exception $e) {
    error_log('注册错误: ' . $e->getMessage());
    errorResponse('注册失败，请稍后再试', 500);
}