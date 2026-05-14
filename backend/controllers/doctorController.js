const User = require('../models/User');
const DoctorAvailability = require('../models/DoctorAvailability');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { getPagination } = require('../utils/pagination');

const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const parseDateTime = (date, time) => {
  return new Date(`${date}T${time}:00+05:30`);
};

exports.listDoctors = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { specialty, location, language, search, minExperience } = req.query;

  const query = {
    role: 'doctor',
    isActive: true,
    'doctorProfile.verifiedByAdmin': true,
  };

  if (specialty) query['doctorProfile.specialty'] = new RegExp(escapeRegex(specialty), 'i');
  if (location) query['doctorProfile.location'] = new RegExp(location, 'i');
  if (language) query['doctorProfile.languages'] = language;
  if (minExperience) query['doctorProfile.experienceYears'] = { $gte: Number(minExperience) };
  if (search) {
    query.$or = [
      { fullName: new RegExp(search, 'i') },
      { 'doctorProfile.specialty': new RegExp(search, 'i') },
      { 'doctorProfile.location': new RegExp(search, 'i') },
    ];
  }

  const [doctors, total] = await Promise.all([
    User.find(query)
      .select('-password')
      .sort({ 'doctorProfile.rating': -1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(query),
  ]);

  return res.json({
    success: true,
    page,
    limit,
    total,
    doctors,
  });
});

exports.getDoctorById = asyncHandler(async (req, res) => {
  const doctor = await User.findOne({
    _id: req.params.id,
    role: 'doctor',
    isActive: true,
  }).select('-password');

  if (!doctor) {
    throw new ApiError(404, 'Doctor not found');
  }

  return res.json({ success: true, doctor });
});

exports.updateDoctorProfile = asyncHandler(async (req, res) => {
  const updates = req.body;
  req.user.doctorProfile = {
    ...req.user.doctorProfile,
    ...updates,
    verifiedByAdmin: req.user.doctorProfile.verifiedByAdmin,
  };

  await req.user.save();

  return res.json({
    success: true,
    message: 'Doctor profile updated',
    doctorProfile: req.user.doctorProfile,
  });
});

exports.upsertAvailability = asyncHandler(async (req, res) => {
  const { date, timezone = 'Asia/Kolkata', slots = [] } = req.body;

  if (!date || !Array.isArray(slots) || slots.length === 0) {
    throw new ApiError(400, 'date and slots are required');
  }

  const normalizedSlots = slots.map((slot) => {
    const startAt = parseDateTime(date, slot.time);
    const endAt = new Date(startAt.getTime() + 30 * 60 * 1000);
    return {
      time: slot.time,
      startAt,
      endAt,
      status: 'AVAILABLE',
      bookedBy: null,
      appointmentId: null,
    };
  });

  const availability = await DoctorAvailability.findOneAndUpdate(
    { doctorId: req.user._id, date },
    {
      doctorId: req.user._id,
      date,
      timezone,
      slots: normalizedSlots,
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  );

  return res.json({
    success: true,
    message: 'Availability saved',
    availability,
  });
});

exports.getDoctorAvailability = asyncHandler(async (req, res) => {
  const { date } = req.query;
  const query = {
    doctorId: req.params.id,
    ...(date ? { date } : {}),
  };

  const availability = await DoctorAvailability.find(query).sort({ date: 1 });
  return res.json({ success: true, availability });
});
