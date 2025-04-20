<?php
require_once __DIR__.'/../../config/config.php';

$requestMethod = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($requestMethod !== 'POST') {
  errorResponse('Method Not Allowed', 405);
}

$requestData = json_decode(file_get_contents('php://input'), true);
$usernameOrEmail = $requestData['username'] ?? '';
$password = $requestData['password'] ?? '';

$missingFields = [];
if (empty($usernameOrEmail)) {
  $missingFields[] = 'username';
}
if (empty($password)) {
  $missingFields[] = 'password';
}

if (!empty($missingFields)) {
  errorResponse('Missing fields: '.implode(', ', $missingFields), 400);
}

try {
  $dbConnection = getDBConnection();
  $query = 'SELECT * FROM users WHERE username = ? OR email = ?';
  $statement = $dbConnection->prepare($query);
  $statement->execute([$usernameOrEmail, $usernameOrEmail]);
  $user = $statement->fetch();

  if (!$user || !password_verify($password, $user['password'])) {
    errorResponse('Invalid credentials', 401);
  }

  $payload = [
    'id' => $user['id'],
    'username' => $user['username'],
    'role' => $user['role'],
    'exp' => time() + JWT_EXPIRES_IN,
  ];

  $jwtToken = jwt_encode($payload, JWT_SECRET);

  setcookie('token', $jwtToken, [
    'expires' => time() + JWT_EXPIRES_IN,
    'path' => '/',
    'httponly' => true,
    'samesite' => 'Strict',
  ]);

  $userData = [
    'id' => $user['id'],
    'username' => $user['username'],
    'email' => $user['email'],
    'role' => $user['role'],
    'avatar' => $user['avatar'],
  ];

  $responseData = [
    'message' => 'Login successful',
    'user' => $userData,
    'token' => $jwtToken,
  ];

  jsonResponse($responseData);
} catch (Exception $e) {
  error_log('Login error: '.$e->getMessage());
  errorResponse('Login failed, please try again later', 500);
}