const User = require('../models/User');
const Appointment = require('../models/Appointment');
const SymptomHistory = require('../models/SymptomHistory');
const ChatSession = require('../models/ChatSession');
const Prescription = require('../models/Prescription');
const TherapyPlan = require('../models/TherapyPlan');
const MedicineInventory = require('../models/MedicineInventory');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

exports.getPendingDoctors = asyncHandler(async (req, res) => {
  const doctors = await User.find({
    role: 'doctor',
    'doctorProfile.verifiedByAdmin': false,
  }).select('-password');

  return res.json({ success: true, count: doctors.length, doctors });
});

exports.verifyDoctor = asyncHandler(async (req, res) => {
  const doctor = await User.findOne({ _id: req.params.id, role: 'doctor' });
  if (!doctor) {
    throw new ApiError(404, 'Doctor not found');
  }

  doctor.doctorProfile.verifiedByAdmin = true;
  doctor.isVerified = true;
  await doctor.save();

  return res.json({ success: true, message: 'Doctor verified successfully', doctor });
});

exports.getSystemHealth = asyncHandler(async (req, res) => {
  const [users, appointments, assessments] = await Promise.all([
    User.countDocuments(),
    Appointment.countDocuments(),
    SymptomHistory.countDocuments(),
  ]);

  return res.json({
    success: true,
    health: {
      status: 'ok',
      users,
      appointments,
      assessments,
      timestamp: new Date().toISOString(),
    },
  });
});

exports.getAdminOverview = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalPatients,
    totalDoctors,
    totalPharmacies,
    totalAdmins,
    activeDoctors,
    pendingDoctorVerifications,
    totalAppointments,
    openAppointments,
    totalAssessments,
    totalChats,
    escalatedChats,
    totalPrescriptions,
    totalTherapyPlans,
    activeTherapyPlans,
    totalInventories,
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ role: 'patient' }),
    User.countDocuments({ role: 'doctor' }),
    User.countDocuments({ role: 'pharmacy' }),
    User.countDocuments({ role: 'admin' }),
    User.countDocuments({ role: 'doctor', isActive: true, 'doctorProfile.verifiedByAdmin': true }),
    User.countDocuments({ role: 'doctor', 'doctorProfile.verifiedByAdmin': false }),
    Appointment.countDocuments({}),
    Appointment.countDocuments({ status: { $in: ['CONFIRMED', 'IN_PROGRESS'] } }),
    SymptomHistory.countDocuments({}),
    ChatSession.countDocuments({}),
    ChatSession.countDocuments({ status: 'ESCALATED_TO_DOCTOR' }),
    Prescription.countDocuments({}),
    TherapyPlan.countDocuments({}),
    TherapyPlan.countDocuments({ status: 'ACTIVE' }),
    MedicineInventory.countDocuments({}),
  ]);

  const [recentAppointments, recentAssessments, recentChats] = await Promise.all([
    Appointment.find({})
      .populate('patientId', 'fullName')
      .populate('doctorId', 'fullName')
      .select('appointmentCode slotDate slotTime status consultationType patientId doctorId createdAt')
      .sort({ createdAt: -1 })
      .limit(6),
    SymptomHistory.find({})
      .populate('userId', 'fullName')
      .select('symptoms triage userId createdAt')
      .sort({ createdAt: -1 })
      .limit(6),
    ChatSession.find({})
      .populate('patientId', 'fullName')
      .populate('doctorId', 'fullName')
      .select('channel status patientId doctorId assistantName updatedAt messages')
      .sort({ updatedAt: -1 })
      .limit(6),
  ]);

  const overview = {
    summary: {
      totalUsers,
      totalPatients,
      totalDoctors,
      totalPharmacies,
      totalAdmins,
      activeDoctors,
      pendingDoctorVerifications,
      totalAppointments,
      openAppointments,
      totalAssessments,
      totalChats,
      escalatedChats,
      totalPrescriptions,
      totalTherapyPlans,
      activeTherapyPlans,
      totalInventories,
      generatedAt: new Date().toISOString(),
    },
    serviceCoverage: [
      { key: 'auth', label: 'Auth & Profiles', monitoredBy: 'User', total: totalUsers },
      { key: 'symptoms', label: 'Symptom Assessments', monitoredBy: 'SymptomHistory', total: totalAssessments },
      { key: 'appointments', label: 'Appointments', monitoredBy: 'Appointment', total: totalAppointments },
      { key: 'chat', label: 'AI/Doctor Chat Sessions', monitoredBy: 'ChatSession', total: totalChats },
      { key: 'prescriptions', label: 'Prescriptions', monitoredBy: 'Prescription', total: totalPrescriptions },
      { key: 'therapy', label: 'Therapy Plans', monitoredBy: 'TherapyPlan', total: totalTherapyPlans },
      { key: 'pharmacy', label: 'Pharmacy Inventories', monitoredBy: 'MedicineInventory', total: totalInventories },
    ],
    recent: {
      appointments: recentAppointments,
      assessments: recentAssessments,
      chats: recentChats.map((chat) => ({
        _id: chat._id,
        channel: chat.channel,
        status: chat.status,
        assistantName: chat.assistantName,
        patientId: chat.patientId,
        doctorId: chat.doctorId,
        lastMessage:
          Array.isArray(chat.messages) && chat.messages.length
            ? chat.messages[chat.messages.length - 1]?.text || ''
            : '',
        updatedAt: chat.updatedAt,
      })),
    },
  };

  return res.json({ success: true, overview });
});
