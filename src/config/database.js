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
      : process.env.MONGODB_URI;
    if (!mongoURI) {
      const errorMsg = process.env.NODE_ENV === 'production' 
        ? 'MONGODB_URI environment variable is not set in production'
        : 'MONGODB_URI environment variable is not set. Please check your .env file';
      console.error('❌ Database Configuration Error:', errorMsg);
      throw new Error(errorMsg);
    }

    console.log('🔗 Attempting to connect to MongoDB...');
    console.log('📍 Environment:', process.env.NODE_ENV || 'development');
    console.log('🔐 URI configured:', mongoURI ? 'Yes' : 'No');
    console.log('🔗 Connection URI:', mongoURI);

    const options = {
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 30000, // Keep trying to send operations for 30 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      connectTimeoutMS: 30000, // Connection timeout
      bufferCommands: true, // Enable buffering for serverless environments
      retryWrites: true, // Retry writes on network errors
      retryReads: true, // Retry reads on network errors
      maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
      heartbeatFrequencyMS: 10000 // Send heartbeat every 10 seconds
    };

    console.log('🚀 Starting MongoDB connection...');
    cached.promise = mongoose.connect(mongoURI, options);
    const conn = await cached.promise;
    console.log('✅ MongoDB connection established successfully');

    // Cache the connection
    cached.conn = conn;

    // Wait for connection to be ready
    await new Promise((resolve, reject) => {
      if (conn.connection.readyState === 1) {
        resolve();
      } else {
        conn.connection.once('open', resolve);
        conn.connection.once('error', reject);
        // Timeout after 30 seconds
        setTimeout(() => reject(new Error('Connection timeout')), 30000);
      }
    });

    if (process.env.NODE_ENV !== 'test') {
      console.log(`MongoDB Connected: ${conn.connection.host}:${conn.connection.port}`);
      console.log(`Database: ${conn.connection.name}`);
      console.log(`Connection State: ${conn.connection.readyState}`);
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
    console.error('❌ Database connection failed:', error.message);
    console.error('🔍 Error details:', {
      name: error.name,
      code: error.code,
      message: error.message
    });
    
    // Provide specific error messages based on error type
    if (error.message.includes('MONGODB_URI')) {
      console.error('💡 Solution: Set MONGODB_URI environment variable in Vercel dashboard');
    } else if (error.code === 'ENOTFOUND') {
      console.error('💡 Solution: Check MongoDB connection string and network access');
    } else if (error.code === 'EAUTH') {
      console.error('💡 Solution: Check MongoDB username and password');
    }
    
    cached.promise = null; // Clear promise on error
    throw error; // Don't exit in serverless environment
  }
};

// Health check function
const checkConnection = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      return true;
    }
    return false;
  } catch (error) {
    console.error('Connection health check failed:', error);
    return false;
  }
};

module.exports = { connectDB, checkConnection };

