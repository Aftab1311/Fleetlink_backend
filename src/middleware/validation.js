/**
 * Request validation middleware using express-validator
 */

const { body, param, query } = require('express-validator');
const { validatePincode, validateObjectId } = require('../utils/validationUtils');

/**
 * Validation rules for creating a vehicle
 */
const validateCreateVehicle = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Vehicle name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Vehicle name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z0-9\s\-_]+$/)
    .withMessage('Vehicle name can only contain letters, numbers, spaces, hyphens, and underscores'),

  body('capacityKg')
    .notEmpty()
    .withMessage('Vehicle capacity is required')
    .isInt({ min: 1, max: 100000 })
    .withMessage('Vehicle capacity must be an integer between 1 and 100,000 kg')
    .toInt(),

  body('tyres')
    .notEmpty()
    .withMessage('Number of tyres is required')
    .isInt({ min: 2, max: 20 })
    .withMessage('Number of tyres must be an integer between 2 and 20')
    .toInt(),

  body('vehicleType')
    .optional()
    .toLowerCase()
    .isIn(['truck', 'van', 'pickup', 'trailer', 'motorcycle', 'other'])
    .withMessage('Vehicle type must be one of: truck, van, pickup, trailer, motorcycle, other'),

  body('registrationNumber')
    .optional()
    .trim()
    .toUpperCase()
    .matches(/^[A-Z0-9\-\s]+$/)
    .withMessage('Registration number can only contain letters, numbers, hyphens and spaces')
    .isLength({ max: 20 })
    .withMessage('Registration number cannot exceed 20 characters'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value')
    .toBoolean()
];

/**
 * Validation rules for updating a vehicle
 */
const validateUpdateVehicle = [
  param('id')
    .custom((value) => {
      const validation = validateObjectId(value);
      if (!validation.isValid) {
        throw new Error(validation.message);
      }
      return true;
    }),

  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Vehicle name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z0-9\s\-_]+$/)
    .withMessage('Vehicle name can only contain letters, numbers, spaces, hyphens, and underscores'),

  body('capacityKg')
    .optional()
    .isInt({ min: 1, max: 100000 })
    .withMessage('Vehicle capacity must be an integer between 1 and 100,000 kg')
    .toInt(),

  body('tyres')
    .optional()
    .isInt({ min: 2, max: 20 })
    .withMessage('Number of tyres must be an integer between 2 and 20')
    .toInt(),

  body('vehicleType')
    .optional()
    .toLowerCase()
    .isIn(['truck', 'van', 'pickup', 'trailer', 'motorcycle', 'other'])
    .withMessage('Vehicle type must be one of: truck, van, pickup, trailer, motorcycle, other'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value')
    .toBoolean()
];

/**
 * Validation rules for vehicle availability search
 */
const validateVehicleAvailability = [
  query('capacityRequired')
    .notEmpty()
    .withMessage('Capacity required is mandatory')
    .isInt({ min: 1, max: 100000 })
    .withMessage('Capacity required must be an integer between 1 and 100,000 kg')
    .toInt(),

  query('fromPincode')
    .notEmpty()
    .withMessage('From pincode is required')
    .custom((value) => {
      const validation = validatePincode(value);
      if (!validation.isValid) {
        throw new Error(validation.message);
      }
      return true;
    }),

  query('toPincode')
    .notEmpty()
    .withMessage('To pincode is required')
    .custom((value) => {
      const validation = validatePincode(value);
      if (!validation.isValid) {
        throw new Error(validation.message);
      }
      return true;
    }),

  query('startTime')
    .notEmpty()
    .withMessage('Start time is required')
    .isISO8601()
    .withMessage('Start time must be a valid ISO 8601 date')
    .custom((value) => {
      const startTime = new Date(value);
      const now = new Date();
      const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
      
      if (startTime < fiveMinutesFromNow) {
        throw new Error('Start time must be at least 5 minutes from now');
      }
      
      const oneYearFromNow = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
      if (startTime > oneYearFromNow) {
        throw new Error('Start time cannot be more than 1 year from now');
      }
      
      return true;
    })
    .toDate(),

  query('vehicleType')
    .optional()
    .toLowerCase()
    .isIn(['truck', 'van', 'pickup', 'trailer', 'motorcycle', 'other'])
    .withMessage('Vehicle type must be one of: truck, van, pickup, trailer, motorcycle, other'),

  query('includeEnhancedDuration')
    .optional()
    .isBoolean()
    .withMessage('includeEnhancedDuration must be a boolean')
    .toBoolean()
];

/**
 * Validation rules for creating a booking
 */
const validateCreateBooking = [
  body('vehicleId')
    .notEmpty()
    .withMessage('Vehicle ID is required')
    .custom((value) => {
      const validation = validateObjectId(value);
      if (!validation.isValid) {
        throw new Error(validation.message);
      }
      return true;
    }),

  body('customerId')
    .trim()
    .notEmpty()
    .withMessage('Customer ID is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Customer ID must be between 1 and 100 characters')
    .matches(/^[a-zA-Z0-9\-_.@]+$/)
    .withMessage('Customer ID can only contain letters, numbers, hyphens, underscores, dots, and @ symbols'),

  body('fromPincode')
    .notEmpty()
    .withMessage('From pincode is required')
    .custom((value) => {
      const validation = validatePincode(value);
      if (!validation.isValid) {
        throw new Error(validation.message);
      }
      return true;
    }),

  body('toPincode')
    .notEmpty()
    .withMessage('To pincode is required')
    .custom((value) => {
      const validation = validatePincode(value);
      if (!validation.isValid) {
        throw new Error(validation.message);
      }
      return true;
    }),

  body('startTime')
    .notEmpty()
    .withMessage('Start time is required')
    .isISO8601()
    .withMessage('Start time must be a valid ISO 8601 date')
    .custom((value) => {
      const startTime = new Date(value);
      const now = new Date();
      const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
      
      if (startTime < fiveMinutesFromNow) {
        throw new Error('Start time must be at least 5 minutes from now');
      }
      
      return true;
    })
    .toDate(),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters'),

  body('estimatedCost')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Estimated cost must be a non-negative number')
    .toFloat()
];

/**
 * Validation rules for updating booking status
 */
const validateUpdateBookingStatus = [
  param('id')
    .custom((value) => {
      const validation = validateObjectId(value);
      if (!validation.isValid) {
        throw new Error(validation.message);
      }
      return true;
    }),

  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .toLowerCase()
    .isIn(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'])
    .withMessage('Status must be one of: pending, confirmed, in_progress, completed, cancelled'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
];

/**
 * Validation rules for getting bookings with filters
 */
const validateGetBookings = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be an integer between 1 and 100')
    .toInt(),

  query('status')
    .optional()
    .toLowerCase()
    .isIn(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'])
    .withMessage('Status must be one of: pending, confirmed, in_progress, completed, cancelled'),

  query('vehicleId')
    .optional()
    .custom((value) => {
      const validation = validateObjectId(value);
      if (!validation.isValid) {
        throw new Error(validation.message);
      }
      return true;
    }),

  query('customerId')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Customer ID must be between 1 and 100 characters'),

  query('fromDate')
    .optional()
    .isISO8601()
    .withMessage('From date must be a valid ISO 8601 date')
    .toDate(),

  query('toDate')
    .optional()
    .isISO8601()
    .withMessage('To date must be a valid ISO 8601 date')
    .toDate(),

  query('fromPincode')
    .optional()
    .custom((value) => {
      if (value) {
        const validation = validatePincode(value);
        if (!validation.isValid) {
          throw new Error(validation.message);
        }
      }
      return true;
    }),

  query('toPincode')
    .optional()
    .custom((value) => {
      if (value) {
        const validation = validatePincode(value);
        if (!validation.isValid) {
          throw new Error(validation.message);
        }
      }
      return true;
    })
];

/**
 * Validation rules for ObjectId parameters
 */
const validateObjectIdParam = [
  param('id')
    .custom((value) => {
      const validation = validateObjectId(value);
      if (!validation.isValid) {
        throw new Error(validation.message);
      }
      return true;
    })
];

/**
 * Validation rules for search queries
 */
const validateSearchQuery = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters')
    .escape(), // Sanitize HTML characters

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be an integer between 1 and 50')
    .toInt()
];

module.exports = {
  validateCreateVehicle,
  validateUpdateVehicle,
  validateVehicleAvailability,
  validateCreateBooking,
  validateUpdateBookingStatus,
  validateGetBookings,
  validateObjectIdParam,
  validateSearchQuery
};

