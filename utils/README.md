# 工具类库 (Utils)

本目录包含项目中使用的各种工具类和辅助函数，为整个应用提供基础功能支持。

## 文件说明

### Database.php

数据库操作类，采用单例模式实现，提供了与数据库交互的各种方法。

**主要功能：**

- 数据库连接管理（单例模式）
- SQL查询执行（支持预处理语句）
- 数据CRUD操作（增删改查）
- 事务处理

**使用示例：**

```php
// 获取数据库实例
$db = Database::getInstance();

// 查询数据
$users = $db->fetchAll('SELECT * FROM users WHERE status = ?', ['active']);

// 插入数据
$userId = $db->insert('users', [
    'username' => 'newuser',
    'email' => 'user@example.com',
    'created_at' => date('Y-m-d H:i:s')
]);

// 更新数据
$db->update('users', 
    ['status' => 'inactive'], 
    'id = ?', 
    [$userId]
);

// 删除数据
$db->delete('users', 'id = ?', [$userId]);

// 事务处理
try {
    $db->beginTransaction();
    // 执行多个操作...
    $db->commit();
} catch (Exception $e) {
    $db->rollBack();
    // 处理错误
}
```

### jwt.php

JSON Web Token (JWT) 工具函数集，用于处理用户认证和授权。

**主要功能：**

- 生成JWT令牌
- 验证和解码JWT令牌
- 从HTTP请求中提取Bearer令牌

**使用示例：**

```php
// 生成令牌
$token = generateJWT([
    'user_id' => 123,
    'username' => 'example_user'
]);

// 验证并解码令牌
$payload = jwt_decode($token, JWT_SECRET);
if ($payload) {
    // 令牌有效，可以访问$payload中的数据
    $userId = $payload['user_id'];
} else {
    // 令牌无效或已过期
}

// 从请求头获取令牌
$token = get_bearer_token();
```

## 安全注意事项

- 所有数据库查询都使用预处理语句，防止SQL注入
- JWT密钥应保密存储，不应硬编码在源代码中
- 敏感操作应记录日志，便于审计和问题排查

## 扩展建议

- 考虑添加缓存工具类，提高频繁访问数据的性能
- 可以增加日志工具类，统一日志记录格式和存储方式
- 文件上传和处理工具类可以进一步增强安全性和功能性