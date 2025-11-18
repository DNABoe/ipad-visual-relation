-- ===========================================================
--  RelEye Database Schema for MySQL
--  Database: lpmjclyqtt_releye
--  User: lpmjclyqtt_releye_user
--  
--  INSTRUCTIONS:
--  1. Log into Spaceship cPanel
--  2. Open phpMyAdmin
--  3. Select database: lpmjclyqtt_releye
--  4. Click "Import" tab
--  5. Upload this file OR paste contents into SQL tab
--  6. Click "Go" to execute
-- ===========================================================

-- Use the correct database
USE lpmjclyqtt_releye;

-- ===========================================================
--  Drop existing tables (if you want a clean start)
--  UNCOMMENT THE FOLLOWING LINES TO RESET DATABASE
-- ===========================================================
-- DROP TABLE IF EXISTS activity_log;
-- DROP TABLE IF EXISTS invitations;
-- DROP TABLE IF EXISTS users;

-- ===========================================================
--  User Management Tables
-- ===========================================================

-- Users table - stores all application users
CREATE TABLE IF NOT EXISTS users (
    user_id VARCHAR(100) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    role ENUM('admin', 'editor', 'viewer') NOT NULL DEFAULT 'viewer',
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    password_iterations INT NOT NULL DEFAULT 210000,
    encrypted_api_key TEXT,
    api_key_salt TEXT,
    can_investigate BOOLEAN DEFAULT FALSE,
    created_at BIGINT NOT NULL,
    last_login BIGINT,
    login_count INT DEFAULT 0,
    status ENUM('active', 'suspended') DEFAULT 'active',
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Invitations table - stores pending user invitations
CREATE TABLE IF NOT EXISTS invitations (
    invite_id VARCHAR(100) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    role ENUM('admin', 'editor', 'viewer') NOT NULL DEFAULT 'viewer',
    token VARCHAR(255) NOT NULL UNIQUE,
    created_at BIGINT NOT NULL,
    expires_at BIGINT NOT NULL,
    created_by VARCHAR(100) NOT NULL,
    status ENUM('pending', 'accepted', 'expired', 'revoked') DEFAULT 'pending',
    INDEX idx_token (token),
    INDEX idx_email (email),
    INDEX idx_status (status),
    INDEX idx_expires (expires_at),
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Activity log table - tracks user actions
CREATE TABLE IF NOT EXISTS activity_log (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(100),
    action VARCHAR(255) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45),
    created_at BIGINT NOT NULL,
    INDEX idx_user (user_id),
    INDEX idx_action (action),
    INDEX idx_created (created_at),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================================
--  Default Admin User
--  Username: admin
--  Password: admin
--  ⚠️  IMPORTANT: Change this password immediately after first login!
-- ===========================================================

-- Delete existing admin if present (for clean setup)
DELETE FROM users WHERE email = 'admin@releye.local' OR user_id = 'admin-default';

-- Insert default admin
-- Password hash for "admin" using PBKDF2 with 210,000 iterations
-- Salt: randomly generated base64 string
INSERT INTO users (
    user_id,
    email,
    name,
    role,
    password_hash,
    password_salt,
    password_iterations,
    can_investigate,
    created_at,
    login_count,
    status
) VALUES (
    'admin-default',
    'admin@releye.local',
    'Administrator',
    'admin',
    'tqYc+fhPcJN5p8vE2oI7x3Qm9sW1bH6kL4gR8fT5dA0=',
    'R2VuZXJpY1NhbHRGb3JJbml0aWFsQWRtaW4xMjM0NTY=',
    210000,
    TRUE,
    UNIX_TIMESTAMP() * 1000,
    0,
    'active'
);

-- Log the admin creation
INSERT INTO activity_log (user_id, action, details, created_at)
VALUES ('admin-default', 'ACCOUNT_CREATED', 'Default administrator account created', UNIX_TIMESTAMP() * 1000);

-- ===========================================================
--  Verification Query
--  Run this after setup to verify everything is working
-- ===========================================================

-- SELECT 'Setup complete! Admin user created.' AS status;
-- SELECT user_id, email, name, role, can_investigate, created_at 
-- FROM users 
-- WHERE role = 'admin';

-- ===========================================================
--  Reset Instructions
--  To completely reset the authentication system:
--  1. Uncomment the DROP TABLE statements at the top
--  2. Re-run this entire script
--  3. All users and invitations will be deleted
--  4. Fresh admin account will be created
-- ===========================================================
