// controllers/userController.js
const bcrypt = require('bcryptjs');
const pool   = require('../config/db');

const SELECT_USERS = `
  SELECT u.id, u.name, u.email, u.role, u.avatar, u.contact,
         u.farm_location AS farmLocation, u.farm_size AS farmSize,
         u.created_at,
         b.name AS barangay, u.barangay_id
  FROM users u
  LEFT JOIN barangays b ON b.id = u.barangay_id
`;

// ── GET /api/users ──────────────────────────────────────────────
// Accessible by all authenticated users (farmers need this for Farmers List)
exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query(SELECT_USERS + ' ORDER BY u.created_at ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

// ── GET /api/users/:id ─────────────────────────────────────────
exports.getOne = async (req, res) => {
  try {
    const [rows] = await pool.query(SELECT_USERS + ' WHERE u.id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'User not found.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

// ── POST /api/users ─────────────────────────────────────────────
// Used two ways:
//   1. Admin adds a system user (email + password required)
//   2. registerFarmer from AddEntry (name + contact + barangay only, no email/password)
exports.create = async (req, res) => {
  try {
    const { name, email, password, role, barangay, contact, farmLocation, farmSize } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Farmer name is required.' });
    }

    // If email provided, check it's not a duplicate
    if (email && email.trim()) {
      const [existing] = await pool.query(
        'SELECT id FROM users WHERE email = ?', [email.trim()]
      );
      if (existing.length) return res.status(409).json({ error: 'Email already in use.' });
    }

    // Resolve barangay id (optional — farmers from AddEntry pass barangay name)
    let barangayId = null;
    if (barangay) {
      const [b] = await pool.query('SELECT id FROM barangays WHERE name = ?', [barangay]);
      barangayId = b[0]?.id ?? null;
    }

    // Auto-generate next user id
    const [countRows] = await pool.query('SELECT COUNT(*) AS cnt FROM users');
    const newId = `U${String(countRows[0].cnt + 1).padStart(3, '0')}`;

    // Hash password only if provided (system users); farmers have no password
    let hash = null;
    if (password && password.trim()) {
      hash = await bcrypt.hash(password.trim(), 10);
    } else if (email && email.trim()) {
      // Has email but no password — shouldn't happen in admin UI, but guard anyway
      return res.status(400).json({ error: 'Password is required when creating a login account.' });
    }

    await pool.query(
      `INSERT INTO users
         (id, name, email, password, role, barangay_id, avatar, contact, farm_location, farm_size)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newId,
        name.trim(),
        email?.trim() || null,
        hash,
        role || 'farmer',
        barangayId,
        name.trim()[0].toUpperCase(),
        contact?.trim() || null,
        farmLocation?.trim() || null,
        farmSize?.trim() || null,
      ]
    );

    // Audit — use system/addentry actor if available
    const actorId   = req.user?.id   || newId;
    const actorName = req.user?.name || name.trim();
    await pool.query(
      'INSERT INTO audit_log (user_id, user_name, action) VALUES (?, ?, ?)',
      [actorId, actorName, `Added farmer: ${name.trim()}`]
    );

    const [newUser] = await pool.query(SELECT_USERS + ' WHERE u.id = ?', [newId]);
    res.status(201).json(newUser[0]);
  } catch (err) {
    console.error('create user:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

// ── PATCH /api/users/:id ────────────────────────────────────────
// Handles both profile update (own account) and farmer info update (from registerFarmer)
exports.update = async (req, res) => {
  try {
    const { name, contact, password, currentPassword, farmLocation, farmSize } = req.body;
    const userId = req.params.id;

    // Users can only edit themselves; admins can edit anyone
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied.' });
    }

    // Password change
    if (password) {
      if (!currentPassword) return res.status(400).json({ error: 'Current password required.' });
      const [[u]] = await pool.query('SELECT password FROM users WHERE id = ?', [userId]);
      if (!u.password) return res.status(400).json({ error: 'This account has no password set.' });
      const match = await bcrypt.compare(currentPassword, u.password);
      if (!match) return res.status(401).json({ error: 'Current password is incorrect.' });
      const hash = await bcrypt.hash(password, 10);
      await pool.query('UPDATE users SET password = ? WHERE id = ?', [hash, userId]);
    }

    // Profile + farm fields
    const fields = [];
    const vals   = [];

    if (name) {
      fields.push('name = ?');   vals.push(name.trim());
      fields.push('avatar = ?'); vals.push(name.trim()[0].toUpperCase());
    }
    if (contact !== undefined) {
      fields.push('contact = ?'); vals.push(contact?.trim() || null);
    }
    if (farmLocation !== undefined) {
      fields.push('farm_location = ?'); vals.push(farmLocation?.trim() || null);
    }
    if (farmSize !== undefined) {
      fields.push('farm_size = ?'); vals.push(farmSize?.trim() || null);
    }

    if (fields.length) {
      vals.push(userId);
      await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, vals);
    }

    await pool.query(
      'INSERT INTO audit_log (user_id, user_name, action) VALUES (?, ?, ?)',
      [req.user.id, req.user.name, `Updated profile: ${userId}`]
    );

    const [updated] = await pool.query(SELECT_USERS + ' WHERE u.id = ?', [userId]);
    res.json(updated[0]);
  } catch (err) {
    console.error('update user:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

// ── DELETE /api/users/:id  (admin only) ────────────────────────
exports.remove = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name, role FROM users WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'User not found.' });
    if (rows[0].role === 'admin') return res.status(403).json({ error: 'Cannot delete admin accounts.' });

    await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);

    await pool.query(
      'INSERT INTO audit_log (user_id, user_name, action) VALUES (?, ?, ?)',
      [req.user.id, req.user.name, `Deleted user: ${rows[0].name}`]
    );

    res.json({ ok: true, id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};