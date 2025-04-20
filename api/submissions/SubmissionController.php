<?php

require_once __DIR__ . '/../../utils/Database.php';
require_once __DIR__ . '/../../utils/jwt.php';

class SubmissionController {
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

    public function createSubmission() {
        $user = $this->verifyToken();
        if (!$user) {
            http_response_code(401);
            echo json_encode(['error' => '未授权']);
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['title']) || !isset($data['content']) || !isset($data['category'])) {
            http_response_code(400);
            echo json_encode(['error' => '请提供完整的提交信息']);
            return;
        }

        $submissionId = $this->db->insert('submissions', [
            'title' => $data['title'],
            'content' => $data['content'],
            'category' => $data['category'],
            'user_id' => $user['user_id'],
            'status' => 'pending',
            'created_at' => date('Y-m-d H:i:s')
        ]);

        $submission = $this->db->fetch(
            'SELECT * FROM submissions WHERE id = ?',
            [$submissionId]
        );

        echo json_encode($submission);
    }

    public function getSubmissions() {
        $user = $this->verifyToken();
        if (!$user) {
            http_response_code(401);
            echo json_encode(['error' => '未授权']);
            return;
        }

        $status = isset($_GET['status']) ? $_GET['status'] : null;
        $category = isset($_GET['category']) ? $_GET['category'] : null;

        $sql = 'SELECT s.*, u.username FROM submissions s '
             . 'JOIN users u ON s.user_id = u.id WHERE 1=1';
        $params = [];

        if ($status) {
            $sql .= ' AND s.status = ?';
            $params[] = $status;
        }

        if ($category) {
            $sql .= ' AND s.category = ?';
            $params[] = $category;
        }

        $submissions = $this->db->fetchAll($sql, $params);
        echo json_encode(['submissions' => $submissions]);
    }

    public function getSubmission($id) {
        $user = $this->verifyToken();
        if (!$user) {
            http_response_code(401);
            echo json_encode(['error' => '未授权']);
            return;
        }

        $submission = $this->db->fetch(
            'SELECT s.*, u.username FROM submissions s '
            . 'JOIN users u ON s.user_id = u.id WHERE s.id = ?',
            [$id]
        );

        if (!$submission) {
            http_response_code(404);
            echo json_encode(['error' => '提交内容不存在']);
            return;
        }

        echo json_encode($submission);
    }

    public function updateSubmission($id) {
        $user = $this->verifyToken();
        if (!$user) {
            http_response_code(401);
            echo json_encode(['error' => '未授权']);
            return;
        }

        $submission = $this->db->fetch(
            'SELECT * FROM submissions WHERE id = ?',
            [$id]
        );

        if (!$submission) {
            http_response_code(404);
            echo json_encode(['error' => '提交内容不存在']);
            return;
        }

        if ($submission['user_id'] !== $user['user_id']) {
            http_response_code(403);
            echo json_encode(['error' => '无权修改此提交']);
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);
        
        $updateData = [];
        if (isset($data['title'])) $updateData['title'] = $data['title'];
        if (isset($data['content'])) $updateData['content'] = $data['content'];
        if (isset($data['category'])) $updateData['category'] = $data['category'];
        $updateData['updated_at'] = date('Y-m-d H:i:s');

        $this->db->update(
            'submissions',
            $updateData,
            'id = ?',
            [$id]
        );

        $updatedSubmission = $this->db->fetch(
            'SELECT s.*, u.username FROM submissions s '
            . 'JOIN users u ON s.user_id = u.id WHERE s.id = ?',
            [$id]
        );

        echo json_encode($updatedSubmission);
    }

    public function deleteSubmission($id) {
        $user = $this->verifyToken();
        if (!$user) {
            http_response_code(401);
            echo json_encode(['error' => '未授权']);
            return;
        }

        $submission = $this->db->fetch(
            'SELECT * FROM submissions WHERE id = ?',
            [$id]
        );

        if (!$submission) {
            http_response_code(404);
            echo json_encode(['error' => '提交内容不存在']);
            return;
        }

        if ($submission['user_id'] !== $user['user_id']) {
            http_response_code(403);
            echo json_encode(['error' => '无权删除此提交']);
            return;
        }

        $this->db->delete('submissions', 'id = ?', [$id]);
        echo json_encode(['message' => '提交内容已删除']);
    }
}

// 处理请求
$controller = new SubmissionController();
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

header('Content-Type: application/json');

// 提取URL中的ID参数
preg_match('/\/api\/submissions\/?([0-9]*)/i', $path, $matches);
$id = isset($matches[1]) ? $matches[1] : null;

switch ($method) {
    case 'GET':
        if ($id) {
            $controller->getSubmission($id);
        } else {
            $controller->getSubmissions();
        }
        break;

    case 'POST':
        if (!$id) {
            $controller->createSubmission();
        }
        break;

    case 'PUT':
        if ($id) {
            $controller->updateSubmission($id);
        }
        break;

    case 'DELETE':
        if ($id) {
            $controller->deleteSubmission($id);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => '不支持的请求方法']);
}