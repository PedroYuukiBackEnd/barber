const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { submitBugReport, getMyBugReports } = require('../controllers/bugReportController');

const router = express.Router();
router.use(authMiddleware);

router.get('/', getMyBugReports);
router.post('/', submitBugReport);

module.exports = router;
