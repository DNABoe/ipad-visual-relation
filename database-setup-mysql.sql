-- RelEye Cloud Authentication Database Setup
-- MySQL Schema

-- Create database
CREATE DATABASE IF NOT EXISTS releye CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE releye;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  user_id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
  password_hash_hash VARCHAR(512) NOT NULL,
  password_hash_salt VARCHAR(512) NOT NULL,
  password_hash_iterations INT NOT NULL,
  created_at BIGINT NOT NULL,
  last_login BIGINT NULL,
  login_count INT DEFAULT 0,
  can_investigate BOOLEAN DEFAULT FALSE,
  encrypted_api_key TEXT NULL,
  api_key_salt VARCHAR(512) NULL,
  INDEX idx_users_email (email(255)),
  INDEX idx_users_role (role),
  INDEX idx_users_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create invites table
CREATE TABLE IF NOT EXISTS invites (
  invite_id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
  token VARCHAR(512) UNIQUE NOT NULL,
  created_at BIGINT NOT NULL,
  expires_at BIGINT NOT NULL,
  created_by VARCHAR(255) NOT NULL,
  INDEX idx_invites_token (token(255)),
  INDEX idx_invites_email (email(255)),
  INDEX idx_invites_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create sessions table (for future session management)
CREATE TABLE IF NOT EXISTS sessions (
  session_id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  created_at BIGINT NOT NULL,
  expires_at BIGINT NOT NULL,
  last_activity BIGINT NOT NULL,
  ip_address VARCHAR(45) NULL,
  user_agent TEXT NULL,
  INDEX idx_sessions_user_id (user_id),
  INDEX idx_sessions_expires_at (expires_at),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create activity log table
CREATE TABLE IF NOT EXISTS activity_log (
  log_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(255) NULL,
  action VARCHAR(100) NOT NULL,
  details TEXT NULL,
  ip_address VARCHAR(45) NULL,
  created_at BIGINT NOT NULL,
  INDEX idx_activity_user_id (user_id),
  INDEX idx_activity_created_at (created_at),
  INDEX idx_activity_action (action),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create stored procedure to clean up expired invites
DELIMITER //
CREATE PROCEDURE cleanup_expired_invites()
BEGIN
  DELETE FROM invites WHERE expires_at < UNIX_TIMESTAMP(NOW()) * 1000;
END //
DELIMITER ;

-- Create stored procedure to clean up expired sessions
DELIMITER //
CREATE PROCEDURE cleanup_expired_sessions()
BEGIN
  DELETE FROM sessions WHERE expires_at < UNIX_TIMESTAMP(NOW()) * 1000;
END //
DELIMITER ;

-- Create event scheduler to auto-cleanup (runs daily at midnight)
SET GLOBAL event_scheduler = ON;

CREATE EVENT IF NOT EXISTS cleanup_expired_invites_daily
ON SCHEDULE EVERY 1 DAY
STARTS (TIMESTAMP(CURRENT_DATE) + INTERVAL 1 DAY)
DO CALL cleanup_expired_invites();

CREATE EVENT IF NOT EXISTS cleanup_expired_sessions_daily
ON SCHEDULE EVERY 1 DAY
STARTS (TIMESTAMP(CURRENT_DATE) + INTERVAL 1 DAY)
DO CALL cleanup_expired_sessions();
