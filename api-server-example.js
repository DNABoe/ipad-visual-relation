const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'https://releye.boestad.com',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

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

app.get('/api/health', (req, res) => {
  apiResponse(res, { status: 'ok' });
});

app.get('/api/auth/first-time', async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) FROM users WHERE role = $1', ['admin']);
    const hasAdmin = parseInt(result.rows[0].count) > 0;
    apiResponse(res, { isFirstTime: !hasAdmin });
  } catch (error) {
    apiError(res, error);
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const result = await pool.query(
      'SELECT * FROM users WHERE LOWER(email) = LOWER($1)',
      [email]
    );
    
    if (result.rows.length === 0) {
      return apiError(res, new Error('Invalid credentials'), 401);
    }
    
    const user = result.rows[0];
    const passwordHash = {
      hash: user.password_hash_hash,
      salt: user.password_hash_salt,
      iterations: user.password_hash_iterations
    };
    
    const crypto = require('crypto');
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
      return apiError(res, new Error('Invalid credentials'), 401);
    }
    
    await pool.query(
      'UPDATE users SET last_login = $1, login_count = login_count + 1 WHERE user_id = $2',
      [Date.now(), user.user_id]
    );
    
    const updatedUser = await pool.query('SELECT * FROM users WHERE user_id = $1', [user.user_id]);
    
    apiResponse(res, formatUser(updatedUser.rows[0]));
  } catch (error) {
    apiError(res, error);
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
    apiResponse(res, result.rows.map(formatUser));
  } catch (error) {
    apiError(res, error);
  }
});

app.get('/api/users/email/:email', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE LOWER(email) = LOWER($1)',
      [req.params.email]
    );
    
    if (result.rows.length === 0) {
      return apiError(res, new Error('User not found'), 404);
    }
    
    apiResponse(res, formatUser(result.rows[0]));
  } catch (error) {
    apiError(res, error);
  }
});

app.get('/api/users/:userId', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE user_id = $1', [req.params.userId]);
    
    if (result.rows.length === 0) {
      return apiError(res, new Error('User not found'), 404);
    }
    
    apiResponse(res, formatUser(result.rows[0]));
  } catch (error) {
    apiError(res, error);
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const user = req.body;
    
    const existing = await pool.query(
      'SELECT * FROM users WHERE LOWER(email) = LOWER($1)',
      [user.email]
    );
    
    if (existing.rows.length > 0) {
      return apiError(res, new Error('User with this email already exists'), 409);
    }
    
    await pool.query(
      `INSERT INTO users (
        user_id, email, name, role,
        password_hash_hash, password_hash_salt, password_hash_iterations,
        created_at, login_count, can_investigate,
        encrypted_api_key, api_key_salt, last_login
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
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
    
    const result = await pool.query('SELECT * FROM users WHERE user_id = $1', [user.userId]);
    apiResponse(res, formatUser(result.rows[0]), 201);
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
    let paramIndex = 1;
    
    const allowedFields = ['name', 'role', 'loginCount', 'canInvestigate', 'lastLogin', 'encryptedApiKey', 'apiKeySalt'];
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
        fields.push(`${dbField} = $${paramIndex}`);
        values.push(updates[key]);
        paramIndex++;
      }
    }
    
    if (updates.passwordHash) {
      fields.push(`password_hash_hash = $${paramIndex}`);
      values.push(updates.passwordHash.hash);
      paramIndex++;
      
      fields.push(`password_hash_salt = $${paramIndex}`);
      values.push(updates.passwordHash.salt);
      paramIndex++;
      
      fields.push(`password_hash_iterations = $${paramIndex}`);
      values.push(updates.passwordHash.iterations);
      paramIndex++;
    }
    
    if (fields.length === 0) {
      return apiResponse(res, {});
    }
    
    values.push(userId);
    const query = `UPDATE users SET ${fields.join(', ')} WHERE user_id = $${paramIndex}`;
    
    await pool.query(query, values);
    apiResponse(res, {});
  } catch (error) {
    apiError(res, error);
  }
});

app.delete('/api/users/:userId', async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE user_id = $1', [req.params.userId]);
    apiResponse(res, {});
  } catch (error) {
    apiError(res, error);
  }
});

app.get('/api/invites', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM invites ORDER BY created_at DESC');
    apiResponse(res, result.rows.map(formatInvite));
  } catch (error) {
    apiError(res, error);
  }
});

app.get('/api/invites/:token', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM invites WHERE token = $1', [req.params.token]);
    
    if (result.rows.length === 0) {
      return apiError(res, new Error('Invite not found'), 404);
    }
    
    apiResponse(res, formatInvite(result.rows[0]));
  } catch (error) {
    apiError(res, error);
  }
});

app.post('/api/invites', async (req, res) => {
  try {
    const invite = req.body;
    
    await pool.query(
      `INSERT INTO invites (
        invite_id, email, name, role, token,
        created_at, expires_at, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
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
    
    const result = await pool.query('SELECT * FROM invites WHERE invite_id = $1', [invite.inviteId]);
    apiResponse(res, formatInvite(result.rows[0]), 201);
  } catch (error) {
    apiError(res, error);
  }
});

app.delete('/api/invites/:token', async (req, res) => {
  try {
    await pool.query('DELETE FROM invites WHERE token = $1', [req.params.token]);
    apiResponse(res, {});
  } catch (error) {
    apiError(res, error);
  }
});

app.post('/api/invites/cleanup', async (req, res) => {
  try {
    await pool.query('DELETE FROM invites WHERE expires_at < $1', [Date.now()]);
    apiResponse(res, {});
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
    canInvestigate: row.can_investigate,
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

app.listen(PORT, () => {
  console.log(`RelEye API server running on port ${PORT}`);
});
