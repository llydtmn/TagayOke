// controllers/lookupController.js
// Serves the static reference lists so the frontend never needs
// to hard-code constants.js again.
const pool = require('../config/db');

// GET /api/barangays
exports.getBarangays = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name FROM barangays ORDER BY name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

// GET /api/crop-types
exports.getCropTypes = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name, emoji FROM crop_types ORDER BY name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};