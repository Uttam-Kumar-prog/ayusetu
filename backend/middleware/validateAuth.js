const { validationResult } = require('express-validator');

module.exports = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  // Keep auth responses intentionally generic to avoid leaking validation hints.
  const isLogin = req.path === '/login';
  const isRegister = req.path === '/register';

  let message = 'Authentication failed. Please try again.';
  if (isLogin) {
    message = 'Login failed. Please check your credentials.';
  } else if (isRegister) {
    message = 'Registration failed. Please try again.';
  }

  return res.status(400).json({
    success: false,
    message,
  });
};
