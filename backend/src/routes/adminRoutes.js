const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { getUsers, getRecommendations, deleteRecommendation, getBugReports, resolveBugReport, registerTenant, editUser, deleteUser, createPlatformAdmin, markUserBillingPaid } = require('../controllers/adminController');

const router = express.Router();

function superadminOnly(req, res, next) {
  if (!req.user || req.user.role !== 'superadmin') {
    return res.status(403).json({ message: 'Acesso restrito ao administrador da plataforma.' });
  }
  next();
}

router.use(authMiddleware, superadminOnly);

router.get('/users', getUsers);
router.get('/recommendations', getRecommendations);
router.delete('/recommendations/:id', deleteRecommendation);
router.get('/bug-reports', getBugReports);
router.patch('/bug-reports/:id/resolve', resolveBugReport);
router.post('/register', registerTenant);
router.post('/users/admin', createPlatformAdmin);
router.patch('/users/:id/billing', markUserBillingPaid);
router.put('/users/:id', editUser);
router.delete('/users/:id', deleteUser);

module.exports = router;
