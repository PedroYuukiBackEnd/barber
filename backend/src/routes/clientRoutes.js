const express = require('express');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');
const {
  listClients,
  createClient,
  updateClient,
  deleteClient,
} = require('../controllers/clientController');

const router = express.Router();
router.use(authMiddleware, requireRole('user'));

router.get('/', listClients);
router.post('/', createClient);
router.put('/:id', updateClient);
router.delete('/:id', deleteClient);

module.exports = router;
