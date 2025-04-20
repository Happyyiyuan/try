# AI科技库部署指南

本文档提供将AI科技库平台部署到生产环境的详细步骤。

## 系统要求

- **Web服务器**: Nginx 1.18+
- **PHP版本**: 8.0+
- **数据库**: MySQL 8.0+ / MariaDB 10.3+
- **SSL证书**: 有效的SSL证书 (推荐使用Let's Encrypt)
- **内存**: 最低4GB RAM
- **存储**: 至少20GB可用空间
- **操作系统**: Ubuntu 20.04+ 或 CentOS 8+

## 宝塔面板部署方式

如果您使用宝塔面板，可以通过以下步骤快速部署项目：

### 1. 创建网站

1. 登录宝塔面板管理界面
2. 点击左侧菜单"网站"，然后点击"添加站点"
3. 填写以下信息：
   - 域名：`techvault.club`（可选添加www子域名）
   - 数据库：创建新的MySQL数据库
   - PHP版本：选择PHP 7.4或更高版本
   - 启用SSL：可以选择"Let's Encrypt"自动申请证书

### 2. 上传网站文件

1. 在宝塔面板左侧菜单点击"文件"
2. 导航到网站根目录（通常是`/www/wwwroot/techvault.club/`）
3. 点击"上传"按钮，上传项目文件
4. 或者通过SSH登录服务器，执行以下命令：

```bash
cd /www/wwwroot/techvault.club/
git clone https://your-repository-url.git .
chmod -R 755 .
chown -R www:www .
```

### 3. 配置网站

1. 在宝塔面板"网站"菜单中，找到techvault.club站点，点击"设置"
2. 进入"网站目录"，确保目录权限正确
3. 进入"伪静态"，选择"laravel"或自定义配置：

```
location / {
    try_files $uri $uri/ /index.php?$query_string;
}
```

4. 在"配置文件"中，可以直接粘贴我们提供的`nginx.conf`内容（需做适当修改）

### 4. 配置数据库

1. 在宝塔面板左侧菜单点击"数据库"
2. 找到为项目创建的数据库，点击"导入"
3. 上传项目的SQL文件并导入
4. 或者使用项目内的迁移脚本：

```bash
cd /www/wwwroot/techvault.club/
php database/migrate.php
```

### 5. 配置环境

1. 编辑配置文件，更新数据库连接信息：

```bash
nano /www/wwwroot/techvault.club/config/config.php
```

2. 修改数据库配置部分：

```php
// 数据库配置
define('DB_HOST', 'localhost');
define('DB_NAME', 'techvault_club'); // 在宝塔创建的数据库名
define('DB_USER', 'techvault_club'); // 数据库用户名
define('DB_PASS', 'your_password');  // 数据库密码
define('DB_CHARSET', 'utf8mb4');
```

## 标准部署步骤

如果不使用宝塔面板，可以按照以下标准步骤部署：

### 1. 服务器准备

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y  # Ubuntu
# 或
sudo dnf update -y  # CentOS

# 安装必要工具
sudo apt install -y curl git wget unzip  # Ubuntu
# 或
sudo dnf install -y curl git wget unzip  # CentOS
```

### 2. 安装Web服务器

```bash
# 安装Nginx
sudo apt install -y nginx  # Ubuntu
# 或
sudo dnf install -y nginx  # CentOS

# 启动Nginx并设置开机自启
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 3. 安装PHP及扩展

```bash
# Ubuntu
sudo apt install -y php8.1-fpm php8.1-cli php8.1-common php8.1-mysql php8.1-zip \
php8.1-gd php8.1-mbstring php8.1-curl php8.1-xml php8.1-bcmath php8.1-intl

# CentOS
sudo dnf install -y php php-fpm php-cli php-common php-mysqlnd php-zip \
php-gd php-mbstring php-curl php-xml php-bcmath php-intl

# 启动PHP-FPM并设置开机自启
sudo systemctl start php8.1-fpm  # Ubuntu
sudo systemctl enable php8.1-fpm

# 或
sudo systemctl start php-fpm  # CentOS
sudo systemctl enable php-fpm
```

### 4. 配置数据库

```bash
# 安装MySQL
sudo apt install -y mysql-server  # Ubuntu
# 或
sudo dnf install -y mariadb-server  # CentOS

# 启动MySQL并设置开机自启
sudo systemctl start mysql  # Ubuntu
sudo systemctl enable mysql
# 或
sudo systemctl start mariadb  # CentOS
sudo systemctl enable mariadb

# 运行安全配置脚本
sudo mysql_secure_installation
```

创建数据库和用户:

```sql
CREATE DATABASE techvault_club;
CREATE USER 'techvault_club'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON techvault_club.* TO 'techvault_club'@'localhost';
FLUSH PRIVILEGES;
```

### 5. 配置SSL证书

```bash
# 安装Certbot (Let's Encrypt客户端)
sudo apt install -y certbot python3-certbot-nginx  # Ubuntu
# 或
sudo dnf install -y certbot python3-certbot-nginx  # CentOS

# 获取SSL证书
sudo certbot --nginx -d techvault.club -d www.techvault.club
```

### 6. 部署应用程序

```bash
# 创建应用目录
sudo mkdir -p /var/www/techvault.club

# 设置目录权限
sudo chown -R www-data:www-data /var/www/techvault.club  # Ubuntu
# 或
sudo chown -R nginx:nginx /var/www/techvault.club  # CentOS

# 克隆代码仓库
git clone https://your-repository-url.git /tmp/aitech
sudo cp -R /tmp/aitech/* /var/www/techvault.club/
```

### 7. 配置Nginx

将`deploy/nginx.conf`文件复制到Nginx配置目录：

```bash
sudo cp /var/www/techvault.club/deploy/nginx.conf /etc/nginx/sites-available/techvault.club.conf  # Ubuntu
# 或
sudo cp /var/www/techvault.club/deploy/nginx.conf /etc/nginx/conf.d/techvault.club.conf  # CentOS

# Ubuntu需要创建符号链接
sudo ln -s /etc/nginx/sites-available/techvault.club.conf /etc/nginx/sites-enabled/

# 测试Nginx配置
sudo nginx -t

# 重启Nginx
sudo systemctl restart nginx
```

### 8. 应用程序配置

复制环境配置文件并修改：

```bash
cp /var/www/techvault.club/.env.example /var/www/techvault.club/.env
nano /var/www/techvault.club/.env
```

配置数据库连接信息和其他设置。

### 9. 初始化数据库

运行数据库迁移脚本：

```bash
php /var/www/techvault.club/database/migrate.php
```

## 安全建议

1. **定期更新系统**
2. **配置防火墙**，只开放必要端口
3. **设置自动SSL证书更新**
4. **正确设置文件权限**
5. **定期备份数据库和网站文件**
6. **配置WAF**（Web应用防火墙）增强安全性
7. **启用HTTPS**并配置HSTS头

## 监控与维护

定期检查日志文件，关注服务器性能，并确保备份系统正常运行。

如需技术支持，请联系：
- 邮箱: support@techvault.club
- 技术支持热线: +86-XXX-XXXX-XXXX 