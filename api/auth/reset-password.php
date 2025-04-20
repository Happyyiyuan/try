<?php
require_once __DIR__ . '/../../config/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    errorResponse('不支持的请求方法', 405);
}

// 获取请求数据
$data = json_decode(file_get_contents('php://input'), true);
$email = $data['email'] ?? '';
$token = $data['token'] ?? '';
$newPassword = $data['newPassword'] ?? '';

// 验证必填字段
if (empty($email)) {
    errorResponse('邮箱为必填项');
}

try {
    $db = getDBConnection();
    
    if (empty($token)) {
        // 生成重置密码令牌
        $resetToken = bin2hex(random_bytes(32));
        $resetExpire = date('Y-m-d H:i:s', strtotime('+1 hour'));
        
        // 更新用户的重置令牌
        $stmt = $db->prepare('UPDATE users SET resetPasswordToken = ?, resetPasswordExpire = ? WHERE email = ?');
        $stmt->execute([$resetToken, $resetExpire, $email]);
        
        if ($stmt->rowCount() === 0) {
            errorResponse('未找到该邮箱对应的用户');
        }
        
        // TODO: 发送重置密码邮件
        // 这里应该集成邮件发送功能
        
        jsonResponse([
            'message' => '重置密码链接已发送到您的邮箱',
            'resetToken' => $resetToken
        ]);
    } else {
        // 验证令牌并重置密码
        if (empty($newPassword)) {
            errorResponse('新密码为必填项');
        }
        
        // 验证令牌是否有效
        $stmt = $db->prepare('SELECT id FROM users WHERE email = ? AND resetPasswordToken = ? AND resetPasswordExpire > NOW()');
        $stmt->execute([$email, $token]);
        $user = $stmt->fetch();
        
        if (!$user) {
            errorResponse('重置密码链接无效或已过期');
        }
        
        // 更新密码
        $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
        $stmt = $db->prepare('UPDATE users SET password = ?, resetPasswordToken = NULL, resetPasswordExpire = NULL WHERE id = ?');
        $stmt->execute([$hashedPassword, $user['id']]);
        
        jsonResponse([
            'message' => '密码重置成功'
        ]);
    }
} catch (Exception $e) {
    errorResponse('密码重置失败: ' . $e->getMessage());
}