<?php
/**
 * API Response Helper Functions
 */

/**
 * Sends a JSON response.
 *
 * @param mixed $data The data to be encoded as JSON.
 * @param int $statusCode The HTTP status code (defaults to 200).
 * @return void
 */
function sendJsonResponse($data, int $statusCode = 200): void
{
    header('Content-Type: application/json; charset=UTF-8');
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Sends a JSON error response.
 *
 * @param string $message The error message.
 * @param int $statusCode The HTTP status code.
 * @param array|null $errors Optional detailed error information.
 * @return void
 */
function sendErrorResponse(string $message, int $statusCode, ?array $errors = null): void
{
    sendJsonResponse(['error' => $message, 'errors' => $errors], $statusCode);
}