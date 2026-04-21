const TherapyPlan = require('../models/TherapyPlan');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

exports.createTherapyPlan = asyncHandler(async (req, res) => {
  const { patientId, therapyType, startDate, totalSessions = 7 } = req.body;

  if (!patientId || !therapyType || !startDate) {
    throw new ApiError(400, 'patientId, therapyType and startDate are required');
  }

  const sessions = Array.from({ length: Number(totalSessions) }).map((_, idx) => {
    const date = new Date(`${startDate}T00:00:00+05:30`);
    date.setDate(date.getDate() + idx);

    return {
      dayNumber: idx + 1,
      date: date.toISOString().slice(0, 10),
      status: 'PENDING',
    };
  });

  const plan = await TherapyPlan.create({
    patientId,
    doctorId: req.user._id,
    therapyType,
    startDate,
    totalSessions,
    sessions,
    progressPercent: 0,
  });

  return res.status(201).json({ success: true, plan });
});

exports.getMyTherapyPlans = asyncHandler(async (req, res) => {
  let query = { patientId: req.user._id };
  if (req.user.role === 'doctor') query = { doctorId: req.user._id };
  if (req.user.role === 'admin') query = {};

  const plans = await TherapyPlan.find(query)
    .populate('patientId', 'fullName')
    .populate('doctorId', 'fullName')
    .sort({ createdAt: -1 });

  return res.json({ success: true, count: plans.length, plans });
});

exports.markSessionStatus = asyncHandler(async (req, res) => {
  const { sessionDay, status, notes = '' } = req.body;

  const plan = await TherapyPlan.findById(req.params.id);
  if (!plan) {
    throw new ApiError(404, 'Therapy plan not found');
  }

  if (String(plan.doctorId) !== String(req.user._id) && req.user.role !== 'admin') {
    throw new ApiError(403, 'Only assigned doctor can update therapy progress');
  }

  const session = plan.sessions.find((s) => s.dayNumber === Number(sessionDay));
  if (!session) {
    throw new ApiError(404, 'Session day not found');
  }

  session.status = status;
  session.notes = notes;
  session.completedAt = status === 'COMPLETED' ? new Date() : null;

  const completed = plan.sessions.filter((s) => s.status === 'COMPLETED').length;
  plan.progressPercent = Math.round((completed / plan.totalSessions) * 100);
  if (plan.progressPercent === 100) {
    plan.status = 'COMPLETED';
  }

  await plan.save();

  return res.json({ success: true, plan });
});
