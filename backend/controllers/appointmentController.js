const crypto = require('crypto');
const Appointment = require('../models/Appointment');
const DoctorAvailability = require('../models/DoctorAvailability');
const User = require('../models/User');
const SymptomHistory = require('../models/SymptomHistory');
const PatientSymptomMemory = require('../models/PatientSymptomMemory');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { createNotification } = require('../services/notificationService');

const generateCode = () => `APT-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

exports.bookAppointment = asyncHandler(async (req, res) => {
  const { doctorId, date, time, consultationType = 'telemedicine', symptomSummary = '' } = req.body;

  if (!doctorId || !date || !time) {
    throw new ApiError(400, 'doctorId, date and time are required');
  }

  const doctor = await User.findOne({
    _id: doctorId,
    role: 'doctor',
    isActive: true,
    'doctorProfile.verifiedByAdmin': true,
  });

  if (!doctor) {
    throw new ApiError(404, 'Doctor not found or not verified');
  }

  const lock = await DoctorAvailability.findOneAndUpdate(
    {
      doctorId,
      date,
      'slots.time': time,
      'slots.status': 'AVAILABLE',
    },
    {
      $set: {
        'slots.$.status': 'BOOKED',
        'slots.$.bookedBy': req.user._id,
      },
    },
    { new: true }
  );

  if (!lock) {
    throw new ApiError(409, 'Slot no longer available. Please select another slot.');
  }

  const selectedSlot = lock.slots.find((s) => s.time === time);
  const roomId = `room-${crypto.randomUUID()}`;

  const appointment = await Appointment.create({
    appointmentCode: generateCode(),
    patientId: req.user._id,
    doctorId,
    slotDate: date,
    slotTime: time,
    startAt: selectedSlot.startAt,
    endAt: selectedSlot.endAt,
    consultationType,
    symptomSummary,
    meeting: {
      roomId,
      joinUrl: `${process.env.WEB_URL || 'http://localhost:5173'}/consultation/${roomId}`,
    },
  });

  await DoctorAvailability.updateOne(
    {
      doctorId,
      date,
      'slots.time': time,
    },
    {
      $set: {
        'slots.$.appointmentId': appointment._id,
      },
    }
  );

  await Promise.all([
    createNotification({
      userId: req.user._id,
      type: 'APPOINTMENT_CONFIRMED',
      title: 'Appointment booked',
      body: `Your consultation with ${doctor.fullName} is confirmed for ${date} ${time}`,
    }),
    createNotification({
      userId: doctor._id,
      type: 'NEW_APPOINTMENT',
      title: 'New appointment booked',
      body: `New patient appointment on ${date} at ${time}`,
    }),
  ]);

  return res.status(201).json({
    success: true,
    message: 'Appointment booked successfully',
    appointment,
  });
});

exports.listMyAppointments = asyncHandler(async (req, res) => {
  const query = {};

  if (req.user.role === 'patient') {
    query.patientId = req.user._id;
  } else if (req.user.role === 'doctor') {
    query.doctorId = req.user._id;
  }

  const appointments = await Appointment.find(query)
    .populate('patientId', 'fullName phone')
    .populate('doctorId', 'fullName doctorProfile.specialty')
    .sort({ startAt: -1 });

  return res.json({ success: true, count: appointments.length, appointments });
});

exports.updateAppointmentStatus = asyncHandler(async (req, res) => {
  const { status, notesByDoctor = '', cancelReason = '' } = req.body;

  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) {
    throw new ApiError(404, 'Appointment not found');
  }

  const allowed =
    req.user.role === 'admin' ||
    String(appointment.patientId) === String(req.user._id) ||
    String(appointment.doctorId) === String(req.user._id);

  if (!allowed) {
    throw new ApiError(403, 'Access denied');
  }

  appointment.status = status || appointment.status;
  if (notesByDoctor) appointment.notesByDoctor = notesByDoctor;
  if (cancelReason) appointment.cancelReason = cancelReason;
  await appointment.save();

  return res.json({ success: true, appointment });
});

exports.getDoctorCaseSummary = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id)
    .populate('patientId', 'fullName phone profile')
    .populate('doctorId', 'fullName');

  if (!appointment) {
    throw new ApiError(404, 'Appointment not found');
  }

  if (String(appointment.doctorId._id) !== String(req.user._id) && req.user.role !== 'admin') {
    throw new ApiError(403, 'Access denied');
  }

  const assessments = await SymptomHistory.find({ userId: appointment.patientId._id })
    .sort({ createdAt: -1 })
    .limit(5);
  const memory = await PatientSymptomMemory.findOne({ userId: appointment.patientId._id });

  return res.json({
    success: true,
    summary: {
      appointment,
      recentAssessments: assessments,
      symptomMemory: memory
        ? {
            topSymptoms: memory.topSymptoms || [],
            likelyCauses: memory.likelyCauses || [],
            lastAssistantName: memory.lastAssistantName || 'AyuBot',
            recentConversationSignals: (memory.entries || [])
              .slice(-10)
              .reverse()
              .map((entry) => ({
                source: entry.source,
                assistantName: entry.assistantName,
                symptoms: entry.symptoms || [],
                medications: entry.medications || [],
                createdAt: entry.createdAt,
                snippet: String(entry.rawText || '').slice(0, 280),
              })),
          }
        : null,
    },
  });
});
