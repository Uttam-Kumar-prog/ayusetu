const SymptomHistory = require('../models/SymptomHistory');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { analyzeSymptoms } = require('../services/aiService');
const { upsertSymptomMemory } = require('../services/patientSymptomMemoryService');

exports.submitSymptoms = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, 'Auth required');
  }

  const { symptoms = [], lifestyle = '', language = 'en', inputMode = 'text' } = req.body;

  if (!Array.isArray(symptoms) || symptoms.length === 0) {
    throw new ApiError(400, 'symptoms must be a non-empty array');
  }

  const triage = analyzeSymptoms({ symptoms, lifestyle, language });

  const history = await SymptomHistory.create({
    userId: req.user._id,
    symptoms,
    lifestyle,
    language,
    inputMode,
    triage,
    recommendations: triage.recommendations,
    doshaImbalance: triage.doshaImbalance,
    source: 'AI',
  });

  await upsertSymptomMemory({
    userId: req.user._id,
    source: 'ASSESSMENT',
    rawText: `Assessment submitted. ${lifestyle || ''}`,
    symptoms: symptoms.map((item) => ({
      name: item.name,
      severity: Number(item.severity || 2),
      confidence: 0.9,
    })),
    medications: [],
    assistantName: 'AyuBot',
  });

  return res.status(201).json({
    success: true,
    assessmentId: history._id,
    ...triage,
  });
});

exports.getMySymptomHistory = asyncHandler(async (req, res) => {
  const records = await SymptomHistory.find({ userId: req.user._id }).sort({ createdAt: -1 });
  return res.json({ success: true, count: records.length, records });
});

exports.getSymptomAssessmentById = asyncHandler(async (req, res) => {
  const record = await SymptomHistory.findById(req.params.id);
  if (!record) {
    throw new ApiError(404, 'Assessment not found');
  }

  const isOwner = String(record.userId) === String(req.user._id);
  const isDoctorOrAdmin = ['doctor', 'admin'].includes(req.user.role);
  if (!isOwner && !isDoctorOrAdmin) {
    throw new ApiError(403, 'Access denied');
  }

  return res.json({ success: true, record });
});
