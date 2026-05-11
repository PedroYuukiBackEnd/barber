const express = require('express');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');
const {
  listAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  finishAppointment,
  listServiceHistory,
} = require('../controllers/appointmentController');

const router = express.Router();
router.use(authMiddleware, requireRole('user'));

router.get('/', listAppointments);
router.get('/history', listServiceHistory);
router.post('/', createAppointment);
router.post('/:id/finish', finishAppointment);
router.put('/:id', updateAppointment);
router.delete('/:id', deleteAppointment);

module.exports = router;
