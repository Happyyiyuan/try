<?php
/**
 * JWT (JSON Web Token) 工具类
 * 
 * 提供JWT令牌的生成、验证和解析功能
 * 实现了HS256签名算法
 */

/**
 * 生成JWT令牌
 * 
 * @param array $payload 令牌载荷数据
 * @param string $secret 签名密钥
 * @param int $expiry 过期时间(秒)，默认为24小时
 * @return string 生成的JWT令牌
 */
function jwt_encode($payload, $secret, $expiry = 86400) {
    // 设置标准声明
    $payload['iat'] = time(); // 签发时间
    $payload['exp'] = time() + $expiry; // 过期时间
    $payload['jti'] = bin2hex(random_bytes(16)); // 唯一标识符
    
    $header = [
        'typ' => 'JWT',
        'alg' => 'HS256'
    ];
    
    // Base64Url编码
    $base64UrlHeader = rtrim(strtr(base64_encode(json_encode($header)), '+/', '-_'), '=');
    $base64UrlPayload = rtrim(strtr(base64_encode(json_encode($payload)), '+/', '-_'), '=');
    
    // 生成签名
    $signature = hash_hmac('sha256', $base64UrlHeader . '.' . $base64UrlPayload, $secret, true);
    $base64UrlSignature = rtrim(strtr(base64_encode($signature), '+/', '-_'), '=');
    
    return $base64UrlHeader . '.' . $base64UrlPayload . '.' . $base64UrlSignature;
}

/**
 * 验证JWT令牌并解码载荷
 * 
 * @param string $token JWT令牌
 * @param string $secret 签名密钥
 * @param bool $verify_expiry 是否验证过期时间，默认为true
 * @return array|false 成功返回载荷数组，失败返回false
 */
function jwt_decode($token, $secret, $verify_expiry = true) {
    // 检查令牌格式
    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        error_log('JWT格式错误: 不是有效的JWT格式');
        return false;
    }
    
    list($base64UrlHeader, $base64UrlPayload, $base64UrlSignature) = $parts;
    
    // 解码头部和载荷
    $header = json_decode(base64_decode(strtr($base64UrlHeader, '-_', '+/')), true);
    $payload = json_decode(base64_decode(strtr($base64UrlPayload, '-_', '+/')), true);
    
    if (!$header || !$payload) {
        error_log('JWT解码失败: 无法解析头部或载荷');
        return false;
    }
    
    // 验证签名
    $signature = base64_decode(strtr($base64UrlSignature, '-_', '+/'));
    $expectedSignature = hash_hmac('sha256', $base64UrlHeader . '.' . $base64UrlPayload, $secret, true);
    
    if (!hash_equals($signature, $expectedSignature)) {
        error_log('JWT签名验证失败');
        return false;
    }
    
    // 验证算法
    if (!isset($header['alg']) || $header['alg'] !== 'HS256') {
        error_log('JWT算法不支持: ' . ($header['alg'] ?? '未指定'));
        return false;
    }
    
    // 验证过期时间
    if ($verify_expiry && isset($payload['exp'])) {
        if (time() > $payload['exp']) {
            error_log('JWT已过期');
            return false;
        }
    }
    
    return $payload;
}

/**
 * 从请求头中获取JWT令牌
 * 
 * @return string|false 成功返回令牌，失败返回false
 */
function get_bearer_token() {
    $headers = null;
    
    // 检查授权头
    if (isset($_SERVER['Authorization'])) {
        $headers = trim($_SERVER['Authorization']);
    } elseif (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $headers = trim($_SERVER['HTTP_AUTHORIZATION']);
    } elseif (function_exists('apache_request_headers')) {
        $requestHeaders = apache_request_headers();
        if (isset($requestHeaders['Authorization'])) {
            $headers = trim($requestHeaders['Authorization']);
        }
    }
    
    // 提取令牌
    if ($headers && preg_match('/Bearer\s(\S+)/', $headers, $matches)) {
        return $matches[1];
    }
    
    return false;
}

/**
 * 生成JWT令牌并设置标准声明
 * 
 * @param array $userData 用户数据
 * @return string 生成的JWT令牌
 */
function generateJWT($userData) {
    $config = require __DIR__ . '/../config/config.php';
    $secret = defined('JWT_SECRET') ? JWT_SECRET : $config['jwt_secret'];
    $expiry = defined('JWT_EXPIRES_IN') ? JWT_EXPIRES_IN : $config['jwt_expires_in'];
    
    return jwt_encode($userData, $secret, $expiry);
}

/**
 * 验证JWT令牌并返回载荷
 * 
 * @param string $token JWT令牌
 * @return array|false 成功返回载荷数组，失败返回false
 */
function verifyJWT($token) {
    $config = require __DIR__ . '/../config/config.php';
    $secret = defined('JWT_SECRET') ? JWT_SECRET : $config['jwt_secret'];
    
    return jwt_decode($token, $secret);
}