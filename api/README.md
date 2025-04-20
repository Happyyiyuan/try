# API 接口目录

此目录包含AI科技库的所有API接口实现，按功能模块分类组织。

## 目录结构

- `auth/` - 用户认证相关接口
  - `AuthController.php` - 认证控制器
  - `login.php` - 用户登录接口
  - `register.php` - 用户注册接口
  - `reset-password.php` - 密码重置接口

- `products/` - 产品相关接口
  - `ProductController.php` - 产品控制器
  - `index.php` - 产品列表和详情接口

- `submissions/` - 内容提交相关接口
  - `SubmissionController.php` - 提交控制器
  - `index.php` - 提交列表和详情接口

- `upload/` - 文件上传相关接口
  - `index.php` - 文件上传处理接口

## 接口规范

所有API接口遵循RESTful设计原则，返回JSON格式数据。

### 通用响应格式

```json
{
  "status": "success", // 或 "error"
  "data": {}, // 成功时返回的数据
  "message": "" // 错误时的提示信息
}
```

### 认证方式

大部分API需要JWT认证，客户端需要在请求头中包含有效的token：

```
Authorization: Bearer {token}
```

### 错误处理

API使用HTTP状态码表示请求状态：
- 200: 成功
- 400: 请求参数错误
- 401: 未授权
- 403: 权限不足
- 404: 资源不存在
- 500: 服务器内部错误

## 开发指南

添加新API时，请遵循以下规范：

1. 在相应模块目录下创建新文件
2. 使用控制器处理复杂逻辑
3. 确保返回统一的响应格式
4. 添加适当的错误处理
5. 更新API文档