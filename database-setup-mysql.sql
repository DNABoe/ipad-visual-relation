-- ===========================================================
--  Schema for RelEye (using existing Spaceship DB)
--  NOTE: Select the correct database in phpMyAdmin before import
-- ===========================================================

-- ===========================================================
--  Tables
-- ===========================================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Groups table (for visual / logical grouping of persons)
CREATE TABLE IF NOT EXISTS groups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    color VARCHAR(20) DEFAULT '#FFFFFF',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Persons table
CREATE TABLE IF NOT EXISTS persons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    position VARCHAR(255),
    attitude ENUM('positive', 'neutral', 'negative', 'uncategorized') DEFAULT 'uncategorized',
    importance TINYINT NOT NULL DEFAULT 3,
    picture_url VARCHAR(255),
    group_id INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_person_group
        FOREIGN KEY (group_id) REFERENCES groups(id)
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Connections between persons
CREATE TABLE IF NOT EXISTS connections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    person_a INT NOT NULL,
    person_b INT NOT NULL,
    weight ENUM('low', 'medium', 'high') DEFAULT 'medium',
    direction ENUM('a_to_b', 'b_to_a', 'both') DEFAULT 'both',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_conn_person_a
        FOREIGN KEY (person_a) REFERENCES persons(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_conn_person_b
        FOREIGN KEY (person_b) REFERENCES persons(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Optional indexes for faster lookups
CREATE INDEX idx_person_a ON connections(person_a);
CREATE INDEX idx_person_b ON connections(person_b);

-- Settings table (for app-level config)
CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(255) NOT NULL UNIQUE,
    setting_value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================================
--  Default admin user (admin/admin)
--  Change password after first login.
--  (bcrypt hash of "admin")
-- ===========================================================

INSERT INTO users (username, password_hash, role)
VALUES (
    'admin',
    '$2y$10$BvvzqVCMgeI1rwreqM21HutPw6UCM8ZQytzR0n5a3uR6ANqt44P5S',
    'admin'
)
ON DUPLICATE KEY UPDATE username = username;
