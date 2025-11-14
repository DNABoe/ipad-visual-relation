require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'releye_user',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'releye',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
});

pool.on('connection', (connection) => {
  console.log('New database connection established');
});

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'https://releye.boestad.com',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

function apiResponse(res, data, statusCode = 200) {
  res.status(statusCode).json({
    success: true,
    data
  });
}

function apiError(res, error, statusCode = 500) {
  console.error('API Error:', error);
  res.status(statusCode).json({
    success: false,
    error: error.message || 'Internal server error'
  });
}

async function logActivity(userId, action, details = null, ipAddress = null) {
  try {
    await pool.execute(
      'INSERT INTO activity_log (user_id, action, details, ip_address, created_at) VALUES (?, ?, ?, ?, ?)',
      [userId, action, details, ipAddress, Date.now()]
    );
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}

app.get('/api/health', (req, res) => {
  apiResponse(res, { 
    status: 'ok', 
    timestamp: Date.now(),
    version: '1.0.0',
    database: 'mysql'
  });
});

app.get('/api/auth/first-time', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT COUNT(*) as count FROM users WHERE role = ?', 
      ['admin']
    );
    const hasAdmin = parseInt(rows[0].count) > 0;
    apiResponse(res, { isFirstTime: !hasAdmin });
  } catch (error) {
    apiError(res, error);
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return apiError(res, new Error('Email and password are required'), 400);
    }
    
    let query, params;
    
    if (email.toLowerCase() === 'admin') {
      query = 'SELECT * FROM users WHERE role = ?';
      params = ['admin'];
    } else {
      query = 'SELECT * FROM users WHERE LOWER(email) = LOWER(?)';
      params = [email];
    }
    
    const [rows] = await pool.execute(query, params);
    
    if (rows.length === 0) {
      await logActivity(null, 'login_failed', `Email: ${email}`, req.ip);
      return apiError(res, new Error('Invalid credentials'), 401);
    }
    
    const user = rows[0];
    const passwordHash = {
      hash: user.password_hash_hash,
      salt: user.password_hash_salt,
      iterations: user.password_hash_iterations
    };
    
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    const saltBuffer = Buffer.from(passwordHash.salt, 'base64');
    
    const derivedBits = crypto.pbkdf2Sync(
      passwordBuffer,
      saltBuffer,
      passwordHash.iterations,
      32,
      'sha256'
    );
    
    const computedHash = derivedBits.toString('base64');
    
    if (computedHash !== passwordHash.hash) {
      await logActivity(user.user_id, 'login_failed', 'Invalid password', req.ip);
      return apiError(res, new Error('Invalid credentials'), 401);
    }
    
    await pool.execute(
      'UPDATE users SET last_login = ?, login_count = login_count + 1 WHERE user_id = ?',
      [Date.now(), user.user_id]
    );
    
    await logActivity(user.user_id, 'login_success', null, req.ip);
    
    const [updatedRows] = await pool.execute('SELECT * FROM users WHERE user_id = ?', [user.user_id]);
    
    apiResponse(res, formatUser(updatedRows[0]));
  } catch (error) {
    apiError(res, error);
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM users ORDER BY created_at DESC');
    apiResponse(res, rows.map(formatUser));
  } catch (error) {
    apiError(res, error);
  }
});

app.get('/api/users/email/:email', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE LOWER(email) = LOWER(?)',
      [req.params.email]
    );
    
    if (rows.length === 0) {
      return apiError(res, new Error('User not found'), 404);
    }
    
    apiResponse(res, formatUser(rows[0]));
  } catch (error) {
    apiError(res, error);
  }
});

app.get('/api/users/:userId', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM users WHERE user_id = ?', [req.params.userId]);
    
    if (rows.length === 0) {
      return apiError(res, new Error('User not found'), 404);
    }
    
    apiResponse(res, formatUser(rows[0]));
  } catch (error) {
    apiError(res, error);
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const user = req.body;
    
    if (!user.email || !user.name || !user.userId || !user.passwordHash) {
      return apiError(res, new Error('Missing required fields'), 400);
    }
    
    const [existing] = await pool.execute(
      'SELECT * FROM users WHERE LOWER(email) = LOWER(?)',
      [user.email]
    );
    
    if (existing.length > 0) {
      return apiError(res, new Error('User with this email already exists'), 409);
    }
    
    await pool.execute(
      `INSERT INTO users (
        user_id, email, name, role,
        password_hash_hash, password_hash_salt, password_hash_iterations,
        created_at, login_count, can_investigate,
        encrypted_api_key, api_key_salt, last_login
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user.userId,
        user.email.toLowerCase(),
        user.name,
        user.role,
        user.passwordHash.hash,
        user.passwordHash.salt,
        user.passwordHash.iterations,
        user.createdAt,
        user.loginCount || 0,
        user.canInvestigate || false,
        user.encryptedApiKey || null,
        user.apiKeySalt || null,
        user.lastLogin || null
      ]
    );
    
    await logActivity(user.userId, 'user_created', `User: ${user.email}`, req.ip);
    
    const [rows] = await pool.execute('SELECT * FROM users WHERE user_id = ?', [user.userId]);
    apiResponse(res, formatUser(rows[0]), 201);
  } catch (error) {
    apiError(res, error);
  }
});

app.put('/api/users/:userId', async (req, res) => {
  try {
    const updates = req.body;
    const userId = req.params.userId;
    
    const fields = [];
    const values = [];
    
    const fieldMap = {
      'name': 'name',
      'role': 'role',
      'loginCount': 'login_count',
      'canInvestigate': 'can_investigate',
      'lastLogin': 'last_login',
      'encryptedApiKey': 'encrypted_api_key',
      'apiKeySalt': 'api_key_salt'
    };
    
    for (const [key, dbField] of Object.entries(fieldMap)) {
      if (updates[key] !== undefined) {
        fields.push(`${dbField} = ?`);
        values.push(updates[key]);
      }
    }
    
    if (updates.passwordHash) {
      fields.push('password_hash_hash = ?');
      values.push(updates.passwordHash.hash);
      
      fields.push('password_hash_salt = ?');
      values.push(updates.passwordHash.salt);
      
      fields.push('password_hash_iterations = ?');
      values.push(updates.passwordHash.iterations);
    }
    
    if (fields.length === 0) {
      return apiResponse(res, {});
    }
    
    values.push(userId);
    const query = `UPDATE users SET ${fields.join(', ')} WHERE user_id = ?`;
    
    await pool.execute(query, values);
    await logActivity(userId, 'user_updated', null, req.ip);
    
    apiResponse(res, {});
  } catch (error) {
    apiError(res, error);
  }
});

app.delete('/api/users/:userId', async (req, res) => {
  try {
    const [user] = await pool.execute('SELECT email FROM users WHERE user_id = ?', [req.params.userId]);
    
    await pool.execute('DELETE FROM users WHERE user_id = ?', [req.params.userId]);
    
    if (user.length > 0) {
      await logActivity(req.params.userId, 'user_deleted', `Email: ${user[0].email}`, req.ip);
    }
    
    apiResponse(res, {});
  } catch (error) {
    apiError(res, error);
  }
});

app.get('/api/invites', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM invites ORDER BY created_at DESC');
    apiResponse(res, rows.map(formatInvite));
  } catch (error) {
    apiError(res, error);
  }
});

app.get('/api/invites/:token', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM invites WHERE token = ?', [req.params.token]);
    
    if (rows.length === 0) {
      return apiError(res, new Error('Invite not found or expired'), 404);
    }
    
    const invite = rows[0];
    
    if (invite.expires_at < Date.now()) {
      await pool.execute('DELETE FROM invites WHERE token = ?', [req.params.token]);
      return apiError(res, new Error('Invite has expired'), 410);
    }
    
    apiResponse(res, formatInvite(invite));
  } catch (error) {
    apiError(res, error);
  }
});

app.post('/api/invites', async (req, res) => {
  try {
    const invite = req.body;
    
    if (!invite.email || !invite.name || !invite.inviteId || !invite.token) {
      return apiError(res, new Error('Missing required fields'), 400);
    }
    
    const [existingUser] = await pool.execute(
      'SELECT * FROM users WHERE LOWER(email) = LOWER(?)',
      [invite.email]
    );
    
    if (existingUser.length > 0) {
      return apiError(res, new Error('User with this email already exists'), 409);
    }
    
    const [existingInvite] = await pool.execute(
      'SELECT * FROM invites WHERE LOWER(email) = LOWER(?)',
      [invite.email]
    );
    
    if (existingInvite.length > 0) {
      await pool.execute('DELETE FROM invites WHERE LOWER(email) = LOWER(?)', [invite.email]);
    }
    
    await pool.execute(
      `INSERT INTO invites (
        invite_id, email, name, role, token,
        created_at, expires_at, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        invite.inviteId,
        invite.email.toLowerCase(),
        invite.name,
        invite.role,
        invite.token,
        invite.createdAt,
        invite.expiresAt,
        invite.createdBy
      ]
    );
    
    await logActivity(invite.createdBy, 'invite_created', `Email: ${invite.email}`, req.ip);
    
    const [rows] = await pool.execute('SELECT * FROM invites WHERE invite_id = ?', [invite.inviteId]);
    apiResponse(res, formatInvite(rows[0]), 201);
  } catch (error) {
    apiError(res, error);
  }
});

app.delete('/api/invites/:token', async (req, res) => {
  try {
    const [invite] = await pool.execute('SELECT email FROM invites WHERE token = ?', [req.params.token]);
    
    await pool.execute('DELETE FROM invites WHERE token = ?', [req.params.token]);
    
    if (invite.length > 0) {
      await logActivity(null, 'invite_revoked', `Email: ${invite[0].email}`, req.ip);
    }
    
    apiResponse(res, {});
  } catch (error) {
    apiError(res, error);
  }
});

app.post('/api/invites/cleanup', async (req, res) => {
  try {
    const [result] = await pool.execute('DELETE FROM invites WHERE expires_at < ?', [Date.now()]);
    await logActivity(null, 'invites_cleaned', `Removed: ${result.affectedRows}`, req.ip);
    apiResponse(res, { cleaned: result.affectedRows });
  } catch (error) {
    apiError(res, error);
  }
});

app.get('/api/activity', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    
    const [rows] = await pool.execute(
      'SELECT * FROM activity_log ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );
    
    apiResponse(res, rows);
  } catch (error) {
    apiError(res, error);
  }
});

app.post('/api/admin/reset', async (req, res) => {
  try {
    const { confirmToken } = req.body;
    
    if (confirmToken !== 'RESET_ALL_DATA_CONFIRM') {
      return apiError(res, new Error('Invalid confirmation token'), 400);
    }
    
    await pool.execute('DELETE FROM sessions');
    await pool.execute('DELETE FROM invites');
    await pool.execute('DELETE FROM users');
    
    await logActivity(null, 'system_reset', 'All data cleared', req.ip);
    
    apiResponse(res, { message: 'All data has been reset' });
  } catch (error) {
    apiError(res, error);
  }
});

function formatUser(row) {
  return {
    userId: row.user_id,
    email: row.email,
    name: row.name,
    role: row.role,
    passwordHash: {
      hash: row.password_hash_hash,
      salt: row.password_hash_salt,
      iterations: row.password_hash_iterations
    },
    createdAt: parseInt(row.created_at),
    lastLogin: row.last_login ? parseInt(row.last_login) : undefined,
    loginCount: row.login_count,
    canInvestigate: Boolean(row.can_investigate),
    encryptedApiKey: row.encrypted_api_key || undefined,
    apiKeySalt: row.api_key_salt || undefined
  };
}

function formatInvite(row) {
  return {
    inviteId: row.invite_id,
    email: row.email,
    name: row.name,
    role: row.role,
    token: row.token,
    createdAt: parseInt(row.created_at),
    expiresAt: parseInt(row.expires_at),
    createdBy: row.created_by
  };
}

app.use((err, req, res, next) => {
  apiError(res, err);
});

async function startServer() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL database connected successfully');
    connection.release();
    
    app.listen(PORT, () => {
      console.log(`✅ RelEye API server running on port ${PORT}`);
      console.log(`✅ Database: MySQL`);
      console.log(`✅ CORS Origin: ${process.env.CORS_ORIGIN || 'https://releye.boestad.com'}`);
      console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  await pool.end();
  process.exit(0);
});

startServer();
