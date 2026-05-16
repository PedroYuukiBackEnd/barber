const express = require('express');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');
const { listEmployees, createEmployee, updateEmployee, deleteEmployee } = require('../controllers/employeeController');

const router = express.Router();
router.use(authMiddleware, requireRole('user'));

router.get('/', listEmployees);
router.post('/', createEmployee);
router.put('/:id', updateEmployee);
router.delete('/:id', deleteEmployee);

module.exports = router;
