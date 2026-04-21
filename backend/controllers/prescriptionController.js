const crypto = require('crypto');
const Prescription = require('../models/Prescription');
const Appointment = require('../models/Appointment');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

exports.createPrescription = asyncHandler(async (req, res) => {
  const { appointmentId, diagnosis = [], medicines = [], advice = '', followUpDate = null } = req.body;

  if (!appointmentId || !Array.isArray(medicines) || medicines.length === 0) {
    throw new ApiError(400, 'appointmentId and medicines are required');
  }

  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    throw new ApiError(404, 'Appointment not found');
  }

  if (String(appointment.doctorId) !== String(req.user._id) && req.user.role !== 'admin') {
    throw new ApiError(403, 'Only assigned doctor can create prescription');
  }

  const prescription = await Prescription.create({
    appointmentId,
    patientId: appointment.patientId,
    doctorId: appointment.doctorId,
    diagnosis,
    medicines,
    advice,
    followUpDate,
    qrToken: crypto.randomUUID(),
  });

  return res.status(201).json({ success: true, prescription });
});

exports.getMyPrescriptions = asyncHandler(async (req, res) => {
  let query = { patientId: req.user._id };
  if (req.user.role === 'doctor') query = { doctorId: req.user._id };
  if (req.user.role === 'admin') query = {};

  const prescriptions = await Prescription.find(query)
    .populate('doctorId', 'fullName doctorProfile.specialty')
    .sort({ createdAt: -1 });

  return res.json({ success: true, count: prescriptions.length, prescriptions });
});

exports.getPrescriptionByQr = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const prescription = await Prescription.findOne({ qrToken: token }).populate('doctorId', 'fullName');

  if (!prescription) {
    throw new ApiError(404, 'Prescription not found');
  }

  return res.json({ success: true, prescription });
});
