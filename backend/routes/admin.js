const express = require('express');
const { param } = require('express-validator');
const {
  getPendingDoctors,
  verifyDoctor,
  getSystemHealth,
  getAdminOverview,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.get('/pending-doctors', protect, authorize('admin'), getPendingDoctors);
router.get('/overview', protect, authorize('admin'), getAdminOverview);
router.patch(
  '/verify-doctor/:id',
  protect,
  authorize('admin'),
  param('id').isMongoId().withMessage('id must be a valid doctor id'),
  validate,
  verifyDoctor
);
router.get('/system-health', protect, authorize('admin'), getSystemHealth);

module.exports = router;
