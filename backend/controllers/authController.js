const User = require('../models/User');
const roles = require('../constants/roles');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { signToken } = require('../utils/jwt');
const { issueOtp, verifyOtp } = require('../services/otpService');

const PUBLIC_REGISTRATION_ROLES = new Set([roles.PATIENT, roles.DOCTOR, roles.PHARMACY]);

const sanitizeUser = (user) => ({
  id: user._id,
  fullName: user.fullName,
  email: user.email || null,
  phone: user.phone || null,
  role: user.role,
  isVerified: user.isVerified,
  profile: user.profile || {},
  doctorProfile: user.doctorProfile || {},
  pharmacyProfile: user.pharmacyProfile || {},
});

exports.register = asyncHandler(async (req, res) => {
  const { fullName, email, phone, password, role = roles.PATIENT } = req.body;
  const normalizedEmail = email ? String(email).trim().toLowerCase() : undefined;
  const normalizedPhone = phone ? String(phone).trim() : undefined;
  const normalizedRole = String(role || roles.PATIENT).toLowerCase();

  if (!fullName) {
    throw new ApiError(400, 'fullName is required');
  }

  if (!normalizedEmail && !normalizedPhone) {
    throw new ApiError(400, 'Either email or phone is required');
  }

  if (!password || String(password).length < 6) {
    throw new ApiError(400, 'password must be at least 6 characters');
  }

  if (!PUBLIC_REGISTRATION_ROLES.has(normalizedRole)) {
    throw new ApiError(400, 'Invalid role for self registration');
  }

  const existing = await User.findOne({
    $or: [
      ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
      ...(normalizedPhone ? [{ phone: normalizedPhone }] : []),
    ],
  });

  if (existing) {
    throw new ApiError(409, 'Registration failed. Please try again.');
  }

  const user = await User.create({
    fullName,
    email: normalizedEmail,
    phone: normalizedPhone,
    password,
    role: normalizedRole,
    isVerified: normalizedRole === roles.DOCTOR ? false : true,
  });

  const token = signToken(user);

  return res.status(201).json({
    success: true,
    message: 'User registered successfully',
    token,
    user: sanitizeUser(user),
  });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, phone, password } = req.body;
  const normalizedEmail = email ? String(email).trim().toLowerCase() : undefined;
  const normalizedPhone = phone ? String(phone).trim() : undefined;

  if ((!email && !phone) || !password) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const user = await User.findOne({
    $or: [
      ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
      ...(normalizedPhone ? [{ phone: normalizedPhone }] : []),
    ],
  });

  if (!user) {
    throw new ApiError(401, 'Invalid credentials');
  }

  if (!user.password) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid credentials');
  }

  user.lastLoginAt = new Date();
  await user.save();

  const token = signToken(user);

  return res.json({
    success: true,
    token,
    user: sanitizeUser(user),
  });
});

exports.sendOtpCode = asyncHandler(async (req, res) => {
  const { phone, purpose = 'login' } = req.body;
  if (!phone) {
    throw new ApiError(400, 'phone is required');
  }

  const normalizedPhone = String(phone).trim();
  const { code, expiresAt } = await issueOtp({ phone: normalizedPhone, purpose });

  return res.json({
    success: true,
    message: 'OTP sent successfully',
    expiresAt,
    ...(process.env.NODE_ENV !== 'production' ? { devOtp: code } : {}),
  });
});

exports.verifyOtpCode = asyncHandler(async (req, res) => {
  const { phone, code, purpose = 'login', fullName = 'User', role = roles.PATIENT } = req.body;
  const normalizedPhone = phone ? String(phone).trim() : '';
  const normalizedRole = String(role || roles.PATIENT).toLowerCase();

  if (!phone || !code) {
    throw new ApiError(400, 'phone and code are required');
  }

  if (!PUBLIC_REGISTRATION_ROLES.has(normalizedRole)) {
    throw new ApiError(400, 'Invalid role for OTP registration');
  }

  const result = await verifyOtp({ phone: normalizedPhone, code, purpose });
  if (!result.isValid) {
    throw new ApiError(400, result.reason);
  }

  let user = await User.findOne({ phone: normalizedPhone });
  if (!user) {
    user = await User.create({
      phone: normalizedPhone,
      fullName,
      role: normalizedRole,
      isVerified: normalizedRole === roles.DOCTOR ? false : true,
    });
  }

  user.lastLoginAt = new Date();
  await user.save();

  const token = signToken(user);
  return res.json({
    success: true,
    token,
    user: sanitizeUser(user),
  });
});

exports.getMe = asyncHandler(async (req, res) => {
  return res.json({
    success: true,
    user: sanitizeUser(req.user),
  });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const allowed = ['fullName', 'email', 'profile'];
  allowed.forEach((key) => {
    if (req.body[key] !== undefined) {
      if (key === 'email') {
        req.user[key] = String(req.body[key]).trim().toLowerCase();
      } else {
        req.user[key] = req.body[key];
      }
    }
  });

  await req.user.save();

  return res.json({
    success: true,
    message: 'Profile updated successfully',
    user: sanitizeUser(req.user),
  });
});
