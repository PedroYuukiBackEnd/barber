const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { getUsers, registerTenant, editUser, deleteUser, createAdminUser, createRegularUser, markUserBillingPaid } = require('../controllers/adminController');

const router = express.Router();

function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Acesso restrito a administradores.' });
  }
  next();
}

// Rota protegida para admin
router.get('/users', authMiddleware, adminOnly, getUsers);
router.post('/register', authMiddleware, adminOnly, registerTenant);
router.post('/users', authMiddleware, adminOnly, createRegularUser);
router.post('/users/admin', authMiddleware, adminOnly, createAdminUser);
router.patch('/users/:id/billing', authMiddleware, adminOnly, markUserBillingPaid);
router.put('/users/:id', authMiddleware, adminOnly, editUser);
router.delete('/users/:id', authMiddleware, adminOnly, deleteUser);

module.exports = router;
