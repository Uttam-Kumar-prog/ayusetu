const express = require('express');
const { body, param } = require('express-validator');
const {
  bookAppointment,
  listMyAppointments,
  updateAppointmentStatus,
  getDoctorCaseSummary,
  getMeetingRoomAccess,
} = require('../controllers/appointmentController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.post(
  '/',
  protect,
  authorize('patient', 'admin'),
  body('doctorId').isMongoId().withMessage('doctorId must be a valid id'),
  body('date').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('date must be in YYYY-MM-DD format'),
  body('time').matches(/^([01]\d|2[0-3]):[0-5]\d$/).withMessage('time must be in HH:mm format'),
  body('consultationType')
    .optional()
    .isIn(['telemedicine', 'ayurveda', 'followup'])
    .withMessage('invalid consultationType'),
  body('symptomSummary').optional().isString().isLength({ max: 2000 }).withMessage('symptomSummary is too long'),
  validate,
  bookAppointment
);
router.get('/mine', protect, authorize('patient', 'doctor', 'admin'), listMyAppointments);
router.get(
  '/room/:roomId/access',
  protect,
  param('roomId').isString().trim().notEmpty().isLength({ min: 6, max: 120 }).withMessage('invalid roomId'),
  validate,
  getMeetingRoomAccess
);
router.patch(
  '/:id/status',
  protect,
  param('id').isMongoId().withMessage('id must be a valid appointment id'),
  body('status')
    .optional()
    .isIn(['CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'])
    .withMessage('invalid status'),
  body('notesByDoctor').optional().isString().isLength({ max: 3000 }).withMessage('notesByDoctor is too long'),
  body('cancelReason').optional().isString().isLength({ max: 1000 }).withMessage('cancelReason is too long'),
  validate,
  updateAppointmentStatus
);
router.get(
  '/:id/case-summary',
  protect,
  authorize('doctor', 'admin'),
  param('id').isMongoId().withMessage('id must be a valid appointment id'),
  validate,
  getDoctorCaseSummary
);

module.exports = router;
