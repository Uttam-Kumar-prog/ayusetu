require('dotenv').config();

const app = require('../app');
const connectDB = require('../config/db');

let readyPromise = null;

module.exports = async (req, res) => {
  try {
    if (!readyPromise) {
      readyPromise = connectDB();
    }
    await readyPromise;
    return app(req, res);
  } catch (error) {
    readyPromise = null;
    console.error('Backend bootstrap failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Server initialization failed',
    });
  }
};
