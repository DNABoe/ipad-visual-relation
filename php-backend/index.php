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
        
    case 'auth/reset-all':
        if ($method !== 'POST') {
            sendError('Method not allowed', 405);
        }
        
        try {
            $db->execute("DELETE FROM users");
            $db->execute("DELETE FROM invitations");
            $db->execute("DELETE FROM activity_log");
            
            sendResponse(['success' => true, 'message' => 'All data has been reset']);
        } catch (Exception $e) {
            sendError($e->getMessage(), 500);
        }
        break;
        
    case 'auth/register':
        if ($method !== 'POST') {
            sendError('Method not allowed', 405);
        }
        
        try {
            $body = getRequestBody();
            $email = $body['email'] ?? '';
            $name = $body['name'] ?? '';
            $password = $body['password'] ?? '';
            $role = $body['role'] ?? 'admin';
            
            if (empty($email) || empty($name) || empty($password)) {
                sendError('Email, name, and password are required', 400);
            }
            
            $existing = $db->fetchOne("SELECT * FROM users WHERE email = ?", [$email]);
            if ($existing) {
                sendError('User with this email already exists', 400);
            }
            
            $userId = 'user_' . bin2hex(random_bytes(16));
            $passwordHash = hashPassword($password);
            $timestamp = getCurrentTimestamp();
            
            $sql = "INSERT INTO users (user_id, email, name, password_hash, role, can_investigate, created_at, last_login, login_count) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)";
            $db->execute($sql, [$userId, $email, $name, $passwordHash, $role, 0, $timestamp, $timestamp]);
            
            $token = JWT::encode([
                'userId' => $userId,
                'email' => $email,
                'role' => $role,
                'exp' => time() + (30 * 24 * 60 * 60)
            ]);
            
            logActivity($db, $userId, 'registration', "User registered: $email");
            
            sendResponse([
                'userId' => $userId,
                'email' => $email,
                'name' => $name,
                'role' => $role,
                'canInvestigate' => false,
                'createdAt' => $timestamp,
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
            
            $timestamp = getCurrentTimestamp();
            $db->execute("UPDATE users SET last_login = ?, login_count = login_count + 1 WHERE user_id = ?", [$timestamp, $user['user_id']]);
            
            $token = JWT::encode([
                'userId' => $user['user_id'],
                'email' => $user['email'],
                'role' => $user['role'],
                'exp' => time() + (30 * 24 * 60 * 60)
            ]);
            
            logActivity($db, $user['user_id'], 'login', "User logged in: {$user['email']}");
            
            $currentTimestamp = getCurrentTimestamp();
            sendResponse([
                'userId' => $user['user_id'],
                'email' => $user['email'],
                'name' => $user['name'],
                'role' => $user['role'],
                'canInvestigate' => (bool)$user['can_investigate'],
                'loginCount' => (int)$user['login_count'] + 1,
                'createdAt' => (int)$user['created_at'],
                'lastLogin' => $currentTimestamp,
                'passwordHash' => $user['password_hash'],
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
                'loginCount' => (int)$user['login_count'],
                'createdAt' => (int)$user['created_at'],
                'lastLogin' => (int)$user['last_login'],
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
                        'createdAt' => (int)$user['created_at'],
                        'lastLogin' => (int)$user['last_login'],
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
                $role = $body['role'] ?? 'normal';
                $canInvestigate = isset($body['canInvestigate']) ? ($body['canInvestigate'] ? 1 : 0) : 0;
                
                if (empty($email) || empty($name) || empty($passwordHash)) {
                    sendError('Email, name, and password hash are required', 400);
                }
                
                $existing = $db->fetchOne("SELECT * FROM users WHERE email = ?", [$email]);
                if ($existing) {
                    sendError('User with this email already exists', 400);
                }
                
                $timestamp = getCurrentTimestamp();
                $sql = "INSERT INTO users (user_id, email, name, password_hash, role, can_investigate, created_at, last_login, login_count) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)";
                $db->execute($sql, [$userId, $email, $name, $passwordHash, $role, $canInvestigate, $timestamp, $timestamp]);
                
                logActivity($db, $userId, 'user_created', "User created: $email");
                
                $user = $db->fetchOne("SELECT * FROM users WHERE user_id = ?", [$userId]);
                
                sendResponse([
                    'userId' => $user['user_id'],
                    'email' => $user['email'],
                    'name' => $user['name'],
                    'role' => $user['role'],
                    'canInvestigate' => (bool)$user['can_investigate'],
                    'loginCount' => (int)$user['login_count'],
                    'createdAt' => (int)$user['created_at'],
                    'lastLogin' => (int)$user['last_login'],
                    'passwordHash' => $user['password_hash']
                ]);
            } catch (Exception $e) {
                sendError($e->getMessage(), 500);
            }
        } else {
            sendError('Method not allowed', 405);
        }
        break;
        
    case 'users/create':
        $auth = requireAdmin();
        
        if ($method !== 'POST') {
            sendError('Method not allowed', 405);
        }
        
        try {
            $body = getRequestBody();
            $email = $body['email'] ?? '';
            $name = $body['name'] ?? '';
            $password = $body['password'] ?? '';
            $role = $body['role'] ?? 'normal';
            $canInvestigate = isset($body['canInvestigate']) ? ($body['canInvestigate'] ? 1 : 0) : 0;
            
            if (empty($email) || empty($name) || empty($password)) {
                sendError('Email, name, and password are required', 400);
            }
            
            $existing = $db->fetchOne("SELECT * FROM users WHERE email = ?", [$email]);
            if ($existing) {
                sendError('User with this email already exists', 400);
            }
            
            $userId = 'user_' . bin2hex(random_bytes(16));
            $passwordHash = hashPassword($password);
            $timestamp = getCurrentTimestamp();
            
            $sql = "INSERT INTO users (user_id, email, name, password_hash, role, can_investigate, created_at, last_login, login_count) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)";
            $db->execute($sql, [$userId, $email, $name, $passwordHash, $role, $canInvestigate, $timestamp, $timestamp]);
            
            logActivity($db, $auth['userId'], 'user_created', "Admin created user: $email");
            
            sendResponse([
                'userId' => $userId,
                'email' => $email,
                'name' => $name,
                'role' => $role,
                'canInvestigate' => (bool)$canInvestigate
            ]);
        } catch (Exception $e) {
            sendError($e->getMessage(), 500);
        }
        break;
        
    case 'invites/create':
        $auth = requireAdmin();
        
        if ($method !== 'POST') {
            sendError('Method not allowed', 405);
        }
        
        try {
            $body = getRequestBody();
            $email = $body['email'] ?? '';
            $name = $body['name'] ?? '';
            $role = $body['role'] ?? 'normal';
            
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
            
            $token = 'invite-' . time() . '-' . bin2hex(random_bytes(8));
            $inviteId = 'inv_' . bin2hex(random_bytes(16));
            $timestamp = getCurrentTimestamp();
            $expiresAt = $timestamp + (7 * 24 * 60 * 60 * 1000);
            
            $sql = "INSERT INTO invitations (invite_id, token, email, name, created_by, status, created_at, expires_at) 
                    VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)";
            $db->execute($sql, [$inviteId, $token, $email, $name, $auth['userId'], $timestamp, $expiresAt]);
            
            logActivity($db, $auth['userId'], 'invitation_created', "Invited user: $email");
            
            sendResponse([
                'inviteId' => $inviteId,
                'token' => $token,
                'email' => $email,
                'name' => $name,
                'role' => $role,
                'createdAt' => $timestamp,
                'expiresAt' => $expiresAt
            ]);
        } catch (Exception $e) {
            sendError($e->getMessage(), 500);
        }
        break;
        
    case 'invites/accept':
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
            
            $invite = $db->fetchOne("SELECT * FROM invitations WHERE token = ? AND status = 'pending'", [$token]);
            
            if (!$invite) {
                sendError('Invalid or expired invitation', 404);
            }
            
            $currentTimestamp = getCurrentTimestamp();
            if ($invite['expires_at'] < $currentTimestamp) {
                $db->execute("UPDATE invitations SET status = 'expired' WHERE token = ?", [$token]);
                sendError('This invitation has expired', 400);
            }
            
            $existing = $db->fetchOne("SELECT * FROM users WHERE email = ?", [$invite['email']]);
            if ($existing) {
                sendError('User with this email already exists', 400);
            }
            
            $userId = 'user_' . bin2hex(random_bytes(16));
            $passwordHash = hashPassword($password);
            $timestamp = getCurrentTimestamp();
            
            $sql = "INSERT INTO users (user_id, email, name, password_hash, role, can_investigate, created_at, last_login, login_count) 
                    VALUES (?, ?, ?, ?, 'normal', 0, ?, ?, 0)";
            $db->execute($sql, [$userId, $invite['email'], $invite['name'], $passwordHash, $timestamp, $timestamp]);
            
            $db->execute("UPDATE invitations SET status = 'accepted' WHERE token = ?", [$token]);
            
            $authToken = JWT::encode([
                'userId' => $userId,
                'email' => $invite['email'],
                'role' => 'normal',
                'exp' => time() + (30 * 24 * 60 * 60)
            ]);
            
            logActivity($db, $userId, 'invite_accepted', "User accepted invitation: {$invite['email']}");
            
            sendResponse([
                'userId' => $userId,
                'email' => $invite['email'],
                'name' => $invite['name'],
                'role' => 'normal',
                'canInvestigate' => false,
                'token' => $authToken
            ]);
        } catch (Exception $e) {
            sendError($e->getMessage(), 500);
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
                    'createdAt' => (int)$user['created_at'],
                    'lastLogin' => (int)$user['last_login'],
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
                        'createdAt' => (int)$user['created_at'],
                        'lastLogin' => (int)$user['last_login'],
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
                            'inviteId' => $invite['invite_id'],
                            'token' => $invite['token'],
                            'email' => $invite['email'],
                            'name' => $invite['name'],
                            'role' => 'normal',
                            'createdBy' => $invite['created_by'],
                            'status' => $invite['status'],
                            'createdAt' => (int)$invite['created_at'],
                            'expiresAt' => (int)$invite['expires_at']
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
                    $inviteId = 'inv_' . bin2hex(random_bytes(16));
                    $timestamp = getCurrentTimestamp();
                    $expiresAt = $timestamp + (7 * 24 * 60 * 60 * 1000); // 7 days in milliseconds
                    
                    $sql = "INSERT INTO invitations (invite_id, token, email, name, created_by, status, created_at, expires_at) 
                            VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)";
                    $db->execute($sql, [$inviteId, $token, $email, $name, $auth['userId'], $timestamp, $expiresAt]);
                    
                    logActivity($db, $auth['userId'], 'invitation_created', "Invited user: $email");
                    
                    $invite = $db->fetchOne("SELECT * FROM invitations WHERE token = ?", [$token]);
                    
                    sendResponse([
                        'token' => $invite['token'],
                        'email' => $invite['email'],
                        'name' => $invite['name'],
                        'role' => $role,
                        'createdBy' => $invite['created_by'],
                        'status' => $invite['status'],
                        'createdAt' => (int)$invite['created_at'],
                        'expiresAt' => (int)$invite['expires_at']
                    ]);
                } catch (Exception $e) {
                    sendError($e->getMessage(), 500);
                }
            } else {
                sendError('Method not allowed', 405);
            }
        } elseif (preg_match('#^invites/(.+)$#', $path, $matches)) {
            $identifier = $matches[1];
            
            if ($path === 'invites/cleanup') {
                $auth = requireAdmin();
                
                if ($method !== 'POST') {
                    sendError('Method not allowed', 405);
                }
                
                try {
                    $currentTimestamp = getCurrentTimestamp();
                    $db->execute("UPDATE invitations SET status = 'expired' WHERE status = 'pending' AND expires_at < ?", [$currentTimestamp]);
                    logActivity($db, $auth['userId'], 'invites_cleaned', "Cleaned up expired invites");
                    sendResponse(['success' => true]);
                } catch (Exception $e) {
                    sendError($e->getMessage(), 500);
                }
            } elseif ($method === 'GET') {
                try {
                    $invite = $db->fetchOne("SELECT * FROM invitations WHERE token = ? OR invite_id = ?", [$identifier, $identifier]);
                    
                    if (!$invite) {
                        sendError('Invitation not found', 404);
                    }
                    
                    sendResponse([
                        'inviteId' => $invite['invite_id'],
                        'token' => $invite['token'],
                        'email' => $invite['email'],
                        'name' => $invite['name'],
                        'role' => 'normal',
                        'createdBy' => $invite['created_by'],
                        'status' => $invite['status'],
                        'createdAt' => (int)$invite['created_at'],
                        'expiresAt' => (int)$invite['expires_at']
                    ]);
                } catch (Exception $e) {
                    sendError($e->getMessage(), 500);
                }
            } elseif ($method === 'DELETE') {
                $auth = requireAdmin();
                
                try {
                    $db->execute("UPDATE invitations SET status = 'revoked' WHERE token = ? OR invite_id = ?", [$identifier, $identifier]);
                    
                    logActivity($db, $auth['userId'], 'invitation_revoked', "Revoked invitation: $identifier");
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
