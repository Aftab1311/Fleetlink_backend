const mongoose = require('mongoose');

// Cache the connection to avoid multiple connections in serverless environment
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  try {
    // If already connected, return the existing connection
    if (cached.conn) {
      return cached.conn;
    }

    // If connection is in progress, wait for it
    if (cached.promise) {
      return await cached.promise;
    }

    const mongoURI = process.env.NODE_ENV === 'test' 
      ? process.env.MONGODB_TEST_URI 
      : process.env.MONGODB_URI || 'mongodb://localhost:27017/fleetlink';

    const options = {
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      bufferCommands: true, // Enable buffering for serverless environments
      bufferMaxEntries: 0 // Disable mongoose buffering
    };

    cached.promise = mongoose.connect(mongoURI, options);
    const conn = await cached.promise;

    // Cache the connection
    cached.conn = conn;

    if (process.env.NODE_ENV !== 'test') {
      console.log(`MongoDB Connected: ${conn.connection.host}:${conn.connection.port}`);
      console.log(`Database: ${conn.connection.name}`);
    }

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      cached.conn = null; // Clear cache on error
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
      cached.conn = null; // Clear cache on disconnect
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
      cached.conn = mongoose.connection; // Update cache on reconnect
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed through app termination');
        process.exit(0);
      } catch (err) {
        console.error('Error closing MongoDB connection:', err);
        process.exit(1);
      }
    });

    return conn;

  } catch (error) {
    console.error('Database connection failed:', error.message);
    cached.promise = null; // Clear promise on error
    throw error; // Don't exit in serverless environment
  }
};

module.exports = connectDB;

