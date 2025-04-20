<?php
/**
 * JWT (JSON Web Token) 工具类
 * 
 * 提供JWT令牌的生成、验证和解析功能
 * 实现了HS256签名算法.
 */

class JWTUtil
{
    private static $config;

    public static function init()
    {
        if (self::$config === null) {
            self::$config = require __DIR__ . '/../config/config.php';
        }
    }

    /**
     * 生成JWT令牌
     *
     * @param array $payload  令牌载荷数据
     * @param int   $expiry   过期时间(秒)，默认为配置中的值
     *
     * @return string 生成的JWT令牌
     */
    public static function encode(array $payload, int $expiry = null): string
    {
        self::init();
        $secret = defined('JWT_SECRET') ? JWT_SECRET : self::$config['jwt_secret'];
        $expiry = $expiry ?? (defined('JWT_EXPIRES_IN') ? JWT_EXPIRES_IN : self::$config['jwt_expires_in']);

        $payload['iat'] = time();  // 签发时间
        $payload['exp'] = time() + $expiry;  // 过期时间
        $payload['jti'] = bin2hex(random_bytes(16));  // 唯一标识符

        $header = ['typ' => 'JWT', 'alg' => 'HS256'];

        $base64UrlHeader = self::base64UrlEncode(json_encode($header));
        $base64UrlPayload = self::base64UrlEncode(json_encode($payload));
        $signature = hash_hmac('sha256', $base64UrlHeader . '.' . $base64UrlPayload, $secret, true);
        $base64UrlSignature = self::base64UrlEncode($signature);

        return $base64UrlHeader . '.' . $base64UrlPayload . '.' . $base64UrlSignature;
    }

    /**
     * 验证JWT令牌并解码载荷
     *
     * @param string $token         JWT令牌
     * @param bool   $verify_expiry 是否验证过期时间，默认为true
     *
     * @return array|false 成功返回载荷数组，失败返回false
     */
    public static function decode(string $token, bool $verify_expiry = true)
    {
        self::init();
        $secret = defined('JWT_SECRET') ? JWT_SECRET : self::$config['jwt_secret'];

        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            error_log('JWT格式错误: 不是有效的JWT格式');

            return false;
        }

        [$base64UrlHeader, $base64UrlPayload, $base64UrlSignature] = $parts;

        $header = json_decode(self::base64UrlDecode($base64UrlHeader), true);
        $payload = json_decode(self::base64UrlDecode($base64UrlPayload), true);

        if (!$header || !$payload) {
            error_log('JWT解码失败: 无法解析头部或载荷');

            return false;
        }

        $signature = self::base64UrlDecode($base64UrlSignature);
        $expectedSignature = hash_hmac('sha256', $base64UrlHeader . '.' . $base64UrlPayload, $secret, true);

        if (!hash_equals($signature, $expectedSignature)) {
            error_log('JWT签名验证失败');

            return false;
        }

        if (!isset($header['alg']) || $header['alg'] !== 'HS256') {
            error_log('JWT算法不支持: ' . ($header['alg'] ?? '未指定'));

            return false;
        }

        if ($verify_expiry && isset($payload['exp']) && time() > $payload['exp']) {
            error_log('JWT已过期');

            return false;
        }

        return $payload;
    }

    /**
     * 从请求头中获取JWT令牌
     *
     * @return string|false 成功返回令牌，失败返回false
     */
    public static function getBearerToken()
    {
        $headers = null;

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

        if ($headers && preg_match('/Bearer\s(\S+)/', $headers, $matches)) {
            return $matches[1];
        }

        return false;
    }

    private static function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function base64UrlDecode(string $data): string
    {
        return base64_decode(strtr($data, '-_', '+/'));
    }

    /**
     *  验证JWT令牌
     *
     * @param string $token JWT令牌
     *
     * @return array|false 成功返回载荷数组，失败返回false
     */
    public static function verify(string $token)
    {
        return self::decode($token);
    }
}