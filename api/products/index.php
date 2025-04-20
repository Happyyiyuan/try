<?php
// 设置错误报告级别，防止直接输出错误（可能包含HTML）
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
// 可以指定错误日志文件路径
// ini_set('error_log', '/path/to/php-error.log');

// 立即设置响应头为JSON
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../../config/config.php';

try {
    // 获取数据库连接
    $db = getDBConnection();

    switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        // 获取产品列表或单个产品
        $productId = $_GET['id'] ?? null;
        
        if ($productId) {
            // 获取单个产品详情
            $stmt = $db->prepare('SELECT p.*, GROUP_CONCAT(ps.spec) as specs 
                                 FROM products p 
                                 LEFT JOIN product_specs ps ON p.id = ps.product_id 
                                 WHERE p.id = ? 
                                 GROUP BY p.id');
            $stmt->execute([$productId]);
            $product = $stmt->fetch();
            
            if (!$product) {
                errorResponse('产品不存在', 404);
            }
            
            // 将规格转换为数组
            $product['specs'] = $product['specs'] ? explode(',', $product['specs']) : [];
            
            jsonResponse($product);
        } else {
            // 获取产品列表
            $category = $_GET['category'] ?? null;
            $search = $_GET['search'] ?? null;
            $page = max(1, intval($_GET['page'] ?? 1));
            $limit = 10;
            $offset = ($page - 1) * $limit;
            
            $where = [];
            $params = [];
            
            if ($category) {
                $where[] = 'category = ?';
                $params[] = $category;
            }
            
            if ($search) {
                $where[] = 'MATCH(name, description) AGAINST(? IN BOOLEAN MODE)';
                $params[] = $search;
            }
            
            $whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';
            
            // 获取总数
            $countSql = "SELECT COUNT(*) FROM products $whereClause";
            $stmt = $db->prepare($countSql);
            $stmt->execute($params);
            $total = $stmt->fetchColumn();
            
            // 获取产品列表
            $sql = "SELECT * FROM products $whereClause LIMIT ? OFFSET ?";
            $stmt = $db->prepare($sql);
            array_push($params, $limit, $offset);
            $stmt->execute($params);
            $products = $stmt->fetchAll();
            
            jsonResponse([
                'products' => $products,
                'total' => $total,
                'page' => $page,
                'totalPages' => ceil($total / $limit)
            ]);
        }
        break;
        
    case 'POST':
        // 创建新产品
        $data = json_decode(file_get_contents('php://input'), true);
        
        // 验证必填字段
        if (empty($data['name']) || empty($data['category'])) {
            errorResponse('产品名称和类别为必填项');
        }
        
        try {
            $db->beginTransaction();
            
            // 插入产品基本信息
            $stmt = $db->prepare('INSERT INTO products (name, title, description, category, image, 
                                                     processor, camera, battery, material, model, 
                                                     interface, compatibility, cpu, ram, storage, 
                                                     display, batteryLife, noiseCancellation, 
                                                     waterResistant, connectivity, keyType, layout) 
                                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
            
            $stmt->execute([
                $data['name'],
                $data['title'] ?? null,
                $data['description'] ?? null,
                $data['category'],
                $data['image'] ?? null,
                $data['processor'] ?? null,
                $data['camera'] ?? null,
                $data['battery'] ?? null,
                $data['material'] ?? null,
                $data['model'] ?? null,
                $data['interface'] ?? null,
                $data['compatibility'] ?? null,
                $data['cpu'] ?? null,
                $data['ram'] ?? null,
                $data['storage'] ?? null,
                $data['display'] ?? null,
                $data['batteryLife'] ?? null,
                $data['noiseCancellation'] ?? false,
                $data['waterResistant'] ?? null,
                $data['connectivity'] ?? null,
                $data['keyType'] ?? null,
                $data['layout'] ?? null
            ]);
            
            $productId = $db->lastInsertId();
            
            // 插入产品规格
            if (!empty($data['specs'])) {
                $stmt = $db->prepare('INSERT INTO product_specs (product_id, spec) VALUES (?, ?)');
                foreach ($data['specs'] as $spec) {
                    $stmt->execute([$productId, $spec]);
                }
            }
            
            $db->commit();
            
            jsonResponse([
                'message' => '产品创建成功',
                'productId' => $productId
            ], 201);
        } catch (Exception $e) {
            $db->rollBack();
            errorResponse('产品创建失败: ' . $e->getMessage());
        }
        break;
        
    case 'PUT':
        // 更新产品
        $data = json_decode(file_get_contents('php://input'), true);
        $productId = $_GET['id'] ?? null;
        
        if (!$productId) {
            errorResponse('产品ID为必填项');
        }
        
        try {
            $db->beginTransaction();
            
            // 更新产品基本信息
            $updates = [];
            $params = [];
            
            $fields = [
                'name', 'title', 'description', 'category', 'image',
                'processor', 'camera', 'battery', 'material', 'model',
                'interface', 'compatibility', 'cpu', 'ram', 'storage',
                'display', 'batteryLife', 'noiseCancellation',
                'waterResistant', 'connectivity', 'keyType', 'layout'
            ];
            
            foreach ($fields as $field) {
                if (isset($data[$field])) {
                    $updates[] = "$field = ?";
                    $params[] = $data[$field];
                }
            }
            
            if ($updates) {
                $params[] = $productId;
                $sql = 'UPDATE products SET ' . implode(', ', $updates) . ' WHERE id = ?';
                $stmt = $db->prepare($sql);
                $stmt->execute($params);
            }
            
            // 更新产品规格
            if (isset($data['specs'])) {
                // 删除旧规格
                $stmt = $db->prepare('DELETE FROM product_specs WHERE product_id = ?');
                $stmt->execute([$productId]);
                
                // 插入新规格
                if (!empty($data['specs'])) {
                    $stmt = $db->prepare('INSERT INTO product_specs (product_id, spec) VALUES (?, ?)');
                    foreach ($data['specs'] as $spec) {
                        $stmt->execute([$productId, $spec]);
                    }
                }
            }
            
            $db->commit();
            
            jsonResponse([
                'message' => '产品更新成功'
            ]);
        } catch (Exception $e) {
            $db->rollBack();
            errorResponse('产品更新失败: ' . $e->getMessage());
        }
        break;
        
    case 'DELETE':
        // 删除产品
        $productId = $_GET['id'] ?? null;
        
        if (!$productId) {
            errorResponse('产品ID为必填项');
        }
        
        try {
            $db->beginTransaction();
            
            // 删除产品规格
            $stmt = $db->prepare('DELETE FROM product_specs WHERE product_id = ?');
            $stmt->execute([$productId]);
            
            // 删除产品
            $stmt = $db->prepare('DELETE FROM products WHERE id = ?');
            $stmt->execute([$productId]);
            
            if ($stmt->rowCount() === 0) {
                $db->rollBack();
                errorResponse('产品不存在', 404);
            }
            
            $db->commit();
            
            jsonResponse([
                'message' => '产品删除成功'
            ]);
        } catch (Exception $e) {
            $db->rollBack();
            errorResponse('产品删除失败: ' . $e->getMessage());
        }
        break;
        
    default:
            errorResponse('无效的请求方法', 405);
    }
} catch (PDOException $e) {
    // 数据库相关错误
    error_log('Database Error in products API: ' . $e->getMessage());
    errorResponse('数据库操作失败，请稍后重试', 500);
} catch (Exception $e) {
    // 其他所有未捕获的错误
    error_log('General Error in products API: ' . $e->getMessage());
    errorResponse('服务器内部错误: ' . $e->getMessage(), 500);
}