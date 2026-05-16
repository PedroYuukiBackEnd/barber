const express = require('express');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');
const { listManualEarnings, createManualEarning, deleteManualEarning } = require('../controllers/earningController');

const router = express.Router();
router.use(authMiddleware, requireRole('user'));

router.get('/', listManualEarnings);
router.post('/', createManualEarning);
router.delete('/:id', deleteManualEarning);

module.exports = router;
