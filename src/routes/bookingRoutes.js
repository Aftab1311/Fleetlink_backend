/**
 * Booking routes - defines all booking-related API endpoints
 */

const express = require('express');
const {
  createBooking,
  getBookings,
  getBookingById,
  updateBookingStatus,
  cancelBooking,
  deleteBooking,
  getCustomerBookings,
  getVehicleBookings,
  getBookingStats,
  checkBookingConflicts,
  getUpcomingBookings,
  getBookingsByStatus
} = require('../controllers/bookingController');

const {
  validateCreateBooking,
  validateUpdateBookingStatus,
  validateGetBookings,
  validateObjectIdParam
} = require('../middleware/validation');

const { handleValidationErrors } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * @route   POST /api/bookings
 * @desc    Create a new booking
 * @access  Public (should require authentication in production)
 */
router.post('/',
  validateCreateBooking,
  handleValidationErrors,
  createBooking
);

/**
 * @route   GET /api/bookings
 * @desc    Get all bookings with optional filters
 * @access  Public (should be protected in production)
 */
router.get('/',
  validateGetBookings,
  handleValidationErrors,
  getBookings
);

/**
 * @route   GET /api/bookings/stats
 * @desc    Get booking statistics
 * @access  Public (should be protected in production)
 * @note    This route must come before /api/bookings/:id to avoid conflicts
 */
router.get('/stats', getBookingStats);

/**
 * @route   GET /api/bookings/upcoming
 * @desc    Get upcoming bookings (next 24 hours)
 * @access  Public (should be protected in production)
 * @note    This route must come before /api/bookings/:id to avoid conflicts
 */
router.get('/upcoming', getUpcomingBookings);

/**
 * @route   POST /api/bookings/check-conflicts
 * @desc    Check for booking conflicts
 * @access  Public
 * @note    This route must come before /api/bookings/:id to avoid conflicts
 */
router.post('/check-conflicts', checkBookingConflicts);

/**
 * @route   GET /api/bookings/status/:status
 * @desc    Get bookings by status
 * @access  Public (should be protected in production)
 * @note    This route must come before /api/bookings/:id to avoid conflicts
 */
router.get('/status/:status', getBookingsByStatus);

/**
 * @route   GET /api/bookings/customer/:customerId
 * @desc    Get customer bookings
 * @access  Public (should require authentication and authorization in production)
 * @note    This route must come before /api/bookings/:id to avoid conflicts
 */
router.get('/customer/:customerId', getCustomerBookings);

/**
 * @route   GET /api/bookings/vehicle/:vehicleId
 * @desc    Get vehicle bookings
 * @access  Public (should be protected in production)
 * @note    This route must come before /api/bookings/:id to avoid conflicts
 */
router.get('/vehicle/:vehicleId',
  validateObjectIdParam,
  handleValidationErrors,
  getVehicleBookings
);

/**
 * @route   GET /api/bookings/:id
 * @desc    Get single booking by ID
 * @access  Public (should require authentication in production)
 */
router.get('/:id',
  validateObjectIdParam,
  handleValidationErrors,
  getBookingById
);

/**
 * @route   PATCH /api/bookings/:id/status
 * @desc    Update booking status
 * @access  Public (should require authentication in production)
 */
router.patch('/:id/status',
  validateUpdateBookingStatus,
  handleValidationErrors,
  updateBookingStatus
);

/**
 * @route   DELETE /api/bookings/:id
 * @desc    Cancel a booking
 * @access  Public (should require authentication in production)
 */
router.delete('/:id',
  validateObjectIdParam,
  handleValidationErrors,
  cancelBooking
);

/**
 * @route   DELETE /api/bookings/:id/delete
 * @desc    Permanently delete a booking (only for completed or cancelled bookings)
 * @access  Public (should require authentication in production)
 */
router.delete('/:id/delete',
  validateObjectIdParam,
  handleValidationErrors,
  deleteBooking
);

module.exports = router;

