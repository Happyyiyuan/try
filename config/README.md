# 配置文件目录

此目录包含AI科技库的所有配置文件，集中管理应用的各种配置项。

## 文件说明

- `app.config.js` - 应用基础配置，如端口号、环境设置等
- `auth.config.js` - 认证相关配置，如JWT密钥、过期时间等
- `storage.config.js` - 存储相关配置，如上传目录、文件大小限制等
- `cors.config.js` - 跨域资源共享配置
- `websocket.config.js` - WebSocket服务配置

## 使用方法

配置文件采用模块化设计，可以通过以下方式导入使用：

```javascript
const appConfig = require('./config/app.config');
const authConfig = require('./config/auth.config');

// 使用配置项
const port = appConfig.port;
const jwtSecret = authConfig.jwtSecret;
```

## 环境变量

配置文件会优先读取环境变量，如果环境变量不存在，则使用默认值。环境变量可以通过以下方式设置：

1. 在`.env`文件中设置
2. 通过命令行设置
3. 通过操作系统环境变量设置

## 安全注意事项

- 敏感配置（如密钥、密码等）不应直接硬编码在配置文件中
- 生产环境的敏感配置应通过环境变量注入
- 配置文件中的敏感信息应在版本控制中忽略