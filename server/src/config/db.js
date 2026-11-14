/**
 * CarrerSync Database Connection Service
 * Uses Mongoose to connect to MongoDB Atlas (Free Tier).
 * Handles missing configuration and connection failures gracefully without crashing the server.
 */

const mongoose = require('mongoose');
const env = require('./env');

/**
 * Returns human-readable database connection status: "connected" or "disconnected"
 * Mongoose readyState values:
 * 0 = disconnected
 * 1 = connected
 * 2 = connecting
 * 3 = disconnecting
 */
const getDatabaseStatus = () => {
  return mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
};

const connectDB = async () => {
  if (!env.MONGODB_URI) {
    console.info('[Database] MONGODB_URI is not provided. Running in disconnected mode.');
    return;
  }

  try {
    console.info('[Database] Connecting to MongoDB...');
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.info('[Database] MongoDB connected successfully.');
  } catch (error) {
    console.error(`[Database Error] Failed to connect to MongoDB: ${error.message}`);
    console.info('[Database] Server continues running with database in disconnected state.');
  }
};

// Event listeners for Mongoose connection lifecycle
mongoose.connection.on('disconnected', () => {
  console.warn('[Database] MongoDB connection lost.');
});

mongoose.connection.on('reconnected', () => {
  console.info('[Database] MongoDB reconnected.');
});

mongoose.connection.on('error', (err) => {
  console.error(`[Database] Connection error: ${err.message}`);
});

module.exports = {
  connectDB,
  getDatabaseStatus,
};
