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
        
    case 'auth/first-time':
        try {
            $count = $db->fetchOne("SELECT COUNT(*) as count FROM users WHERE role = 'admin'");
            sendResponse(['isFirstTime' => $count['count'] == 0]);
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
                'userId' => $user['user_id'],
                'email' => $user['email'],
                'name' => $user['name'],
                'role' => $user['role'],
                'canInvestigate' => (bool)$user['can_investigate'],
                'loginCount' => (int)$user['login_count'],
                'createdAt' => strtotime($user['created_at']) * 1000,
                'lastLogin' => strtotime($user['last_login']) * 1000,
                'passwordHash' => $user['password_hash']
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
                'loginCount' => (int)$user['login_count'],
                'createdAt' => strtotime($user['created_at']) * 1000,
                'lastLogin' => strtotime($user['last_login']) * 1000,
                'passwordHash' => $user['password_hash']
            ]);
        } catch (Exception $e) {
            sendError($e->getMessage(), 500);
        }
        break;
        
    case 'users':
        if ($method === 'GET') {
            $auth = requireAdmin();
            try {
                $users = $db->fetchAll("SELECT * FROM users ORDER BY created_at DESC");
                $result = [];
                foreach ($users as $user) {
                    $result[] = [
                        'userId' => $user['user_id'],
                        'email' => $user['email'],
                        'name' => $user['name'],
                        'role' => $user['role'],
                        'canInvestigate' => (bool)$user['can_investigate'],
                        'loginCount' => (int)$user['login_count'],
                        'createdAt' => strtotime($user['created_at']) * 1000,
                        'lastLogin' => strtotime($user['last_login']) * 1000,
                        'passwordHash' => $user['password_hash']
                    ];
                }
                sendResponse($result);
            } catch (Exception $e) {
                sendError($e->getMessage(), 500);
            }
        } elseif ($method === 'POST') {
            try {
                $body = getRequestBody();
                $userId = $body['userId'] ?? bin2hex(random_bytes(16));
                $email = $body['email'] ?? '';
                $name = $body['name'] ?? '';
                $passwordHash = $body['passwordHash'] ?? '';
                $role = $body['role'] ?? 'viewer';
                $canInvestigate = isset($body['canInvestigate']) ? ($body['canInvestigate'] ? 1 : 0) : 0;
                
                if (empty($email) || empty($name) || empty($passwordHash)) {
                    sendError('Email, name, and password hash are required', 400);
                }
                
                $existing = $db->fetchOne("SELECT * FROM users WHERE email = ?", [$email]);
                if ($existing) {
                    sendError('User with this email already exists', 400);
                }
                
                $sql = "INSERT INTO users (user_id, email, name, password_hash, role, can_investigate, created_at, last_login, login_count) 
                        VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW(), 0)";
                $db->execute($sql, [$userId, $email, $name, $passwordHash, $role, $canInvestigate]);
                
                logActivity($db, $userId, 'user_created', "User created: $email");
                
                $user = $db->fetchOne("SELECT * FROM users WHERE user_id = ?", [$userId]);
                
                sendResponse([
                    'userId' => $user['user_id'],
                    'email' => $user['email'],
                    'name' => $user['name'],
                    'role' => $user['role'],
                    'canInvestigate' => (bool)$user['can_investigate'],
                    'loginCount' => (int)$user['login_count'],
                    'createdAt' => strtotime($user['created_at']) * 1000,
                    'lastLogin' => strtotime($user['last_login']) * 1000,
                    'passwordHash' => $user['password_hash']
                ]);
            } catch (Exception $e) {
                sendError($e->getMessage(), 500);
            }
        } else {
            sendError('Method not allowed', 405);
        }
        break;
        
    default:
        if (preg_match('#^users/email/(.+)$#', $path, $matches)) {
            $auth = requireAdmin();
            $email = urldecode($matches[1]);
            
            if ($method !== 'GET') {
                sendError('Method not allowed', 405);
            }
            
            try {
                $user = $db->fetchOne("SELECT * FROM users WHERE email = ?", [$email]);
                
                if (!$user) {
                    sendError('User not found', 404);
                }
                
                sendResponse([
                    'userId' => $user['user_id'],
                    'email' => $user['email'],
                    'name' => $user['name'],
                    'role' => $user['role'],
                    'canInvestigate' => (bool)$user['can_investigate'],
                    'loginCount' => (int)$user['login_count'],
                    'createdAt' => strtotime($user['created_at']) * 1000,
                    'lastLogin' => strtotime($user['last_login']) * 1000,
                    'passwordHash' => $user['password_hash']
                ]);
            } catch (Exception $e) {
                sendError($e->getMessage(), 500);
            }
        } elseif (preg_match('#^users/(.+)$#', $path, $matches)) {
            $auth = requireAdmin();
            $userId = $matches[1];
            
            if ($method === 'GET') {
                try {
                    $user = $db->fetchOne("SELECT * FROM users WHERE user_id = ?", [$userId]);
                    
                    if (!$user) {
                        sendError('User not found', 404);
                    }
                    
                    sendResponse([
                        'userId' => $user['user_id'],
                        'email' => $user['email'],
                        'name' => $user['name'],
                        'role' => $user['role'],
                        'canInvestigate' => (bool)$user['can_investigate'],
                        'loginCount' => (int)$user['login_count'],
                        'createdAt' => strtotime($user['created_at']) * 1000,
                        'lastLogin' => strtotime($user['last_login']) * 1000,
                        'passwordHash' => $user['password_hash']
                    ]);
                } catch (Exception $e) {
                    sendError($e->getMessage(), 500);
                }
            } elseif ($method === 'PUT') {
                try {
                    $body = getRequestBody();
                    $updates = [];
                    $params = [];
                    
                    if (isset($body['name'])) {
                        $updates[] = "name = ?";
                        $params[] = $body['name'];
                    }
                    if (isset($body['role'])) {
                        $updates[] = "role = ?";
                        $params[] = $body['role'];
                    }
                    if (isset($body['canInvestigate'])) {
                        $updates[] = "can_investigate = ?";
                        $params[] = $body['canInvestigate'] ? 1 : 0;
                    }
                    if (isset($body['passwordHash'])) {
                        $updates[] = "password_hash = ?";
                        $params[] = $body['passwordHash'];
                    }
                    
                    if (empty($updates)) {
                        sendError('No updates provided', 400);
                    }
                    
                    $params[] = $userId;
                    $sql = "UPDATE users SET " . implode(", ", $updates) . " WHERE user_id = ?";
                    $db->execute($sql, $params);
                    
                    logActivity($db, $auth['userId'], 'user_updated', "Updated user: $userId");
                    sendResponse(['success' => true]);
                } catch (Exception $e) {
                    sendError($e->getMessage(), 500);
                }
            } elseif ($method === 'DELETE') {
                try {
                    $db->execute("DELETE FROM users WHERE user_id = ?", [$userId]);
                    
                    logActivity($db, $auth['userId'], 'user_deleted', "Deleted user: $userId");
                    sendResponse(['success' => true]);
                } catch (Exception $e) {
                    sendError($e->getMessage(), 500);
                }
            } else {
                sendError('Method not allowed', 405);
            }
        } elseif ($path === 'invites') {
            $auth = requireAdmin();
            
            if ($method === 'GET') {
                try {
                    $invites = $db->fetchAll("SELECT * FROM invitations ORDER BY created_at DESC");
                    $result = [];
                    foreach ($invites as $invite) {
                        $result[] = [
                            'token' => $invite['token'],
                            'email' => $invite['email'],
                            'name' => $invite['name'],
                            'role' => 'viewer',
                            'createdBy' => $invite['created_by'],
                            'status' => $invite['status'],
                            'createdAt' => strtotime($invite['created_at']) * 1000,
                            'expiresAt' => strtotime($invite['expires_at']) * 1000
                        ];
                    }
                    sendResponse($result);
                } catch (Exception $e) {
                    sendError($e->getMessage(), 500);
                }
            } elseif ($method === 'POST') {
                try {
                    $body = getRequestBody();
                    $email = $body['email'] ?? '';
                    $name = $body['name'] ?? '';
                    $role = $body['role'] ?? 'viewer';
                    
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
                    
                    $invite = $db->fetchOne("SELECT * FROM invitations WHERE token = ?", [$token]);
                    
                    sendResponse([
                        'token' => $invite['token'],
                        'email' => $invite['email'],
                        'name' => $invite['name'],
                        'role' => $role,
                        'createdBy' => $invite['created_by'],
                        'status' => $invite['status'],
                        'createdAt' => strtotime($invite['created_at']) * 1000,
                        'expiresAt' => strtotime($invite['expires_at']) * 1000
                    ]);
                } catch (Exception $e) {
                    sendError($e->getMessage(), 500);
                }
            } else {
                sendError('Method not allowed', 405);
            }
        } elseif (preg_match('#^invites/(.+)$#', $path, $matches)) {
            $token = $matches[1];
            
            if ($path === 'invites/cleanup') {
                $auth = requireAdmin();
                
                if ($method !== 'POST') {
                    sendError('Method not allowed', 405);
                }
                
                try {
                    $db->execute("UPDATE invitations SET status = 'expired' WHERE status = 'pending' AND expires_at < NOW()");
                    logActivity($db, $auth['userId'], 'invites_cleaned', "Cleaned up expired invites");
                    sendResponse(['success' => true]);
                } catch (Exception $e) {
                    sendError($e->getMessage(), 500);
                }
            } elseif ($method === 'GET') {
                try {
                    $invite = $db->fetchOne("SELECT * FROM invitations WHERE token = ?", [$token]);
                    
                    if (!$invite) {
                        sendError('Invitation not found', 404);
                    }
                    
                    sendResponse([
                        'token' => $invite['token'],
                        'email' => $invite['email'],
                        'name' => $invite['name'],
                        'role' => 'viewer',
                        'createdBy' => $invite['created_by'],
                        'status' => $invite['status'],
                        'createdAt' => strtotime($invite['created_at']) * 1000,
                        'expiresAt' => strtotime($invite['expires_at']) * 1000
                    ]);
                } catch (Exception $e) {
                    sendError($e->getMessage(), 500);
                }
            } elseif ($method === 'DELETE') {
                $auth = requireAdmin();
                
                try {
                    $db->execute("UPDATE invitations SET status = 'revoked' WHERE token = ?", [$token]);
                    
                    logActivity($db, $auth['userId'], 'invitation_revoked', "Revoked invitation: $token");
                    sendResponse(['success' => true]);
                } catch (Exception $e) {
                    sendError($e->getMessage(), 500);
                }
            } else {
                sendError('Method not allowed', 405);
            }
        } else {
            sendError('Endpoint not found: ' . $path, 404);
        }
}
?>
