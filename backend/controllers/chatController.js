const ChatSession = require('../models/ChatSession');
const SymptomHistory = require('../models/SymptomHistory');
const User = require('../models/User');
const PatientSymptomMemory = require('../models/PatientSymptomMemory');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { analyzeSymptoms, generateAssistantReply } = require('../services/aiService');
const {
  captureFromMessage,
  extractAssistantNamePreference,
  getSymptomMemorySummary,
  upsertSymptomMemory,
} = require('../services/patientSymptomMemoryService');
const {
  extractTextFromUpload,
  buildStructuredPrescription,
} = require('../services/documentAnalysisService');

const shouldEscalate = (text) => {
  const t = String(text || '').toLowerCase();
  return [
    'not satisfied',
    'dissatisfied',
    'talk to doctor',
    'need doctor',
    'human doctor',
  ].some((phrase) => t.includes(phrase));
};

exports.createSession = asyncHandler(async (req, res) => {
  const { channel = 'AI', linkedAssessmentId = null } = req.body;

  if (linkedAssessmentId) {
    const assessment = await SymptomHistory.findById(linkedAssessmentId);
    if (!assessment || String(assessment.userId) !== String(req.user._id)) {
      throw new ApiError(404, 'Linked assessment not found');
    }
  }

  const session = await ChatSession.create({
    patientId: req.user._id,
    channel,
    linkedAssessmentId,
    assistantName: 'AyuBot',
    messages: [{
      sender: 'SYSTEM',
      text: 'Session started. You can describe your concerns here.',
    }],
  });

  return res.status(201).json({ success: true, session });
});

exports.listMySessions = asyncHandler(async (req, res) => {
  let query = { patientId: req.user._id };
  if (req.user.role === 'doctor') query = { doctorId: req.user._id };
  if (req.user.role === 'admin') query = {};

  const sessions = await ChatSession.find(query).sort({ updatedAt: -1 });
  return res.json({ success: true, count: sessions.length, sessions });
});

exports.postPatientMessage = asyncHandler(async (req, res) => {
  const { text } = req.body;
  const session = await ChatSession.findById(req.params.id);

  if (!session) throw new ApiError(404, 'Session not found');
  if (String(session.patientId) !== String(req.user._id)) throw new ApiError(403, 'Access denied');

  const preferredAssistantName = extractAssistantNamePreference(text);
  if (preferredAssistantName) {
    session.assistantName = preferredAssistantName;
  }

  session.messages.push({ sender: 'PATIENT', text });
  await captureFromMessage({
    userId: req.user._id,
    text,
    assistantName: session.assistantName || 'AyuBot',
  });

  let triage = null;
  if (session.linkedAssessmentId) {
    const assessment = await SymptomHistory.findById(session.linkedAssessmentId);
    triage = assessment?.triage || null;
  }
  if (!triage) {
    const latestAssessment = await SymptomHistory.findOne({ userId: req.user._id }).sort({ createdAt: -1 });
    triage = latestAssessment?.triage || null;
  }

  const memorySummary = await getSymptomMemorySummary(req.user._id);
  let aiReply = await generateAssistantReply({
    message: text,
    triage,
    assistantName: session.assistantName || 'AyuBot',
    memorySummary,
  });
  if (preferredAssistantName) {
    aiReply = `Sure, you can call me ${preferredAssistantName}. ${aiReply}`;
  }
  session.messages.push({ sender: 'AI', text: aiReply });

  if (shouldEscalate(text)) {
    session.status = 'ESCALATED_TO_DOCTOR';
    session.channel = 'DOCTOR';
    session.messages.push({
      sender: 'SYSTEM',
      text: 'Your case has been marked for doctor escalation. A doctor will respond shortly.',
    });
  }

  await session.save();

  return res.json({
    success: true,
    session,
  });
});

exports.analyzePrescriptionUpload = asyncHandler(async (req, res) => {
  const file = req.file;
  if (!file) {
    throw new ApiError(400, 'Prescription/report file is required');
  }

  const followupText = String(req.body.followupText || '');
  const currentFeeling = String(req.body.currentFeeling || '');
  const generateReport =
    req.body.generateReport === true || String(req.body.generateReport).toLowerCase() === 'true';

  const extracted = await extractTextFromUpload(file);
  const structured = buildStructuredPrescription({
    extractedText: extracted.text,
    followupText: [currentFeeling, followupText].filter(Boolean).join(' '),
  });

  const severityBoost = /(worse|severe|high|new symptom)/i.test(currentFeeling) ? 3 : null;
  const symptomsForTriage = (structured.symptoms || []).map((item) => ({
    name: item.name,
    severity: severityBoost || Number(item.severity || 2),
  }));

  await upsertSymptomMemory({
    userId: req.user._id,
    source: 'UPLOAD',
    rawText: [extracted.text, followupText].filter(Boolean).join(' '),
    symptoms: (structured.symptoms || []).map((item) => ({
      name: item.name,
      severity: severityBoost || Number(item.severity || 2),
      confidence: item.confidence || 0.75,
    })),
    medications: structured.medications || [],
    assistantName: 'AyuBot',
  });

  let triage = null;
  let assessmentId = null;
  if (generateReport && symptomsForTriage.length) {
    triage = analyzeSymptoms({
      symptoms: symptomsForTriage,
      lifestyle: [
        `Prescription source: ${file.originalname}`,
        currentFeeling ? `Current feeling: ${currentFeeling}` : '',
        followupText ? `Follow-up: ${followupText}` : '',
      ]
        .filter(Boolean)
        .join(' | '),
      language: 'en',
    });

    const history = await SymptomHistory.create({
      userId: req.user._id,
      symptoms: symptomsForTriage,
      lifestyle: [
        `Prescription source: ${file.originalname}`,
        `Extraction mode: ${extracted.mode}`,
        followupText,
      ]
        .filter(Boolean)
        .join(' | '),
      language: 'en',
      inputMode: 'text',
      triage,
      recommendations: triage.recommendations,
      doshaImbalance: triage.doshaImbalance,
      source: 'AI',
    });
    assessmentId = history._id;
  }

  const memorySummary = await getSymptomMemorySummary(req.user._id);

  return res.json({
    success: true,
    fileName: file.originalname,
    extractionMode: extracted.mode,
    extractedPreview: String(extracted.text || '').slice(0, 600),
    structured: {
      symptoms: symptomsForTriage,
      medications: structured.medications || [],
      followupQuestions: structured.followupQuestions || [],
    },
    reportReady: Boolean(triage),
    triage,
    assessmentId,
    memorySummary,
  });
});

exports.assignDoctor = asyncHandler(async (req, res) => {
  const { doctorId } = req.body;
  const session = await ChatSession.findById(req.params.id);
  if (!session) throw new ApiError(404, 'Session not found');

  const doctor = await User.findOne({ _id: doctorId, role: 'doctor' });
  if (!doctor) throw new ApiError(404, 'Doctor not found');

  session.doctorId = doctorId;
  session.channel = 'DOCTOR';
  session.status = 'ESCALATED_TO_DOCTOR';
  session.messages.push({ sender: 'SYSTEM', text: `Assigned to Dr. ${doctor.fullName}` });
  await session.save();

  return res.json({ success: true, session });
});

exports.postDoctorMessage = asyncHandler(async (req, res) => {
  const { text } = req.body;
  const session = await ChatSession.findById(req.params.id);
  if (!session) throw new ApiError(404, 'Session not found');

  const isAssignedDoctor = String(session.doctorId) === String(req.user._id);
  if (!isAssignedDoctor && req.user.role !== 'admin') {
    throw new ApiError(403, 'Only assigned doctor can reply');
  }

  session.messages.push({ sender: 'DOCTOR', text });
  await session.save();

  return res.json({ success: true, session });
});

exports.getMySymptomMemory = asyncHandler(async (req, res) => {
  const memory = await PatientSymptomMemory.findOne({ userId: req.user._id });
  return res.json({ success: true, memory: memory || null });
});
