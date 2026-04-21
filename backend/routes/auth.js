const express = require('express');
const { body } = require('express-validator');
const {
  register,
  login,
  sendOtpCode,
  verifyOtpCode,
  getMe,
  updateProfile,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const validateAuth = require('../middleware/validateAuth');
const router = express.Router();

router.post(
  '/register',
  body('fullName').trim().notEmpty().withMessage('fullName is required'),
  body('email').optional().isEmail().withMessage('email must be valid'),
  body('phone').optional().isLength({ min: 10, max: 15 }).withMessage('phone must be 10-15 digits'),
  body('password').isString().isLength({ min: 6 }).withMessage('password must be at least 6 characters'),
  body('role').optional().isIn(['patient', 'doctor', 'pharmacy']).withMessage('invalid role'),
  body().custom((value) => {
    if (!value.email && !value.phone) {
      throw new Error('Either email or phone is required');
    }
    return true;
  }),
  validateAuth,
  register
);

router.post(
  '/login',
  body('email').optional().isEmail().withMessage('email must be valid'),
  body('phone').optional().isLength({ min: 10, max: 15 }).withMessage('phone must be 10-15 digits'),
  body('password').isString().notEmpty().withMessage('password is required'),
  body().custom((value) => {
    if (!value.email && !value.phone) {
      throw new Error('Either email or phone is required');
    }
    return true;
  }),
  validateAuth,
  login
);

router.post(
  '/send-otp',
  body('phone').isLength({ min: 10, max: 15 }).withMessage('phone must be 10-15 digits'),
  body('purpose').optional().isIn(['login', 'register', 'password_reset']).withMessage('invalid purpose'),
  validate,
  sendOtpCode
);

router.post(
  '/verify-otp',
  body('phone').isLength({ min: 10, max: 15 }).withMessage('phone must be 10-15 digits'),
  body('code').isLength({ min: 4, max: 6 }).withMessage('OTP code must be 4-6 digits'),
  body('purpose').optional().isIn(['login', 'register', 'password_reset']).withMessage('invalid purpose'),
  body('role').optional().isIn(['patient', 'doctor', 'pharmacy']).withMessage('invalid role'),
  validate,
  verifyOtpCode
);

router.get('/me', protect, getMe);
router.patch(
  '/me',
  protect,
  body('fullName').optional().trim().notEmpty().withMessage('fullName cannot be empty'),
  body('email').optional().isEmail().withMessage('email must be valid'),
  body('profile').optional().isObject().withMessage('profile must be an object'),
  validate,
  updateProfile
);

module.exports = router;
