// controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const pool   = require('../config/db');

// Helper: build the token payload the frontend needs
function makeToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name, role: user.role, barangayId: user.barangay_id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// Helper: strip password before sending to client
function safeUser(u) {
  const { password, ...rest } = u;
  return rest;
}

// POST /api/auth/login
// Body: { email, password, portal }   portal = 'admin' | 'user'
exports.login = async (req, res) => {
  try {
    const { email, password, portal } = req.body;
    if (!email || !password) {
      return res.status(400).json({ ok: false, error: 'Email and password are required.' });
    }

    // Fetch user + barangay name in one query
    const [rows] = await pool.query(
      `SELECT u.*, b.name AS barangay
       FROM users u
       LEFT JOIN barangays b ON b.id = u.barangay_id
       WHERE u.email = ?
       LIMIT 1`,
      [email]
    );

    if (!rows.length) {
      return res.status(401).json({ ok: false, error: 'Invalid email or password.' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ ok: false, error: 'Invalid email or password.' });
    }

    // Portal access check — mirrors useAppState.js logic
    if (portal === 'admin' && user.role !== 'admin') {
      return res.status(403).json({ ok: false, error: 'This account does not have admin access.' });
    }
    if (portal === 'user' && user.role === 'admin') {
      return res.status(403).json({ ok: false, error: 'Please use the Admin Portal to sign in.' });
    }

    // Audit
    await pool.query(
      'INSERT INTO audit_log (user_id, user_name, action) VALUES (?, ?, ?)',
      [user.id, user.name, 'Logged in']
    );

    res.json({ ok: true, token: makeToken(user), user: safeUser(user) });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ ok: false, error: 'Server error.' });
  }
};

// POST /api/auth/signup
// Body: { name, email, password, contact, barangay }
exports.signup = async (req, res) => {
  try {
    const { name, email, password, contact, barangay } = req.body;

    if (!name || !email || !password || !barangay) {
      return res.status(400).json({ ok: false, error: 'All fields are required.' });
    }

    // Check duplicate email
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE email = ? LIMIT 1', [email]
    );
    if (existing.length) {
      return res.status(409).json({ ok: false, error: 'An account with this email already exists.' });
    }

    // Resolve barangay id
    const [bgyRows] = await pool.query(
      'SELECT id FROM barangays WHERE name = ? LIMIT 1', [barangay]
    );
    if (!bgyRows.length) {
      return res.status(400).json({ ok: false, error: 'Invalid barangay.' });
    }

    // Generate user id  (U006, U007, …)
    const [countRows] = await pool.query('SELECT COUNT(*) AS cnt FROM users');
    const newId = `U${String(countRows[0].cnt + 1).padStart(3, '0')}`;

    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      `INSERT INTO users (id, name, email, password, role, barangay_id, avatar, contact)
       VALUES (?, ?, ?, ?, 'farmer', ?, ?, ?)`,
      [newId, name.trim(), email.trim(), hash, bgyRows[0].id, name.trim()[0].toUpperCase(), contact || null]
    );

    res.status(201).json({ ok: true, message: 'Account created. You can now sign in.' });
  } catch (err) {
    console.error('signup error:', err);
    res.status(500).json({ ok: false, error: 'Server error.' });
  }
};