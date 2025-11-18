<?php
// Database configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'lpmjclyqtt_releye_user');
define('DB_PASS', 'YOUR_DATABASE_PASSWORD_HERE');
define('DB_NAME', 'lpmjclyqtt_releye');
define('DB_CHARSET', 'utf8mb4');

// JWT Secret for token generation
define('JWT_SECRET', 'CHANGE_THIS_TO_A_RANDOM_STRING');

// CORS Origin
define('CORS_ORIGIN', 'https://releye.boestad.com');

// API Version
define('API_VERSION', '1.0.0');

// Error reporting (disable in production)
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Timezone
date_default_timezone_set('UTC');
?>
