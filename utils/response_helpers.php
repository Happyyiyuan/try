<?php
/**
 * API 响应辅助函数
 */

/**
 * 发送 JSON 响应
 *
 * @param mixed $data 要编码为 JSON 的数据
 * @param int $status_code HTTP 状态码 (默认为 200)
 * @return void
 */
function jsonResponse($data, $status_code = 200) {
    header('Content-Type: application/json; charset=utf-8');
    http_response_code($status_code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit; // 确保脚本在发送响应后停止执行
}

/**
 * 发送 JSON 错误响应
 *
 * @param string $message 错误消息
 * @param int $status_code HTTP 状态码
 * @param array|null $errors 可选的详细错误信息
 * @return void
 */
function errorResponse($message, $status_code, $errors = null) {
    $response = ['error' => $message];
    if ($errors !== null) {
        $response['errors'] = $errors;
    }
    jsonResponse($response, $status_code);
}

?>