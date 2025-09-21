/**
 * Booking controller - handles HTTP requests for booking operations
 */

const bookingService = require('../services/bookingService');
const { asyncHandler } = require('../middleware/errorHandler');
const { validatePagination } = require('../utils/validationUtils');

/**
 * @desc    Create a new booking
 * @route   POST /api/bookings
 * @access  Public (in production, this should require authentication)
 */
const createBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.createBooking(req.body);

  res.status(201).json({
    success: true,
    message: 'Booking created successfully',
    data: booking,
    timestamp: new Date().toISOString()
  });
});

/**
 * @desc    Get all bookings with optional filters
 * @route   GET /api/bookings
 * @access  Public (in production, this should be protected)
 */
const getBookings = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    status,
    vehicleId,
    customerId,
    fromDate,
    toDate,
    fromPincode,
    toPincode
  } = req.query;

  // Validate pagination
  const paginationValidation = validatePagination({ page, limit });
  if (!paginationValidation.isValid) {
    return res.status(400).json({
      success: false,
      error: {
        message: paginationValidation.message,
        type: 'ValidationError'
      },
      timestamp: new Date().toISOString()
    });
  }

  // Build filters
  const filters = {};
  if (status) {
    filters.status = status.toLowerCase();
  }
  if (vehicleId) {
    filters.vehicleId = vehicleId;
  }
  if (customerId) {
    filters.customerId = customerId;
  }
  if (fromPincode) {
    filters.fromPincode = fromPincode;
  }
  if (toPincode) {
    filters.toPincode = toPincode;
  }
  if (fromDate) {
    filters.fromDate = new Date(fromDate);
  }
  if (toDate) {
    filters.toDate = new Date(toDate);
  }

  const result = await bookingService.getBookings(filters, {
    page: paginationValidation.normalizedPage,
    limit: paginationValidation.normalizedLimit
  });

  res.status(200).json({
    success: true,
    message: 'Bookings retrieved successfully',
    data: result.bookings,
    pagination: result.pagination,
    filters,
    timestamp: new Date().toISOString()
  });
});

/**
 * @desc    Get single booking by ID
 * @route   GET /api/bookings/:id
 * @access  Public (in production, this should require authentication)
 */
const getBookingById = asyncHandler(async (req, res) => {
  const booking = await bookingService.getBookingById(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Booking retrieved successfully',
    data: booking,
    timestamp: new Date().toISOString()
  });
});

/**
 * @desc    Update booking status
 * @route   PATCH /api/bookings/:id/status
 * @access  Public (in production, this should require authentication)
 */
const updateBookingStatus = asyncHandler(async (req, res) => {
  const booking = await bookingService.updateBookingStatus(req.params.id, req.body);

  res.status(200).json({
    success: true,
    message: 'Booking status updated successfully',
    data: booking,
    timestamp: new Date().toISOString()
  });
});

/**
 * @desc    Cancel a booking
 * @route   DELETE /api/bookings/:id
 * @access  Public (in production, this should require authentication)
 */
const cancelBooking = asyncHandler(async (req, res) => {
  const { reason = 'Cancelled by user' } = req.body;
  const booking = await bookingService.cancelBooking(req.params.id, reason);

  res.status(200).json({
    success: true,
    message: 'Booking cancelled successfully',
    data: booking,
    timestamp: new Date().toISOString()
  });
});

/**
 * @desc    Permanently delete a booking (only for completed or cancelled bookings)
 * @route   DELETE /api/bookings/:id/delete
 * @access  Public (in production, this should require authentication)
 */
const deleteBooking = asyncHandler(async (req, res) => {
  const result = await bookingService.deleteBooking(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Booking deleted successfully',
    data: result,
    timestamp: new Date().toISOString()
  });
});

/**
 * @desc    Get customer bookings
 * @route   GET /api/bookings/customer/:customerId
 * @access  Public (in production, this should require authentication and authorization)
 */
const getCustomerBookings = asyncHandler(async (req, res) => {
  const { customerId } = req.params;
  const {
    status,
    fromDate,
    toDate,
    page = 1,
    limit = 10
  } = req.query;

  // Validate pagination
  const paginationValidation = validatePagination({ page, limit });
  if (!paginationValidation.isValid) {
    return res.status(400).json({
      success: false,
      error: {
        message: paginationValidation.message,
        type: 'ValidationError'
      },
      timestamp: new Date().toISOString()
    });
  }

  const options = {
    page: paginationValidation.normalizedPage,
    limit: paginationValidation.normalizedLimit
  };

  if (status) {
    options.status = status.toLowerCase();
  }
  if (fromDate) {
    options.fromDate = new Date(fromDate);
  }
  if (toDate) {
    options.toDate = new Date(toDate);
  }

  const result = await bookingService.getCustomerBookings(customerId, options);

  res.status(200).json({
    success: true,
    message: `Customer bookings retrieved successfully`,
    data: result.bookings,
    pagination: result.pagination,
    customerId,
    filters: { status, fromDate, toDate },
    timestamp: new Date().toISOString()
  });
});

/**
 * @desc    Get vehicle bookings
 * @route   GET /api/bookings/vehicle/:vehicleId
 * @access  Public (in production, this should be protected)
 */
const getVehicleBookings = asyncHandler(async (req, res) => {
  const { vehicleId } = req.params;
  const {
    status,
    fromDate,
    toDate,
    page = 1,
    limit = 10
  } = req.query;

  // Validate pagination
  const paginationValidation = validatePagination({ page, limit });
  if (!paginationValidation.isValid) {
    return res.status(400).json({
      success: false,
      error: {
        message: paginationValidation.message,
        type: 'ValidationError'
      },
      timestamp: new Date().toISOString()
    });
  }

  const options = {
    page: paginationValidation.normalizedPage,
    limit: paginationValidation.normalizedLimit
  };

  if (status) {
    options.status = status.toLowerCase();
  }
  if (fromDate) {
    options.fromDate = new Date(fromDate);
  }
  if (toDate) {
    options.toDate = new Date(toDate);
  }

  const result = await bookingService.getVehicleBookings(vehicleId, options);

  res.status(200).json({
    success: true,
    message: `Vehicle bookings retrieved successfully`,
    data: result.bookings,
    pagination: result.pagination,
    vehicleId,
    filters: { status, fromDate, toDate },
    timestamp: new Date().toISOString()
  });
});

/**
 * @desc    Get booking statistics
 * @route   GET /api/bookings/stats
 * @access  Public (in production, this should be protected)
 */
const getBookingStats = asyncHandler(async (req, res) => {
  const { fromDate, toDate } = req.query;

  const filters = {};
  if (fromDate) {
    filters.fromDate = new Date(fromDate);
  }
  if (toDate) {
    filters.toDate = new Date(toDate);
  }

  const stats = await bookingService.getBookingStats(filters);

  res.status(200).json({
    success: true,
    message: 'Booking statistics retrieved successfully',
    data: stats,
    filters,
    timestamp: new Date().toISOString()
  });
});

/**
 * @desc    Check booking conflicts
 * @route   POST /api/bookings/check-conflicts
 * @access  Public
 */
const checkBookingConflicts = asyncHandler(async (req, res) => {
  const { vehicleId, startTime, endTime, excludeBookingId } = req.body;

  if (!vehicleId || !startTime || !endTime) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'vehicleId, startTime, and endTime are required',
        type: 'ValidationError'
      },
      timestamp: new Date().toISOString()
    });
  }

  const parsedStartTime = new Date(startTime);
  const parsedEndTime = new Date(endTime);

  if (isNaN(parsedStartTime.getTime()) || isNaN(parsedEndTime.getTime())) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Invalid date format. Please use ISO 8601 format.',
        type: 'ValidationError'
      },
      timestamp: new Date().toISOString()
    });
  }

  if (parsedEndTime <= parsedStartTime) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'End time must be after start time',
        type: 'ValidationError'
      },
      timestamp: new Date().toISOString()
    });
  }

  const conflicts = await bookingService.checkBookingConflicts(
    vehicleId,
    parsedStartTime,
    parsedEndTime,
    excludeBookingId
  );

  res.status(200).json({
    success: true,
    message: conflicts.length > 0 ? 'Conflicts found' : 'No conflicts found',
    data: {
      hasConflicts: conflicts.length > 0,
      conflictCount: conflicts.length,
      conflicts
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * @desc    Get upcoming bookings
 * @route   GET /api/bookings/upcoming
 * @access  Public (in production, this should be protected)
 */
const getUpcomingBookings = asyncHandler(async (req, res) => {
  const { limit = 50 } = req.query;

  const limitNum = parseInt(limit, 10);
  if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Limit must be a number between 1 and 100',
        type: 'ValidationError'
      },
      timestamp: new Date().toISOString()
    });
  }

  const upcomingBookings = await bookingService.getUpcomingBookings({ limit: limitNum });

  res.status(200).json({
    success: true,
    message: `Found ${upcomingBookings.length} upcoming bookings in the next 24 hours`,
    data: upcomingBookings,
    count: upcomingBookings.length,
    timestamp: new Date().toISOString()
  });
});

/**
 * @desc    Get bookings by status
 * @route   GET /api/bookings/status/:status
 * @access  Public (in production, this should be protected)
 */
const getBookingsByStatus = asyncHandler(async (req, res) => {
  const { status } = req.params;
  const { page = 1, limit = 10 } = req.query;

  // Validate status
  const validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];
  const normalizedStatus = status.toLowerCase();
  
  if (!validStatuses.includes(normalizedStatus)) {
    return res.status(400).json({
      success: false,
      error: {
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        type: 'ValidationError'
      },
      timestamp: new Date().toISOString()
    });
  }

  // Validate pagination
  const paginationValidation = validatePagination({ page, limit });
  if (!paginationValidation.isValid) {
    return res.status(400).json({
      success: false,
      error: {
        message: paginationValidation.message,
        type: 'ValidationError'
      },
      timestamp: new Date().toISOString()
    });
  }

  const result = await bookingService.getBookings(
    { status: normalizedStatus },
    {
      page: paginationValidation.normalizedPage,
      limit: paginationValidation.normalizedLimit
    }
  );

  res.status(200).json({
    success: true,
    message: `Found ${result.pagination.totalItems} ${normalizedStatus} bookings`,
    data: result.bookings,
    pagination: result.pagination,
    status: normalizedStatus,
    timestamp: new Date().toISOString()
  });
});

module.exports = {
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
};
