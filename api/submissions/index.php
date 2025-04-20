<?php
require_once __DIR__ . '/../../config/config.php';

// 获取数据库连接
$db = getDBConnection();

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        // 获取提交内容列表或单个提交内容
        $submissionId = $_GET['id'] ?? null;
        
        if ($submissionId) {
            // 获取单个提交内容详情
            $stmt = $db->prepare('SELECT s.*, GROUP_CONCAT(st.tag) as tags, u.username 
                                 FROM submissions s 
                                 LEFT JOIN submission_tags st ON s.id = st.submission_id 
                                 LEFT JOIN users u ON s.user_id = u.id 
                                 WHERE s.id = ? 
                                 GROUP BY s.id');
            $stmt->execute([$submissionId]);
            $submission = $stmt->fetch();
            
            if (!$submission) {
                errorResponse('提交内容不存在', 404);
            }
            
            // 将标签转换为数组
            $submission['tags'] = $submission['tags'] ? explode(',', $submission['tags']) : [];
            
            // 更新浏览量
            $stmt = $db->prepare('UPDATE submissions SET views = views + 1 WHERE id = ?');
            $stmt->execute([$submissionId]);
            
            jsonResponse($submission);
        } else {
            // 获取提交内容列表
            $category = $_GET['category'] ?? null;
            $status = $_GET['status'] ?? null;
            $userId = $_GET['userId'] ?? null;
            $search = $_GET['search'] ?? null;
            $page = max(1, intval($_GET['page'] ?? 1));
            $limit = 10;
            $offset = ($page - 1) * $limit;
            
            $where = [];
            $params = [];
            
            if ($category) {
                $where[] = 's.category = ?';
                $params[] = $category;
            }
            
            if ($status) {
                $where[] = 's.status = ?';
                $params[] = $status;
            }
            
            if ($userId) {
                $where[] = 's.user_id = ?';
                $params[] = $userId;
            }
            
            if ($search) {
                $where[] = 'MATCH(s.title, s.content) AGAINST(? IN BOOLEAN MODE)';
                $params[] = $search;
            }
            
            $whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';
            
            // 获取总数
            $countSql = "SELECT COUNT(*) FROM submissions s $whereClause";
            $stmt = $db->prepare($countSql);
            $stmt->execute($params);
            $total = $stmt->fetchColumn();
            
            // 获取提交内容列表
            $sql = "SELECT s.*, GROUP_CONCAT(st.tag) as tags, u.username 
                    FROM submissions s 
                    LEFT JOIN submission_tags st ON s.id = st.submission_id 
                    LEFT JOIN users u ON s.user_id = u.id 
                    $whereClause 
                    GROUP BY s.id 
                    ORDER BY s.date DESC 
                    LIMIT ? OFFSET ?";
            $stmt = $db->prepare($sql);
            array_push($params, $limit, $offset);
            $stmt->execute($params);
            $submissions = $stmt->fetchAll();
            
            // 处理标签
            foreach ($submissions as &$submission) {
                $submission['tags'] = $submission['tags'] ? explode(',', $submission['tags']) : [];
            }
            
            jsonResponse([
                'submissions' => $submissions,
                'total' => $total,
                'page' => $page,
                'totalPages' => ceil($total / $limit)
            ]);
        }
        break;
        
    case 'POST':
        // 创建新提交内容
        $data = json_decode(file_get_contents('php://input'), true);
        
        // 验证必填字段
        if (empty($data['title']) || empty($data['content'])) {
            errorResponse('标题和内容为必填项');
        }
        
        try {
            $db->beginTransaction();
            
            // 插入提交内容
            $stmt = $db->prepare('INSERT INTO submissions (title, content, category, image, user_id, status) 
                                 VALUES (?, ?, ?, ?, ?, ?)');
            
            $stmt->execute([
                $data['title'],
                $data['content'],
                $data['category'] ?? null,
                $data['image'] ?? null,
                $data['user_id'] ?? null,
                'pending'
            ]);
            
            $submissionId = $db->lastInsertId();
            
            // 插入标签
            if (!empty($data['tags'])) {
                $stmt = $db->prepare('INSERT INTO submission_tags (submission_id, tag) VALUES (?, ?)');
                foreach ($data['tags'] as $tag) {
                    $stmt->execute([$submissionId, $tag]);
                }
            }
            
            $db->commit();
            
            jsonResponse([
                'message' => '内容提交成功',
                'submissionId' => $submissionId
            ], 201);
        } catch (Exception $e) {
            $db->rollBack();
            errorResponse('内容提交失败: ' . $e->getMessage());
        }
        break;
        
    case 'PUT':
        // 更新提交内容
        $data = json_decode(file_get_contents('php://input'), true);
        $submissionId = $_GET['id'] ?? null;
        
        if (!$submissionId) {
            errorResponse('提交ID为必填项');
        }
        
        try {
            $db->beginTransaction();
            
            // 更新提交内容
            $updates = [];
            $params = [];
            
            $fields = ['title', 'content', 'category', 'image', 'status'];
            
            foreach ($fields as $field) {
                if (isset($data[$field])) {
                    $updates[] = "$field = ?";
                    $params[] = $data[$field];
                }
            }
            
            if ($updates) {
                $params[] = $submissionId;
                $sql = 'UPDATE submissions SET ' . implode(', ', $updates) . ' WHERE id = ?';
                $stmt = $db->prepare($sql);
                $stmt->execute($params);
            }
            
            // 更新标签
            if (isset($data['tags'])) {
                // 删除旧标签
                $stmt = $db->prepare('DELETE FROM submission_tags WHERE submission_id = ?');
                $stmt->execute([$submissionId]);
                
                // 插入新标签
                if (!empty($data['tags'])) {
                    $stmt = $db->prepare('INSERT INTO submission_tags (submission_id, tag) VALUES (?, ?)');
                    foreach ($data['tags'] as $tag) {
                        $stmt->execute([$submissionId, $tag]);
                    }
                }
            }
            
            $db->commit();
            
            jsonResponse([
                'message' => '提交内容更新成功'
            ]);
        } catch (Exception $e) {
            $db->rollBack();
            errorResponse('提交内容更新失败: ' . $e->getMessage());
        }
        break;
        
    case 'DELETE':
        // 删除提交内容
        $submissionId = $_GET['id'] ?? null;
        
        if (!$submissionId) {
            errorResponse('提交ID为必填项');
        }
        
        try {
            $db->beginTransaction();
            
            // 删除标签
            $stmt = $db->prepare('DELETE FROM submission_tags WHERE submission_id = ?');
            $stmt->execute([$submissionId]);
            
            // 删除提交内容
            $stmt = $db->prepare('DELETE FROM submissions WHERE id = ?');
            $stmt->execute([$submissionId]);
            
            if ($stmt->rowCount() === 0) {
                $db->rollBack();
                errorResponse('提交内容不存在', 404);
            }
            
            $db->commit();
            
            jsonResponse([
                'message' => '提交内容删除成功'
            ]);
        } catch (Exception $e) {
            $db->rollBack();
            errorResponse('提交内容删除失败: ' . $e->getMessage());
        }
        break;
        
    default:
        errorResponse('不支持的请求方法', 405);
}