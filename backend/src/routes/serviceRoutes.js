const express = require('express');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');
const {
  listServices,
  createService,
  updateService,
  deleteService,
} = require('../controllers/serviceController');

const router = express.Router();
router.use(authMiddleware, requireRole('user'));

router.get('/', listServices);
router.post('/', createService);
router.put('/:id', updateService);
router.delete('/:id', deleteService);

module.exports = router;
