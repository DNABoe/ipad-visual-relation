<?php
require_once 'helpers.php';

$db = Database::getInstance();
$method = $_SERVER['REQUEST_METHOD'];
$path = $_GET['endpoint'] ?? 'health';

switch ($path) {
    case 'health':
        sendResponse([
            'status' => 'ok',
            'timestamp' => time(),
            'version' => API_VERSION,
            'database' => 'mysql'
        ]);
        break;
        
    case 'auth/check-first-time':
        try {
            $count = $db->fetchOne("SELECT COUNT(*) as count FROM users WHERE role = 'admin'");
            sendResponse(['isFirstTime' => $count['count'] == 0]);
        } catch (Exception $e) {
            sendError($e->getMessage(), 500);
        }
        break;
        
    case 'auth/register-admin':
        if ($method !== 'POST') {
            sendError('Method not allowed', 405);
        }
        
        try {
            $body = getRequestBody();
            $email = $body['email'] ?? '';
            $name = $body['name'] ?? '';
            $password = $body['password'] ?? '';
            
            if (empty($email) || empty($name) || empty($password)) {
                sendError('Email, name, and password are required', 400);
            }
            
            $existingAdmin = $db->fetchOne("SELECT COUNT(*) as count FROM users WHERE role = 'admin'");
            if ($existingAdmin['count'] > 0) {
                sendError('Admin already exists', 400);
            }
            
            $userId = bin2hex(random_bytes(16));
            $passwordHash = hashPassword($password);
            
            $sql = "INSERT INTO users (user_id, email, name, password_hash, role, can_investigate, created_at, last_login) 
                    VALUES (?, ?, ?, ?, 'admin', 1, NOW(), NOW())";
            $db->execute($sql, [$userId, $email, $name, $passwordHash]);
            
            $token = JWT::encode([
                'userId' => $userId,
                'email' => $email,
                'role' => 'admin',
                'exp' => time() + (30 * 24 * 60 * 60)
            ]);
            
            logActivity($db, $userId, 'admin_registered', "Admin account created: $email");
            
            sendResponse([
                'user' => [
                    'userId' => $userId,
                    'email' => $email,
                    'name' => $name,
                    'role' => 'admin',
                    'canInvestigate' => true
                ],
                'token' => $token
            ]);
        } catch (Exception $e) {
            sendError($e->getMessage(), 500);
        }
        break;
        
    case 'auth/login':
        if ($method !== 'POST') {
            sendError('Method not allowed', 405);
        }
        
        try {
            $body = getRequestBody();
            $email = $body['email'] ?? '';
            $password = $body['password'] ?? '';
            
            if (empty($email) || empty($password)) {
                sendError('Email and password are required', 400);
            }
            
            $user = $db->fetchOne("SELECT * FROM users WHERE email = ?", [$email]);
            
            if (!$user || !verifyPassword($password, $user['password_hash'])) {
                sendError('Invalid credentials', 401);
            }
            
            $db->execute("UPDATE users SET last_login = NOW(), login_count = login_count + 1 WHERE user_id = ?", [$user['user_id']]);
            
            $token = JWT::encode([
                'userId' => $user['user_id'],
                'email' => $user['email'],
                'role' => $user['role'],
                'exp' => time() + (30 * 24 * 60 * 60)
            ]);
            
            logActivity($db, $user['user_id'], 'login', "User logged in: {$user['email']}");
            
            sendResponse([
                'user' => [
                    'userId' => $user['user_id'],
                    'email' => $user['email'],
                    'name' => $user['name'],
                    'role' => $user['role'],
                    'canInvestigate' => (bool)$user['can_investigate'],
                    'loginCount' => (int)$user['login_count']
                ],
                'token' => $token
            ]);
        } catch (Exception $e) {
            sendError($e->getMessage(), 500);
        }
        break;
        
    case 'auth/verify':
        $auth = verifyAuth();
        
        try {
            $user = $db->fetchOne("SELECT * FROM users WHERE user_id = ?", [$auth['userId']]);
            
            if (!$user) {
                sendError('User not found', 404);
            }
            
            sendResponse([
                'userId' => $user['user_id'],
                'email' => $user['email'],
                'name' => $user['name'],
                'role' => $user['role'],
                'canInvestigate' => (bool)$user['can_investigate'],
                'loginCount' => (int)$user['login_count']
            ]);
        } catch (Exception $e) {
            sendError($e->getMessage(), 500);
        }
        break;
        
    case 'users':
        $auth = requireAdmin();
        
        if ($method === 'GET') {
            try {
                $users = $db->fetchAll("SELECT user_id, email, name, role, can_investigate, created_at, last_login, login_count FROM users ORDER BY created_at DESC");
                sendResponse($users);
            } catch (Exception $e) {
                sendError($e->getMessage(), 500);
            }
        } elseif ($method === 'PUT') {
            try {
                $body = getRequestBody();
                $userId = $body['userId'] ?? '';
                $canInvestigate = isset($body['canInvestigate']) ? ($body['canInvestigate'] ? 1 : 0) : null;
                
                if (empty($userId)) {
                    sendError('User ID is required', 400);
                }
                
                if ($canInvestigate !== null) {
                    $db->execute("UPDATE users SET can_investigate = ? WHERE user_id = ?", [$canInvestigate, $userId]);
                }
                
                logActivity($db, $auth['userId'], 'user_updated', "Updated user: $userId");
                sendResponse(['success' => true]);
            } catch (Exception $e) {
                sendError($e->getMessage(), 500);
            }
        } else {
            sendError('Method not allowed', 405);
        }
        break;
        
    case 'invitations/create':
        $auth = requireAdmin();
        
        if ($method !== 'POST') {
            sendError('Method not allowed', 405);
        }
        
        try {
            $body = getRequestBody();
            $email = $body['email'] ?? '';
            $name = $body['name'] ?? '';
            
            if (empty($email) || empty($name)) {
                sendError('Email and name are required', 400);
            }
            
            $existing = $db->fetchOne("SELECT * FROM users WHERE email = ?", [$email]);
            if ($existing) {
                sendError('User with this email already exists', 400);
            }
            
            $existingInvite = $db->fetchOne("SELECT * FROM invitations WHERE email = ? AND status = 'pending'", [$email]);
            if ($existingInvite) {
                sendError('Pending invitation already exists for this email', 400);
            }
            
            $token = generateToken();
            
            $sql = "INSERT INTO invitations (token, email, name, created_by, status, created_at, expires_at) 
                    VALUES (?, ?, ?, ?, 'pending', NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY))";
            $db->execute($sql, [$token, $email, $name, $auth['userId']]);
            
            logActivity($db, $auth['userId'], 'invitation_created', "Invited user: $email");
            
            $inviteUrl = CORS_ORIGIN . "?invite=" . $token . "&email=" . urlencode($email);
            
            sendResponse([
                'token' => $token,
                'inviteUrl' => $inviteUrl
            ]);
        } catch (Exception $e) {
            sendError($e->getMessage(), 500);
        }
        break;
        
    case 'invitations':
        $auth = requireAdmin();
        
        if ($method === 'GET') {
            try {
                $invites = $db->fetchAll("SELECT token, email, name, status, created_at, expires_at FROM invitations ORDER BY created_at DESC");
                sendResponse($invites);
            } catch (Exception $e) {
                sendError($e->getMessage(), 500);
            }
        } else {
            sendError('Method not allowed', 405);
        }
        break;
        
    case 'invitations/revoke':
        $auth = requireAdmin();
        
        if ($method !== 'POST') {
            sendError('Method not allowed', 405);
        }
        
        try {
            $body = getRequestBody();
            $token = $body['token'] ?? '';
            
            if (empty($token)) {
                sendError('Token is required', 400);
            }
            
            $db->execute("UPDATE invitations SET status = 'revoked' WHERE token = ?", [$token]);
            
            logActivity($db, $auth['userId'], 'invitation_revoked', "Revoked invitation: $token");
            sendResponse(['success' => true]);
        } catch (Exception $e) {
            sendError($e->getMessage(), 500);
        }
        break;
        
    case 'invitations/verify':
        if ($method !== 'POST') {
            sendError('Method not allowed', 405);
        }
        
        try {
            $body = getRequestBody();
            $token = $body['token'] ?? '';
            
            if (empty($token)) {
                sendError('Token is required', 400);
            }
            
            $invite = $db->fetchOne("SELECT * FROM invitations WHERE token = ?", [$token]);
            
            if (!$invite) {
                sendError('Invalid invitation token', 400);
            }
            
            if ($invite['status'] !== 'pending') {
                sendError('Invitation is no longer valid', 400);
            }
            
            if (strtotime($invite['expires_at']) < time()) {
                $db->execute("UPDATE invitations SET status = 'expired' WHERE token = ?", [$token]);
                sendError('Invitation has expired', 400);
            }
            
            sendResponse([
                'email' => $invite['email'],
                'name' => $invite['name']
            ]);
        } catch (Exception $e) {
            sendError($e->getMessage(), 500);
        }
        break;
        
    case 'invitations/accept':
        if ($method !== 'POST') {
            sendError('Method not allowed', 405);
        }
        
        try {
            $body = getRequestBody();
            $token = $body['token'] ?? '';
            $password = $body['password'] ?? '';
            
            if (empty($token) || empty($password)) {
                sendError('Token and password are required', 400);
            }
            
            $invite = $db->fetchOne("SELECT * FROM invitations WHERE token = ?", [$token]);
            
            if (!$invite || $invite['status'] !== 'pending') {
                sendError('Invalid or expired invitation', 400);
            }
            
            $db->beginTransaction();
            
            try {
                $userId = bin2hex(random_bytes(16));
                $passwordHash = hashPassword($password);
                
                $sql = "INSERT INTO users (user_id, email, name, password_hash, role, can_investigate, created_at, last_login) 
                        VALUES (?, ?, ?, ?, 'viewer', 0, NOW(), NOW())";
                $db->execute($sql, [$userId, $invite['email'], $invite['name'], $passwordHash]);
                
                $db->execute("UPDATE invitations SET status = 'accepted' WHERE token = ?", [$token]);
                
                $db->commit();
                
                $token = JWT::encode([
                    'userId' => $userId,
                    'email' => $invite['email'],
                    'role' => 'viewer',
                    'exp' => time() + (30 * 24 * 60 * 60)
                ]);
                
                logActivity($db, $userId, 'user_registered', "User registered via invitation: {$invite['email']}");
                
                sendResponse([
                    'user' => [
                        'userId' => $userId,
                        'email' => $invite['email'],
                        'name' => $invite['name'],
                        'role' => 'viewer',
                        'canInvestigate' => false,
                        'loginCount' => 0
                    ],
                    'token' => $token
                ]);
            } catch (Exception $e) {
                $db->rollback();
                throw $e;
            }
        } catch (Exception $e) {
            sendError($e->getMessage(), 500);
        }
        break;
        
    case 'users/openai-key':
        $auth = verifyAuth();
        
        if ($method === 'POST') {
            try {
                $body = getRequestBody();
                $apiKey = $body['apiKey'] ?? '';
                
                if (empty($apiKey)) {
                    sendError('API key is required', 400);
                }
                
                $encryptedKey = base64_encode($apiKey);
                
                $db->execute("UPDATE users SET openai_api_key = ? WHERE user_id = ?", [$encryptedKey, $auth['userId']]);
                
                logActivity($db, $auth['userId'], 'api_key_set', 'OpenAI API key updated');
                sendResponse(['success' => true]);
            } catch (Exception $e) {
                sendError($e->getMessage(), 500);
            }
        } elseif ($method === 'GET') {
            try {
                $user = $db->fetchOne("SELECT openai_api_key FROM users WHERE user_id = ?", [$auth['userId']]);
                
                if ($user && $user['openai_api_key']) {
                    $apiKey = base64_decode($user['openai_api_key']);
                    sendResponse(['apiKey' => $apiKey]);
                } else {
                    sendResponse(['apiKey' => null]);
                }
            } catch (Exception $e) {
                sendError($e->getMessage(), 500);
            }
        } elseif ($method === 'DELETE') {
            try {
                $db->execute("UPDATE users SET openai_api_key = NULL WHERE user_id = ?", [$auth['userId']]);
                
                logActivity($db, $auth['userId'], 'api_key_deleted', 'OpenAI API key removed');
                sendResponse(['success' => true]);
            } catch (Exception $e) {
                sendError($e->getMessage(), 500);
            }
        } else {
            sendError('Method not allowed', 405);
        }
        break;
        
    case 'admin/reset':
        $auth = requireAdmin();
        
        if ($method !== 'POST') {
            sendError('Method not allowed', 405);
        }
        
        try {
            $body = getRequestBody();
            $confirm = $body['confirm'] ?? '';
            
            if ($confirm !== 'DELETE_ALL_DATA') {
                sendError('Invalid confirmation', 400);
            }
            
            $db->beginTransaction();
            
            try {
                $db->execute("DELETE FROM activity_log");
                $db->execute("DELETE FROM invitations");
                $db->execute("DELETE FROM users");
                
                $db->commit();
                
                sendResponse(['success' => true]);
            } catch (Exception $e) {
                $db->rollback();
                throw $e;
            }
        } catch (Exception $e) {
            sendError($e->getMessage(), 500);
        }
        break;
        
    case 'admin/stats':
        $auth = requireAdmin();
        
        if ($method !== 'GET') {
            sendError('Method not allowed', 405);
        }
        
        try {
            $totalUsers = $db->fetchOne("SELECT COUNT(*) as count FROM users");
            $activeUsers = $db->fetchOne("SELECT COUNT(*) as count FROM users WHERE last_login >= DATE_SUB(NOW(), INTERVAL 30 DAY)");
            $pendingInvites = $db->fetchOne("SELECT COUNT(*) as count FROM invitations WHERE status = 'pending'");
            
            $userLogins = $db->fetchAll("SELECT email, name, login_count, last_login FROM users ORDER BY login_count DESC LIMIT 10");
            
            sendResponse([
                'totalUsers' => (int)$totalUsers['count'],
                'activeUsers' => (int)$activeUsers['count'],
                'pendingInvites' => (int)$pendingInvites['count'],
                'userLogins' => $userLogins
            ]);
        } catch (Exception $e) {
            sendError($e->getMessage(), 500);
        }
        break;
        
    default:
        sendError('Endpoint not found', 404);
}
?>
