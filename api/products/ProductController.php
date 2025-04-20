<?php

require_once __DIR__ . '/../../config/config.php'; // Include config for response functions
require_once __DIR__ . '/../../utils/Database.php';
require_once __DIR__ . '/../../utils/jwt.php';

class ProductController {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    private function verifyToken() {
        $headers = getallheaders();
        if (!isset($headers['Authorization'])) {
            return false;
        }

        $token = str_replace('Bearer ', '', $headers['Authorization']);
        try {
            $payload = verifyJWT($token);
            return $payload;
        } catch (Exception $e) {
            return false;
        }
    }

    public function getProducts() {
        $category = isset($_GET['category']) ? $_GET['category'] : null;
        $search = isset($_GET['search']) ? $_GET['search'] : null;

        $sql = 'SELECT * FROM products WHERE 1=1';
        $params = [];

        if ($category) {
            $sql .= ' AND category = ?';
            $params[] = $category;
        }

        if ($search) {
            $sql .= ' AND (name LIKE ? OR description LIKE ?)';
            $searchTerm = "%$search%";
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }

        $products = $this->db->fetchAll($sql, $params);
        jsonResponse(['products' => $products]); // Use jsonResponse
    }

    public function getProduct($id) {
        $product = $this->db->fetch(
            'SELECT * FROM products WHERE id = ?',
            [$id]
        );

        if (!$product) {
            errorResponse('产品不存在', 404); // Use errorResponse
            return; // errorResponse already exits, but return keeps structure clear
        }

        jsonResponse($product); // Use jsonResponse
    }

    public function createProduct() {
        $user = $this->verifyToken();
        if (!$user) {
            errorResponse('未授权', 401); // Use errorResponse
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['name']) || !isset($data['description']) || !isset($data['category'])) {
            errorResponse('请提供完整的产品信息', 400); // Use errorResponse
            return;
        }

        $productId = $this->db->insert('products', [
            'name' => $data['name'],
            'description' => $data['description'],
            'category' => $data['category'],
            'image_url' => $data['image_url'] ?? null,
            'created_by' => $user['user_id'],
            'created_at' => date('Y-m-d H:i:s')
        ]);

        $product = $this->db->fetch(
            'SELECT * FROM products WHERE id = ?',
            [$productId]
        );

        jsonResponse($product, 201); // Use jsonResponse with 201 status
    }

    public function updateProduct($id) {
        $user = $this->verifyToken();
        if (!$user) {
            errorResponse('未授权', 401); // Use errorResponse
            return;
        }

        $product = $this->db->fetch(
            'SELECT * FROM products WHERE id = ?',
            [$id]
        );

        if (!$product) {
            errorResponse('产品不存在', 404); // Use errorResponse
            return;
        }

        if ($product['created_by'] !== $user['user_id']) {
            errorResponse('无权修改此产品', 403); // Use errorResponse
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);
        
        $updateData = [];
        if (isset($data['name'])) $updateData['name'] = $data['name'];
        if (isset($data['description'])) $updateData['description'] = $data['description'];
        if (isset($data['category'])) $updateData['category'] = $data['category'];
        if (isset($data['image_url'])) $updateData['image_url'] = $data['image_url'];
        $updateData['updated_at'] = date('Y-m-d H:i:s');

        $this->db->update(
            'products',
            $updateData,
            'id = ?',
            [$id]
        );

        $updatedProduct = $this->db->fetch(
            'SELECT * FROM products WHERE id = ?',
            [$id]
        );

        jsonResponse($updatedProduct); // Use jsonResponse
    }

    public function deleteProduct($id) {
        $user = $this->verifyToken();
        if (!$user) {
            errorResponse('未授权', 401); // Use errorResponse
            return;
        }

        $product = $this->db->fetch(
            'SELECT * FROM products WHERE id = ?',
            [$id]
        );

        if (!$product) {
            errorResponse('产品不存在', 404); // Use errorResponse
            return;
        }

        if ($product['created_by'] !== $user['user_id']) {
            errorResponse('无权删除此产品', 403); // Use errorResponse
            return;
        }

        $this->db->delete('products', 'id = ?', [$id]);
        jsonResponse(['message' => '产品已删除']); // Use jsonResponse
    }
}

// 处理请求
$controller = new ProductController();
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// header('Content-Type: application/json'); // Moved to index.php or handled by jsonResponse

// 提取URL中的ID参数
preg_match('/\/api\/products\/?([0-9]*)/i', $path, $matches);
$id = isset($matches[1]) && $matches[1] !== '' ? $matches[1] : null;

switch ($method) {
    case 'GET':
        if ($id !== null) {
            $controller->getProduct($id);
        } else {
            $controller->getProducts();
        }
        break;

    case 'POST':
        if ($id === null) {
            $controller->createProduct();
        } else {
            errorResponse('POST方法不支持指定ID', 405);
        }
        break;

    case 'PUT':
        if ($id !== null) {
            $controller->updateProduct($id);
        } else {
            errorResponse('PUT方法需要指定产品ID', 400);
        }
        break;

    case 'DELETE':
        if ($id !== null) {
            $controller->deleteProduct($id);
        } else {
            errorResponse('DELETE方法需要指定产品ID', 400);
        }
        break;

    default:
        errorResponse('不支持的请求方法', 405);
}