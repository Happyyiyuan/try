# AI科技库 MySQL 数据库设置指南

本文档提供了如何为AI科技库网站设置MySQL数据库的详细说明。

## 数据库安装

### Windows系统

1. 下载并安装MySQL：
   - 访问 [MySQL官方网站](https://dev.mysql.com/downloads/mysql/)
   - 下载MySQL安装程序
   - 运行安装程序，选择「Developer Default」设置
   - 设置root密码并完成安装

### Linux系统

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation

# CentOS/RHEL
sudo yum install mysql-server
sudo systemctl start mysqld
sudo mysql_secure_installation
```

## 数据库配置

1. 使用MySQL命令行工具连接到MySQL服务器：

```bash
mysql -u root -p
```

2. 运行setup.sql脚本创建数据库和表：

```bash
source /path/to/setup.sql
```

或者在MySQL命令行中执行：

```sql
\. /path/to/setup.sql
```

## 项目配置

1. 修改项目的`.env`文件，设置数据库连接信息：

```
DB_NAME=ai_tech_library
DB_USER=root
DB_PASSWORD=你的密码
DB_HOST=localhost
DB_PORT=3306
DB_DIALECT=mysql
```

2. 确保`config/database.js`文件正确配置了Sequelize连接。

## 数据库结构

### 用户表 (users)
- 存储用户账户信息
- 包含用户名、邮箱、密码哈希、头像URL、角色等字段
- 主键：id
- 索引：username, email, role

### 产品表 (products)
- 存储产品信息
- 包含名称、描述、类别、图片URL等字段
- 主键：id
- 索引：category, name
- 全文索引：name, description

### 产品规格表 (product_specs)
- 存储产品的多个规格信息
- 外键关联到products表

### 提交内容表 (submissions)
- 存储用户提交的内容
- 包含标题、内容、类别、状态等字段
- 主键：id
- 外键：user_id关联到users表
- 索引：category, status, user_id
- 全文索引：title, content

### 提交内容标签表 (submission_tags)
- 存储提交内容的多个标签
- 外键关联到submissions表

### 评论表 (comments)
- 存储用户评论
- 可以关联到提交内容或产品
- 支持嵌套评论（回复）
- 主键：id
- 外键：user_id, submission_id, product_id, parent_id

## 数据迁移

如果需要从JSON文件迁移数据到MySQL，可以使用项目中的数据迁移工具：

```bash
node scripts/migrate-data.js
```

## 故障排除

- **连接错误**：检查主机名、端口、用户名和密码是否正确
- **权限问题**：确保数据库用户有足够的权限
- **字符集问题**：数据库使用utf8mb4字符集，确保客户端连接也使用相同字符集

## 安全建议

- 使用强密码
- 限制数据库用户权限
- 定期备份数据库
- 在生产环境中禁用root用户远程访问