const express = require('express');
const router = express.Router();
const { getBarangays, getCropTypes } = require('../controllers/lookupController');
router.get('/barangays', getBarangays);
router.get('/crop-types', getCropTypes);
module.exports = router;
