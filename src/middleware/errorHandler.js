/**
 * Error handling middleware for FleetLink API
 */

const mongoose = require('mongoose');

/**
 * Async handler wrapper to catch errors in async route handlers
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Express middleware function
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Custom error class for application errors
 */
class AppError extends Error {
  constructor(message, statusCode = 500, type = 'ServerError') {
    super(message);
    this.statusCode = statusCode;
    this.type = type;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Create standardized error response
 * @param {Error} error - Error object
 * @param {Object} req - Express request object
 * @returns {Object} Standardized error response
 */
const createErrorResponse = (error, req) => {
  const errorResponse = {
    success: false,
    error: {
      message: error.message || 'An unexpected error occurred',
      type: error.type || 'ServerError'
    },
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method
  };

  // Add error details in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = error.stack;
    errorResponse.error.details = error.details || null;
  }

  return errorResponse;
};

/**
 * Handle MongoDB validation errors
 * @param {Error} error - Mongoose validation error
 * @returns {AppError} Formatted application error
 */
const handleValidationError = (error) => {
  const errors = Object.values(error.errors).map(err => ({
    field: err.path,
    message: err.message,
    value: err.value
  }));

  const message = `Validation failed: ${errors.map(e => e.message).join(', ')}`;
  
  const appError = new AppError(message, 400, 'ValidationError');
  appError.details = errors;
  return appError;
};

/**
 * Handle MongoDB cast errors (invalid ObjectId, etc.)
 * @param {Error} error - Mongoose cast error
 * @returns {AppError} Formatted application error
 */
const handleCastError = (error) => {
  const message = `Invalid ${error.path}: ${error.value}`;
  return new AppError(message, 400, 'ValidationError');
};

/**
 * Handle MongoDB duplicate key errors
 * @param {Error} error - MongoDB duplicate key error
 * @returns {AppError} Formatted application error
 */
const handleDuplicateKeyError = (error) => {
  const field = Object.keys(error.keyValue)[0];
  const value = error.keyValue[field];
  const message = `Duplicate value for ${field}: ${value}. This value already exists.`;
  return new AppError(message, 409, 'ConflictError');
};

/**
 * Handle express-validator errors
 * @param {Array} errors - Array of validation errors from express-validator
 * @returns {AppError} Formatted application error
 */
const handleExpressValidatorErrors = (errors) => {
  const validationErrors = errors.map(error => ({
    field: error.param || error.path,
    message: error.msg,
    value: error.value
  }));

  const message = `Validation failed: ${validationErrors.map(e => e.message).join(', ')}`;
  
  const appError = new AppError(message, 400, 'ValidationError');
  appError.details = validationErrors;
  return appError;
};

/**
 * Global error handling middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for debugging (except validation errors)
  if (process.env.NODE_ENV !== 'test' && err.statusCode !== 400) {
    console.error('Error:', {
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });
  }

  // Handle specific error types
  if (err.name === 'ValidationError') {
    error = handleValidationError(err);
  } else if (err.name === 'CastError') {
    error = handleCastError(err);
  } else if (err.code === 11000) {
    error = handleDuplicateKeyError(err);
  } else if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid token', 401, 'AuthenticationError');
  } else if (err.name === 'TokenExpiredError') {
    error = new AppError('Token expired', 401, 'AuthenticationError');
  } else if (err.name === 'MongoServerError' && err.code === 11000) {
    error = handleDuplicateKeyError(err);
  } else if (err.name === 'MongoNetworkError') {
    error = new AppError('Database connection error', 503, 'ServiceUnavailableError');
  }

  // Set default values for unknown errors
  if (!error.statusCode) {
    error.statusCode = 500;
  }
  if (!error.type) {
    error.type = 'ServerError';
  }

  // Handle rate limiting errors
  if (err.message && err.message.includes('Too many requests')) {
    error.statusCode = 429;
    error.type = 'RateLimitError';
  }

  // Create standardized response
  const errorResponse = createErrorResponse(error, req);

  res.status(error.statusCode).json(errorResponse);
};

/**
 * Handle 404 errors for non-existent routes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const notFoundHandler = (req, res, next) => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404, 'NotFoundError');
  next(error);
};

/**
 * Validation error handler for express-validator
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const handleValidationErrors = (req, res, next) => {
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const error = handleExpressValidatorErrors(errors.array());
    return next(error);
  }

  next();
};

module.exports = {
  asyncHandler,
  errorHandler,
  notFoundHandler,
  handleValidationErrors,
  AppError
};
