-- RelEye Cloud Authentication Database Setup
-- PostgreSQL Schema

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  user_id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
  password_hash_hash VARCHAR(512) NOT NULL,
  password_hash_salt VARCHAR(512) NOT NULL,
  password_hash_iterations INTEGER NOT NULL,
  created_at BIGINT NOT NULL,
  last_login BIGINT,
  login_count INTEGER DEFAULT 0,
  can_investigate BOOLEAN DEFAULT FALSE,
  encrypted_api_key TEXT,
  api_key_salt VARCHAR(512)
);

-- Create indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_email ON users(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Create invites table
CREATE TABLE IF NOT EXISTS invites (
  invite_id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
  token VARCHAR(512) UNIQUE NOT NULL,
  created_at BIGINT NOT NULL,
  expires_at BIGINT NOT NULL,
  created_by VARCHAR(255) NOT NULL
);

-- Create indexes for invites table
CREATE INDEX IF NOT EXISTS idx_invites_token ON invites(token);
CREATE INDEX IF NOT EXISTS idx_invites_email ON invites(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_invites_expires_at ON invites(expires_at);

-- Optional: Create a function to automatically clean up expired invites
CREATE OR REPLACE FUNCTION cleanup_expired_invites()
RETURNS void AS $$
BEGIN
  DELETE FROM invites WHERE expires_at < EXTRACT(EPOCH FROM NOW()) * 1000;
END;
$$ LANGUAGE plpgsql;

-- Optional: Create a scheduled job to run cleanup daily
-- Note: This requires pg_cron extension
-- SELECT cron.schedule('cleanup-expired-invites', '0 0 * * *', 'SELECT cleanup_expired_invites()');
