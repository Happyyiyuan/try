-- AI科技库 MySQL数据库设置脚本

-- 创建数据库
CREATE DATABASE IF NOT EXISTS techvault_club CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 使用数据库
USE techvault_club;

-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(100) NOT NULL,
  avatar VARCHAR(255) DEFAULT 'https://randomuser.me/api/portraits/men/32.jpg',
  role ENUM('user', 'admin') DEFAULT 'user',
  bio TEXT,
  resetPasswordToken VARCHAR(100),
  resetPasswordExpire DATETIME,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_username (username),
  INDEX idx_email (email),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建产品表
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  title VARCHAR(100),
  description TEXT,
  category VARCHAR(50) NOT NULL,
  image VARCHAR(255),
  processor VARCHAR(50),
  camera VARCHAR(100),
  battery VARCHAR(50),
  material VARCHAR(50),
  model VARCHAR(50),
  interface VARCHAR(50),
  compatibility VARCHAR(100),
  cpu VARCHAR(50),
  ram VARCHAR(50),
  storage VARCHAR(50),
  display VARCHAR(100),
  batteryLife VARCHAR(50),
  noiseCancellation BOOLEAN,
  waterResistant VARCHAR(50),
  connectivity VARCHAR(50),
  keyType VARCHAR(50),
  layout VARCHAR(50),
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category (category),
  INDEX idx_name (name),
  FULLTEXT INDEX ft_product (name, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建产品规格表 (用于存储产品的多个规格)
CREATE TABLE IF NOT EXISTS product_specs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  spec VARCHAR(100) NOT NULL,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建提交内容表
CREATE TABLE IF NOT EXISTS submissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(50),
  image VARCHAR(255),
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  views INT DEFAULT 0,
  user_id INT,
  date DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_category (category),
  INDEX idx_status (status),
  INDEX idx_user_id (user_id),
  FULLTEXT INDEX ft_submission (title, content)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建提交内容标签表
CREATE TABLE IF NOT EXISTS submission_tags (
  id INT AUTO_INCREMENT PRIMARY KEY,
  submission_id INT NOT NULL,
  tag VARCHAR(50) NOT NULL,
  FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
  INDEX idx_submission_id (submission_id),
  INDEX idx_tag (tag)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建评论表
CREATE TABLE IF NOT EXISTS comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  content TEXT NOT NULL,
  user_id INT,
  submission_id INT,
  product_id INT,
  parent_id INT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_submission_id (submission_id),
  INDEX idx_product_id (product_id),
  INDEX idx_parent_id (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建用户点赞表
CREATE TABLE IF NOT EXISTS user_likes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  submission_id INT,
  product_id INT,
  comment_id INT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_submission_like (user_id, submission_id),
  UNIQUE KEY unique_user_product_like (user_id, product_id),
  UNIQUE KEY unique_user_comment_like (user_id, comment_id),
  INDEX idx_user_id (user_id),
  INDEX idx_submission_id (submission_id),
  INDEX idx_product_id (product_id),
  INDEX idx_comment_id (comment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建用户收藏表
CREATE TABLE IF NOT EXISTS user_favorites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  submission_id INT,
  product_id INT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_submission_favorite (user_id, submission_id),
  UNIQUE KEY unique_user_product_favorite (user_id, product_id),
  INDEX idx_user_id (user_id),
  INDEX idx_submission_id (submission_id),
  INDEX idx_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建用户关注表
CREATE TABLE IF NOT EXISTS user_follows (
  id INT AUTO_INCREMENT PRIMARY KEY,
  follower_id INT NOT NULL,
  following_id INT NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_follow (follower_id, following_id),
  INDEX idx_follower_id (follower_id),
  INDEX idx_following_id (following_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建通知表
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  sender_id INT,
  type ENUM('like', 'comment', 'follow', 'system', 'mention') NOT NULL,
  content TEXT,
  submission_id INT,
  product_id INT,
  comment_id INT,
  is_read BOOLEAN DEFAULT FALSE,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_is_read (is_read),
  INDEX idx_created_at (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建默认管理员用户
INSERT INTO users (username, email, password, role, avatar)
VALUES ('admin', 'admin@example.com', SHA2('admin123', 256), 'admin', 'https://randomuser.me/api/portraits/men/1.jpg')
ON DUPLICATE KEY UPDATE role = 'admin';

-- 创建数据库用户并授权
-- CREATE USER IF NOT EXISTS 'ai_tech_user'@'localhost' IDENTIFIED BY 'ai_tech_password';
-- GRANT ALL PRIVILEGES ON ai_tech_library.* TO 'ai_tech_user'@'localhost';
-- FLUSH PRIVILEGES;

-- 注意：在实际部署时，请修改上面的用户名和密码为更安全的值
-- 并根据需要取消注释上述创建用户和授权的语句