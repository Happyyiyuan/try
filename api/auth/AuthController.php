<?php

require_once __DIR__ . '/../../utils/Database.php';
require_once __DIR__ . '/../../utils/jwt.php';
require_once __DIR__ . '/../../utils/response_helpers.php'; // 引入响应辅助函数

class AuthController {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    public function register() {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['username']) || !isset($data['password']) || !isset($data['email'])) {
            errorResponse('请提供用户名、密码和邮箱', 400);
            return;
        }

        // 检查用户名是否已存在
        $existingUser = $this->db->fetch(
            'SELECT id FROM users WHERE username = ?',
            [$data['username']]
        );

        if ($existingUser) {
            errorResponse('用户名已存在', 409);
            return;
        }

        // 创建新用户
        $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);
        $userId = $this->db->insert('users', [
            'username' => $data['username'],
            'password' => $hashedPassword,
            'email' => $data['email'],
            'created_at' => date('Y-m-d H:i:s')
        ]);

        $token = generateJWT(['user_id' => $userId, 'username' => $data['username']]);

        jsonResponse([
            'token' => $token,
            'user' => [
                'id' => $userId,
                'username' => $data['username'],
                'email' => $data['email']
            ]
        ]);
    }

    public function login() {
        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['username']) || !isset($data['password'])) {
            errorResponse('请提供用户名和密码', 400);
            return;
        }

        $user = $this->db->fetch(
            'SELECT id, username, password, email FROM users WHERE username = ?',
            [$data['username']]
        );

        if (!$user || !password_verify($data['password'], $user['password'])) {
            errorResponse('用户名或密码错误', 401);
            return;
        }

        $token = generateJWT(['user_id' => $user['id'], 'username' => $user['username']]);

        jsonResponse([
            'token' => $token,
            'user' => [
                'id' => $user['id'],
                'username' => $user['username'],
                'email' => $user['email']
            ]
        ]);
    }

    public function resetPassword() {
        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['email'])) {
            errorResponse('请提供邮箱地址', 400);
            return;
        }

        $user = $this->db->fetch(
            'SELECT id, username FROM users WHERE email = ?',
            [$data['email']]
        );

        if (!$user) {
            errorResponse('未找到该邮箱对应的用户', 404);
            return;
        }

        // 生成重置令牌
        $resetToken = bin2hex(random_bytes(32));
        $expiry = date('Y-m-d H:i:s', strtotime('+1 hour'));

        $this->db->insert('password_resets', [
            'user_id' => $user['id'],
            'token' => $resetToken,
            'expires_at' => $expiry
        ]);

        // TODO: 发送重置密码邮件
        // 在实际部署时需要配置邮件服务

        jsonResponse(['message' => '密码重置链接已发送到您的邮箱']);
    }
}

// 处理请求
$controller = new AuthController();
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// header('Content-Type: application/json'); // 由 jsonResponse 处理

switch ($path) {
    case '/api/auth/register':
        if ($method === 'POST') {
            $controller->register();
        }
        break;

    case '/api/auth/login':
        if ($method === 'POST') {
            $controller->login();
        }
        break;

    case '/api/auth/reset-password':
        if ($method === 'POST') {
            $controller->resetPassword();
        }
        break;

    default:
        errorResponse('未找到请求的接口', 404);
}