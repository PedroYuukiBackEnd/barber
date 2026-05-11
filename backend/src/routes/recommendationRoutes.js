const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { createRecommendation } = require('../controllers/recommendationController');

const router = express.Router();
router.use(authMiddleware);

router.post('/', createRecommendation);

module.exports = router;
