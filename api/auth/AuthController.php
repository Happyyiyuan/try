<?php

require_once __DIR__ . '/../../utils/Database.php';
require_once __DIR__ . '/../../utils/jwt.php';
require_once __DIR__ . '/../../utils/response_helpers.php'; // 引入响应辅助函数

class AuthController
{
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

        $this->createUser($data);
    }

    private function createUser($userData) {
        $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);
        $userId = $this->db->insert('users', [
            'username' => $userData['username'],
            'password' => $hashedPassword,
            'email' => $userData['email'],
            'created_at' => date('Y-m-d H:i:s')
        ]);

        $this->generateAuthResponse($userId, $userData['username'], $userData['email']);
    }

    private function generateAuthResponse($userId, $username, $email) {
        $token = generateJWT(['user_id' => $userId, 'username' => $username]);

        jsonResponse([
            'authToken' => $token,
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

        $this->generateAuthResponse($user['id'], $user['username'], $user['email']);
    }

    public function requestPasswordReset() {
        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['email'])) {
            errorResponse('请提供邮箱地址', 400);
            return;
        }

        $this->sendPasswordResetLink($data['email']);
    }

    public function resetPassword() {
        // This function is not used, the logic is handled in requestPasswordReset
    }

    private function sendPasswordResetLink($email) {
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