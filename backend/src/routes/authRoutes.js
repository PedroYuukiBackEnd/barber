const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { register, login, logout, me, getTenant, updateTenantSettings } = require('../controllers/authController');

const router = express.Router();
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', authMiddleware, me);
router.get('/tenant', authMiddleware, getTenant);
router.put('/tenant', authMiddleware, updateTenantSettings);

module.exports = router;
