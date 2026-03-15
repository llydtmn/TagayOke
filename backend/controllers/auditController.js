// controllers/auditController.js
const pool = require('../config/db');

// GET /api/audit  — admin only
exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, user_id AS userId, user_name AS userName, action, created_at AS timestamp FROM audit_log ORDER BY created_at DESC LIMIT 500'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};