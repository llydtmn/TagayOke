const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getAll } = require('../controllers/auditController');
router.get('/', auth, auth.requireRole('admin'), getAll);
module.exports = router;
