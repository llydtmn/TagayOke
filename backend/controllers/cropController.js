// controllers/cropController.js
// All CRUD for crop_entries.
// Every query returns rows shaped like the frontend's SEED_CROPS objects
// so the React components need zero changes.

const pool = require('../config/db');

// Shared SELECT — returns objects matching the frontend shape
const SELECT_CROPS = `
  SELECT
    e.id,
    ct.name        AS crop,
    b.name         AS barangay,
    e.farmer_name  AS farmer,
    e.farmer_id    AS farmerId,
    e.planted,
    e.expected_harvest AS expectedHarvest,
    e.status,
    e.notes,
    e.created_at   AS createdAt
  FROM crop_entries e
  JOIN crop_types ct ON ct.id = e.crop_type_id
  JOIN barangays  b  ON b.id  = e.barangay_id
`;

// ── GET /api/crops ──────────────────────────────────────────────
// Query params: barangay, crop, status, search, farmerId
exports.getAll = async (req, res) => {
  try {
    const { barangay, crop, status, search, farmerId } = req.query;
    let where = [];
    let params = [];

    if (barangay)  { where.push('b.name = ?');           params.push(barangay); }
    if (crop)      { where.push('ct.name = ?');          params.push(crop); }
    if (status)    { where.push('e.status = ?');         params.push(status); }
    if (farmerId)  { where.push('e.farmer_id = ?');      params.push(farmerId); }
    if (search) {
      where.push('(ct.name LIKE ? OR e.farmer_name LIKE ? OR b.name LIKE ? OR e.id LIKE ?)');
      const q = `%${search}%`;
      params.push(q, q, q, q);
    }

    const sql = SELECT_CROPS + (where.length ? ' WHERE ' + where.join(' AND ') : '') + ' ORDER BY e.created_at DESC';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('getAll crops:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

// ── GET /api/crops/:id ─────────────────────────────────────────
exports.getOne = async (req, res) => {
  try {
    const [rows] = await pool.query(SELECT_CROPS + ' WHERE e.id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Entry not found.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

// ── POST /api/crops ─────────────────────────────────────────────
// Body: { crop, barangay, farmer, farmerId, planted, expectedHarvest, notes }
exports.create = async (req, res) => {
  try {
    const { crop, barangay, farmer, farmerId, planted, expectedHarvest, notes } = req.body;

    if (!crop || !barangay || !farmer || !planted || !expectedHarvest) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    // Resolve FK ids
    const [[cropRow]] = await pool.query('SELECT id FROM crop_types WHERE name = ?', [crop]);
    const [[bgyRow]]  = await pool.query('SELECT id FROM barangays  WHERE name = ?', [barangay]);
    if (!cropRow) return res.status(400).json({ error: `Unknown crop type: ${crop}` });
    if (!bgyRow)  return res.status(400).json({ error: `Unknown barangay: ${barangay}` });

    // Auto-generate CF-xxx id
    const [maxRow] = await pool.query(
      `SELECT id FROM crop_entries ORDER BY CAST(SUBSTRING(id,4) AS UNSIGNED) DESC LIMIT 1`
    );
    const lastNum = maxRow.length ? parseInt(maxRow[0].id.replace('CF-', ''), 10) : 0;
    const newId   = `CF-${String(lastNum + 1).padStart(3, '0')}`;

    await pool.query(
      `INSERT INTO crop_entries
         (id, crop_type_id, barangay_id, farmer_name, farmer_id, planted, expected_harvest, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'growing', ?)`,
      [newId, cropRow.id, bgyRow.id, farmer, farmerId || req.user.id, planted, expectedHarvest, notes || null]
    );

    // Audit
    await pool.query(
      'INSERT INTO audit_log (user_id, user_name, action) VALUES (?, ?, ?)',
      [req.user.id, req.user.name, `Added crop: ${crop}`]
    );

    const [[created]] = await pool.query(SELECT_CROPS + ' WHERE e.id = ?', [newId]);
    res.status(201).json(created);
  } catch (err) {
    console.error('create crop:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

// ── PATCH /api/crops/:id/toggle ────────────────────────────────
// Flips status between growing ↔ harvested
exports.toggleStatus = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, status FROM crop_entries WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Entry not found.' });

    const newStatus = rows[0].status === 'harvested' ? 'growing' : 'harvested';
    await pool.query('UPDATE crop_entries SET status = ? WHERE id = ?', [newStatus, req.params.id]);

    await pool.query(
      'INSERT INTO audit_log (user_id, user_name, action) VALUES (?, ?, ?)',
      [req.user.id, req.user.name, `Marked CF entry ${req.params.id} as ${newStatus}`]
    );

    res.json({ ok: true, id: req.params.id, status: newStatus });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

// ── DELETE /api/crops/:id ───────────────────────────────────────
exports.remove = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT e.id, ct.name AS crop FROM crop_entries e JOIN crop_types ct ON ct.id = e.crop_type_id WHERE e.id = ?',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Entry not found.' });

    await pool.query('DELETE FROM crop_entries WHERE id = ?', [req.params.id]);

    await pool.query(
      'INSERT INTO audit_log (user_id, user_name, action) VALUES (?, ?, ?)',
      [req.user.id, req.user.name, `Deleted entry: ${rows[0].crop} (${rows[0].id})`]
    );

    res.json({ ok: true, id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};