<?php
/**
 * 数据迁移脚本 - JSON数据导入到MySQL数据库
 * 作用: 将 products.json 和 submissions.json 中的数据导入到 MySQL 数据库
 * 使用方法: 在命令行运行 php database/migrate.php
 */

// 设置错误报告
error_reporting(E_ALL);
ini_set('display_errors', 1);

// 加载配置
require_once __DIR__ . '/../config/config.php';

// 获取数据库连接
$db = getDBConnection();

// 颜色代码
define('COLOR_GREEN', "\033[32m");
define('COLOR_YELLOW', "\033[33m");
define('COLOR_RED', "\033[31m");
define('COLOR_BLUE', "\033[34m");
define('COLOR_RESET', "\033[0m");

// 显示彩色消息
function printColored($message, $color) {
    echo $color . $message . COLOR_RESET . PHP_EOL;
}

// 显示标题
echo PHP_EOL;
printColored("=== AI科技库数据迁移脚本 ===", COLOR_BLUE);
echo PHP_EOL;

// 检查数据表是否存在
function tableExists($db, $tableName) {
    $stmt = $db->prepare("SHOW TABLES LIKE ?");
    $stmt->execute([$tableName]);
    return $stmt->rowCount() > 0;
}

// 检查数据库连接
try {
    $db->query("SELECT 1");
    printColored("✅ 数据库连接成功", COLOR_GREEN);
} catch (Exception $e) {
    printColored("❌ 数据库连接失败: " . $e->getMessage(), COLOR_RED);
    exit(1);
}

// 检查数据表
$tables = ['products', 'product_specs', 'submissions', 'submission_tags', 'users'];
$allTablesExist = true;

foreach ($tables as $table) {
    if (tableExists($db, $table)) {
        printColored("✅ 数据表 {$table} 已存在", COLOR_GREEN);
    } else {
        printColored("❌ 数据表 {$table} 不存在", COLOR_RED);
        $allTablesExist = false;
    }
}

if (!$allTablesExist) {
    printColored("⚠️ 部分数据表不存在，请先运行数据库初始化脚本 setup.sql", COLOR_YELLOW);
    $confirm = readline("是否继续执行数据迁移? (y/n): ");
    if (strtolower($confirm) !== 'y') {
        printColored("已取消数据迁移", COLOR_YELLOW);
        exit(0);
    }
}

// 开始数据迁移
printColored("开始数据迁移...", COLOR_BLUE);

// 1. 迁移 products.json
try {
    // 检查JSON文件是否存在
    $productsFile = __DIR__ . '/../products.json';
    if (!file_exists($productsFile)) {
        printColored("❌ 文件不存在: {$productsFile}", COLOR_RED);
    } else {
        $products = json_decode(file_get_contents($productsFile), true);
        if (!$products) {
            printColored("❌ 无法解析 products.json", COLOR_RED);
        } else {
            printColored("📊 从 products.json 中读取了 " . count($products) . " 个产品", COLOR_BLUE);
            
            // 开始事务
            $db->beginTransaction();
            
            $productsAdded = 0;
            $specsAdded = 0;
            
            foreach ($products as $product) {
                // 先检查产品是否已存在 (根据ID或名称)
                $stmt = $db->prepare("SELECT id FROM products WHERE name = ?");
                $stmt->execute([$product['name']]);
                $existingProduct = $stmt->fetch();
                
                if ($existingProduct) {
                    printColored("⚠️ 产品 '{$product['name']}' 已存在，跳过", COLOR_YELLOW);
                    continue;
                }
                
                // 准备产品字段
                $fields = [
                    'name', 'title', 'description', 'category', 'image',
                    'processor', 'camera', 'battery', 'material', 'model',
                    'interface', 'compatibility', 'cpu', 'ram', 'storage',
                    'display', 'batteryLife', 'noiseCancellation',
                    'waterResistant', 'connectivity', 'keyType', 'layout'
                ];
                
                // 构建SQL语句
                $columns = [];
                $placeholders = [];
                $values = [];
                
                foreach ($fields as $field) {
                    if (isset($product[$field])) {
                        $columns[] = $field;
                        $placeholders[] = '?';
                        $values[] = $product[$field];
                    }
                }
                
                if (empty($columns)) {
                    printColored("⚠️ 产品 '{$product['name']}' 没有有效字段，跳过", COLOR_YELLOW);
                    continue;
                }
                
                $sql = "INSERT INTO products (" . implode(', ', $columns) . ") VALUES (" . implode(', ', $placeholders) . ")";
                $stmt = $db->prepare($sql);
                $stmt->execute($values);
                
                $productId = $db->lastInsertId();
                $productsAdded++;
                
                // 处理规格
                if (isset($product['specs']) && is_array($product['specs'])) {
                    foreach ($product['specs'] as $spec) {
                        $stmt = $db->prepare("INSERT INTO product_specs (product_id, spec) VALUES (?, ?)");
                        $stmt->execute([$productId, $spec]);
                        $specsAdded++;
                    }
                }
            }
            
            // 提交事务
            $db->commit();
            
            printColored("✅ 产品数据迁移完成: 添加了 {$productsAdded} 个产品和 {$specsAdded} 个规格", COLOR_GREEN);
        }
    }
} catch (Exception $e) {
    $db->rollBack();
    printColored("❌ 产品数据迁移失败: " . $e->getMessage(), COLOR_RED);
}

// 2. 迁移 submissions.json
try {
    // 检查JSON文件是否存在
    $submissionsFile = __DIR__ . '/../submissions.json';
    if (!file_exists($submissionsFile)) {
        printColored("❌ 文件不存在: {$submissionsFile}", COLOR_RED);
    } else {
        $submissions = json_decode(file_get_contents($submissionsFile), true);
        if (!$submissions) {
            printColored("❌ 无法解析 submissions.json", COLOR_RED);
        } else {
            printColored("📊 从 submissions.json 中读取了 " . count($submissions) . " 个提交", COLOR_BLUE);
            
            // 开始事务
            $db->beginTransaction();
            
            $submissionsAdded = 0;
            $tagsAdded = 0;
            
            foreach ($submissions as $submission) {
                // 先检查提交是否已存在
                $existingStmt = $db->prepare("SELECT id FROM submissions WHERE title = ? AND content = ?");
                $existingStmt->execute([$submission['title'], $submission['content']]);
                if ($existingStmt->fetch()) {
                    printColored("⚠️ 提交 '{$submission['title']}' 已存在，跳过", COLOR_YELLOW);
                    continue;
                }
                
                // 准备提交字段
                $fields = ['title', 'content', 'category', 'image', 'status', 'date'];
                
                // 构建SQL语句
                $columns = [];
                $placeholders = [];
                $values = [];
                
                foreach ($fields as $field) {
                    if (isset($submission[$field])) {
                        $columns[] = $field;
                        $placeholders[] = '?';
                        $values[] = $submission[$field];
                    }
                }
                
                if (empty($columns)) {
                    printColored("⚠️ 提交 '{$submission['title']}' 没有有效字段，跳过", COLOR_YELLOW);
                    continue;
                }
                
                $sql = "INSERT INTO submissions (" . implode(', ', $columns) . ") VALUES (" . implode(', ', $placeholders) . ")";
                $stmt = $db->prepare($sql);
                $stmt->execute($values);
                
                $submissionId = $db->lastInsertId();
                $submissionsAdded++;
                
                // 处理标签
                if (isset($submission['tags']) && is_array($submission['tags'])) {
                    foreach ($submission['tags'] as $tag) {
                        $stmt = $db->prepare("INSERT INTO submission_tags (submission_id, tag) VALUES (?, ?)");
                        $stmt->execute([$submissionId, $tag]);
                        $tagsAdded++;
                    }
                }
            }
            
            // 提交事务
            $db->commit();
            
            printColored("✅ 提交数据迁移完成: 添加了 {$submissionsAdded} 个提交和 {$tagsAdded} 个标签", COLOR_GREEN);
        }
    }
} catch (Exception $e) {
    $db->rollBack();
    printColored("❌ 提交数据迁移失败: " . $e->getMessage(), COLOR_RED);
}

// 完成
echo PHP_EOL;
printColored("数据迁移完成!", COLOR_GREEN);
echo PHP_EOL; 