// server.js — Calbayog Farmers Crop Log System — Express API
require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const app = express();

// ── Middleware ──────────────────────────────────────────────────
app.use(cors({
  origin:      process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes ──────────────────────────────────────────────────────
app.use('/api/auth',   require('./routes/auth'));
app.use('/api/crops',  require('./routes/crops'));
app.use('/api/users',  require('./routes/users'));
app.use('/api/audit',  require('./routes/audit'));
app.use('/api',        require('./routes/lookup'));  // /api/barangays, /api/crop-types

// ── Health check ────────────────────────────────────────────────
app.get('/api/health', (_, res) => res.json({ status: 'ok', time: new Date() }));

// ── 404 catch-all ───────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` }));

// ── Start ────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀  API running on http://localhost:${PORT}`);
});