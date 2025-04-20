<?php

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/AuthController.php';

$authController = new AuthController();

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Method Not Allowed', 405);
    }

    $postData = json_decode(file_get_contents('php://input'), true);

    if (empty($postData['username']) || empty($postData['email']) || empty($postData['password'])) {
        throw new Exception('Username, email, and password are required', 400);
    }

    if (!filter_var($postData['email'], FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Invalid email format', 400);
    }

    $username = $postData['username'];
    $email = $postData['email'];
    $password = $postData['password'];
    $avatar = $postData['avatar'] ?? 'https://randomuser.me/api/portraits/men/32.jpg';

    $db = $authController->getDBConnection();

    $authController->checkIfUserExists($db, $username, $email);

    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    $authController->createUser($db, $username, $email, $hashedPassword, $avatar);

} catch (Exception $exception) {
    error_log('Registration Error: ' . $exception->getMessage());

    $statusCode = $exception->getCode() ?: 500;
    errorResponse($exception->getMessage(), $statusCode);
}

function errorResponse(string $message, int $statusCode = 400): void
{
    http_response_code($statusCode);
    header('Content-Type: application/json');
    echo json_encode(['error' => $message]);
    exit;
}


















































}
}