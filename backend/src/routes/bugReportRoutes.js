const express = require('express');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');
const { submitBugReport, getMyBugReports } = require('../controllers/bugReportController');

const router = express.Router();
router.use(authMiddleware, requireRole('user'));

router.get('/', getMyBugReports);
router.post('/', submitBugReport);

module.exports = router;
