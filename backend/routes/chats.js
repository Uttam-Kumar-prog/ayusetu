const express = require('express');
const multer = require('multer');
const { body, param } = require('express-validator');
const {
  createSession,
  listMySessions,
  postPatientMessage,
  assignDoctor,
  postDoctorMessage,
  analyzePrescriptionUpload,
  getMySymptomMemory,
} = require('../controllers/chatController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

router.post(
  '/',
  protect,
  authorize('patient'),
  body('channel').optional().isIn(['AI', 'DOCTOR']).withMessage('invalid channel'),
  body('linkedAssessmentId').optional({ nullable: true }).isMongoId().withMessage('linkedAssessmentId must be a valid id'),
  validate,
  createSession
);
router.get('/mine', protect, authorize('patient', 'doctor', 'admin'), listMySessions);
router.get('/memory', protect, authorize('patient'), getMySymptomMemory);
router.post(
  '/prescription-analyze',
  protect,
  authorize('patient'),
  upload.single('file'),
  body('followupText').optional().isString().isLength({ max: 4000 }).withMessage('followupText is too long'),
  body('currentFeeling').optional().isString().isLength({ max: 120 }).withMessage('currentFeeling is too long'),
  body('generateReport')
    .optional()
    .custom((value) => ['true', 'false', true, false].includes(value))
    .withMessage('generateReport must be true or false'),
  validate,
  analyzePrescriptionUpload
);
router.post(
  '/:id/patient-message',
  protect,
  authorize('patient'),
  param('id').isMongoId().withMessage('id must be a valid chat session id'),
  body('text').isString().trim().notEmpty().withMessage('text is required'),
  body('text').isLength({ max: 4000 }).withMessage('text is too long'),
  validate,
  postPatientMessage
);
router.patch(
  '/:id/assign-doctor',
  protect,
  authorize('admin'),
  param('id').isMongoId().withMessage('id must be a valid chat session id'),
  body('doctorId').isMongoId().withMessage('doctorId must be a valid id'),
  validate,
  assignDoctor
);
router.post(
  '/:id/doctor-message',
  protect,
  authorize('doctor', 'admin'),
  param('id').isMongoId().withMessage('id must be a valid chat session id'),
  body('text').isString().trim().notEmpty().withMessage('text is required'),
  body('text').isLength({ max: 4000 }).withMessage('text is too long'),
  validate,
  postDoctorMessage
);

module.exports = router;
