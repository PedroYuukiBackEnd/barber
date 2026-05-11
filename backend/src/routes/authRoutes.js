const express = require('express');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');
const { register, login, logout, me, getTenant, updateTenantSettings } = require('../controllers/authController');

const router = express.Router();
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', authMiddleware, me);
router.get('/tenant', authMiddleware, requireRole('user'), getTenant);
router.put('/tenant', authMiddleware, requireRole('user'), updateTenantSettings);

module.exports = router;
