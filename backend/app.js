const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(helmet());
app.use(compression());
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || '*' }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX || 200),
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.AUTH_RATE_LIMIT_MAX || 25),
  standardHeaders: true,
  legacyHeaders: false,
});

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'AyuSetu backend is healthy',
    timestamp: new Date().toISOString(),
  });
});

// Runtime-safe DB readiness guard.
// This ensures requests do not hit mongoose models before a connection exists,
// even when the deployment runtime boots app.js directly.
app.use(async (req, res, next) => {
  if (req.path === '/health') {
    return next();
  }

  try {
    await connectDB();
    return next();
  } catch (error) {
    return next(error);
  }
});

app.use(globalLimiter);
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/symptoms', require('./routes/symptoms'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/doctors', require('./routes/doctors'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/prescriptions', require('./routes/prescriptions'));
app.use('/api/therapy', require('./routes/therapy'));
app.use('/api/pharmacy', require('./routes/pharmacy'));
app.use('/api/chats', require('./routes/chats'));
app.use('/api/admin', require('./routes/admin'));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
