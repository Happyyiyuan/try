<?php

require_once __DIR__ . '/../../utils/Database.php';
require_once __DIR__ . '/../../utils/jwt.php';
require_once __DIR__ . '/../../utils/response_helpers.php';

class SubmissionController
{
    private Database $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    private function verifyToken(): ?array {
        if (!isset($headers['Authorization'])) {
            return false;
        }

        $token = str_replace('Bearer ', '', $headers['Authorization']);
        try {
            $payload = verifyJWT($token);
            return $payload;
        } catch (Exception $e) {
            return null;
        }
    }

    public function createSubmission(): void
    {
        $user = $this->verifyToken();
        if (!$user) {
            sendUnauthorizedResponse();
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['title']) || !isset($data['content']) || !isset($data['category'])) {
            sendBadRequestResponse('请提供完整的提交信息');
            return;
        }

        $submissionId = $this->db->insert(
            'submissions',
            [
                'title' => $data['title'],
                'content' => $data['content'],
                'category' => $data['category'],
                'user_id' => $user['user_id'],
                'status' => 'pending',
                'created_at' => date('Y-m-d H:i:s')
            ]
        );

        $submission = $this->getSubmissionById($submissionId);
        sendJsonResponse($submission, 201);
    }

    private function getSubmissionById(int $id): ?array
    {
        return $this->db->fetch(
            'SELECT s.*, u.username FROM submissions s JOIN users u ON s.user_id = u.id WHERE s.id = ?',
            [$id]
        );
    }

    public function getSubmissions(): void
    {
        $user = $this->verifyToken();
        if (!$user) {
            sendUnauthorizedResponse();
            return;
        }

        $status = $_GET['status'] ?? null;
        $category = $_GET['category'] ?? null;

        $sql = 'SELECT s.*, u.username FROM submissions s JOIN users u ON s.user_id = u.id WHERE 1=1';
        $params = [];

        if ($status) {
            $sql .= ' AND s.status = ?';
            $params[] = htmlspecialchars($status);
        }

        if ($category) {
            $sql .= ' AND s.category = ?';
            $params[] = htmlspecialchars($category);
        }

        $submissions = $this->db->fetchAll($sql, $params);
        sendJsonResponse(['submissions' => $submissions]);
    }

    public function getSubmission(int $id): void
    {
        $user = $this->verifyToken();
        if (!$user) {
            sendUnauthorizedResponse();
            return;
        }

        $submission = $this->getSubmissionById($id);

        if (!$submission) {
            sendNotFoundResponse('提交内容不存在');
            return;
        }

        sendJsonResponse($submission);
    }

    public function updateSubmission(int $id): void
    {
        $user = $this->verifyToken();
        if (!$user) {
            sendUnauthorizedResponse();
            return;
        }

        $submission = $this->getSubmissionById($id);

        if (!$submission) {
            sendNotFoundResponse('提交内容不存在');
            return;
        }

        if ($submission['user_id'] !== $user['user_id']) {
            sendForbiddenResponse('无权修改此提交');
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        $updateData = [];
        if (isset($data['title'])) {
            $updateData['title'] = htmlspecialchars($data['title']);
        }
        if (isset($data['content'])) {
            $updateData['content'] = htmlspecialchars($data['content']);
        }
        if (isset($data['category'])) {
            $updateData['category'] = htmlspecialchars($data['category']);
        }
        $updateData['updated_at'] = date('Y-m-d H:i:s');

        if (!empty($updateData)) {
            $this->db->update(
                'submissions',
                $updateData,
                'id = ?',
                [$id]
            );
        }

        $updatedSubmission = $this->getSubmissionById($id);
        sendJsonResponse($updatedSubmission);
    }

    public function deleteSubmission(int $id): void
    {
        $user = $this->verifyToken();
        if (!$user) {
            sendUnauthorizedResponse();
            return;
        }

        $submission = $this->getSubmissionById($id);

        if (!$submission) {
            sendNotFoundResponse('提交内容不存在');
            return;
        }

        if ($submission['user_id'] !== $user['user_id']) {
            sendForbiddenResponse('无权删除此提交');
            return;
        }

        $this->db->delete('submissions', 'id = ?', [$id]);
        sendJsonResponse(['message' => '提交内容已删除']);
    }
}

// 处理请求
$controller = new SubmissionController();
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// 提取URL中的ID参数
preg_match('/\/api\/submissions\/?([0-9]*)/i', $path, $matches);
$id = $matches[1] ?? null;

switch ($method) {
    case 'GET':
        if ($id) {
            $controller->getSubmission((int)$id);
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
            $controller->updateSubmission((int)$id);
        }
        break;
    case 'DELETE':
        if ($id) {
            $controller->deleteSubmission((int)$id);
        }
        break;
    default:
        sendMethodNotAllowedResponse();
}