const mongoose = require('mongoose');

let cachedConnection = null;
let cachedPromise = null;
let hasErrorListener = false;

const connectDB = async () => {
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }

  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is missing in environment variables');
  }

  if (!cachedPromise) {
    cachedPromise = mongoose
      .connect(process.env.MONGO_URI, {
        maxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE || 20),
        minPoolSize: Number(process.env.MONGO_MIN_POOL_SIZE || 2),
        serverSelectionTimeoutMS: 10000,
      })
      .then((connection) => {
        if (!hasErrorListener) {
          mongoose.connection.on('error', (err) => {
            console.error('Mongo connection error', err);
          });
          hasErrorListener = true;
        }

        console.log('MongoDB connected');
        return connection;
      })
      .catch((error) => {
        cachedPromise = null;
        throw error;
      });
  }

  cachedConnection = await cachedPromise;
  return cachedConnection;
};

module.exports = connectDB;
