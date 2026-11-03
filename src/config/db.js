const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/devpulse';
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000,
    });
    console.log(`MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    console.warn(`MongoDB connection warning: ${err.message}. Running in memory fallback mode.`);
    return null;
  }
};

module.exports = connectDB;
