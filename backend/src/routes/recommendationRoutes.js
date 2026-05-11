const express = require('express');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');
const { createRecommendation } = require('../controllers/recommendationController');

const router = express.Router();
router.use(authMiddleware, requireRole('user'));

router.post('/', createRecommendation);

module.exports = router;
