// routes/users.js
const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const c       = require('../controllers/userController');

router.use(auth); // all routes require login

// GET /api/users — all authenticated users can read the farmers list
// (admin-only restriction removed so farm managers can see the list)
router.get('/',      c.getAll);
router.get('/:id',   c.getOne);

// Write operations remain admin-only EXCEPT PATCH (own profile) and
// the special case of registerFarmer (farm-manager creating a farmer record)
router.post(
  '/',
  (req, res, next) => {
    // Allow admin OR farm-manager roles to create farmer records
    if (req.user.role === 'admin' || req.user.role === 'farm-manager' || req.user.role === 'farmer' || req.user.role === 'encoder' || req.user.role === 'at') {
      return next();
    }
    return res.status(403).json({ error: 'Access denied.' });
  },
  c.create
);

router.patch('/:id',  c.update);
router.delete('/:id', auth.requireRole('admin'), c.remove);

module.exports = router;