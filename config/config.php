<?php

/**
 * Configuration file for the application.
 */

/**
 * Database configuration.
 */
define('DB_HOST', 'localhost');                    // Database host
define('DB_NAME', 'techvault_club');              // Database name
define('DB_USER', 'techvault_club');              // Database username
define('DB_PASS', 'KCpDHpdt1cYYD8rp');              // Database password
define('DB_CHARSET', 'utf8mb4');                    // Database character set

/**
 * JSON Web Token (JWT) configuration.
 */
define('JWT_SECRET', 'ai-tech-knowledge-base-secret-key'); // Secret key for JWT encoding/decoding
define('JWT_EXPIRES_IN', 86400);                       // JWT expiration time in seconds (24 hours)

/**
 * File upload configuration.
 */
define('UPLOAD_DIR', __DIR__ . '/../uploads/');      // Directory where uploaded files will be stored
define('MAX_FILE_SIZE', 10 * 1024 * 1024);          // Maximum file size in bytes (10MB)

/**
 * Allowed file types for uploads.
 */
define('ALLOWED_FILE_TYPES', [                     
    'image/jpeg',                                   // JPEG images
    'image/png',                                    // PNG images
    'image/gif',                                    // GIF images
    'application/pdf',                              // PDF documents
    'application/msword',                           // Microsoft Word documents (.doc)
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // Microsoft Word documents (.docx)
    'application/x-httpd-php'                       // PHP files (Note: Consider security implications!)
]);

/**
 * Server configuration adjustments.
 */
ini_set('max_execution_time', 300);                // Set maximum script execution time to 300 seconds
ini_set('memory_limit', '256M');                    // Set memory limit to 256MB
ini_set('post_max_size', '10M');                     // Set maximum size of POST data to 10MB
ini_set('upload_max_filesize', '10M');              // Set maximum upload file size to 10MB

/**
 * Establishes a database connection using PDO.
 *
 * @return PDO The PDO database connection object.
 * @throws PDOException If a connection error occurs.
 */
function getDBConnection(): PDO
{
    $dsn = sprintf('mysql:host=%s;dbname=%s;charset=%s', DB_HOST, DB_NAME, DB_CHARSET);
    $options = [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, PDO::ATTR_EMULATE_PREPARES => false,];
    return new PDO($dsn, DB_USER, DB_PASS, $options);
}