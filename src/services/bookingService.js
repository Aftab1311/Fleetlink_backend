/**
 * Booking service layer - handles business logic for booking operations
 */

const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Vehicle = require('../models/Vehicle');
const { calculateEstimatedDuration, calculateEndTime, calculateEnhancedDuration } = require('../utils/timeUtils');
const { AppError } = require('../middleware/errorHandler');

class BookingService {
  /**
   * Create a new booking with availability check
   * @param {Object} bookingData - Booking data
   * @returns {Promise<Object>} Created booking
   */
  async createBooking(bookingData) {
    try {
      const { vehicleId, fromPincode, toPincode, startTime, customerId, endTime, estimatedRideDurationHours } = bookingData;

      // Verify vehicle exists and is active
      const vehicle = await Vehicle.findById(vehicleId);
      if (!vehicle) {
        throw new AppError('Vehicle not found', 404, 'NotFoundError');
      }

      if (!vehicle.isActive) {
        throw new AppError('Vehicle is not active and cannot be booked', 400, 'ValidationError');
      }

      // Use provided duration and endTime from frontend, or calculate if not provided
      const finalDuration = estimatedRideDurationHours || calculateEstimatedDuration(fromPincode, toPincode);
      const finalEndTime = endTime || calculateEndTime(startTime, finalDuration);

      // Check for overlapping bookings
      const overlappingBookings = await Booking.findOverlappingBookings(
        vehicleId,
        startTime,
        finalEndTime
      );

      if (overlappingBookings.length > 0) {
        throw new AppError(
          'Vehicle is not available for the selected time slot. Please choose a different time or vehicle.',
          409,
          'ConflictError'
        );
      }

      // Create booking object
      const booking = new Booking({
        ...bookingData,
        endTime: finalEndTime,
        estimatedRideDurationHours: finalDuration,
        status: 'confirmed'
      });

      // Save booking
      await booking.save();

      // Populate vehicle details and return
      const populatedBooking = await Booking.findById(booking._id)
        .populate('vehicleId', 'name capacityKg tyres vehicleType')
        .lean();

      return populatedBooking;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Failed to create booking: ${error.message}`, 500);
    }
  }

  /**
   * Get bookings with filters and pagination
   * @param {Object} filters - Filter options
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>} Bookings with pagination info
   */
  async getBookings(filters = {}, pagination = {}) {
    try {
      const { page = 1, limit = 10 } = pagination;
      const skip = (page - 1) * limit;

      // Build query
      const query = {};
      
      if (filters.status) {
        query.status = filters.status;
      }
      
      if (filters.vehicleId) {
        query.vehicleId = filters.vehicleId;
      }
      
      if (filters.customerId) {
        query.customerId = filters.customerId;
      }
      
      if (filters.fromPincode) {
        query.fromPincode = filters.fromPincode;
      }
      
      if (filters.toPincode) {
        query.toPincode = filters.toPincode;
      }
      
      if (filters.fromDate || filters.toDate) {
        query.startTime = {};
        if (filters.fromDate) {
          query.startTime.$gte = filters.fromDate;
        }
        if (filters.toDate) {
          query.startTime.$lte = filters.toDate;
        }
      }

      // Execute query with pagination
      const [bookings, total] = await Promise.all([
        Booking.find(query)
          .populate('vehicleId', 'name capacityKg tyres vehicleType registrationNumber')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Booking.countDocuments(query)
      ]);

      return {
        bookings,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
          hasNextPage: page < Math.ceil(total / limit),
          hasPreviousPage: page > 1
        }
      };
    } catch (error) {
      throw new AppError(`Failed to fetch bookings: ${error.message}`, 500);
    }
  }

  /**
   * Get booking by ID
   * @param {string} bookingId - Booking ID
   * @returns {Promise<Object>} Booking data
   */
  async getBookingById(bookingId) {
    try {
      const booking = await Booking.findById(bookingId)
        .populate('vehicleId', 'name capacityKg tyres vehicleType registrationNumber')
        .lean();
      
      if (!booking) {
        throw new AppError('Booking not found', 404, 'NotFoundError');
      }
      
      return booking;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Failed to fetch booking: ${error.message}`, 500);
    }
  }

  /**
   * Update booking status
   * @param {string} bookingId - Booking ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated booking
   */
  async updateBookingStatus(bookingId, updateData) {
    try {
      const { status, notes } = updateData;

      // Get current booking
      const currentBooking = await Booking.findById(bookingId);
      if (!currentBooking) {
        throw new AppError('Booking not found', 404, 'NotFoundError');
      }

      // Validate status transition
      const validTransitions = {
        pending: ['confirmed', 'cancelled'],
        confirmed: ['in_progress', 'cancelled'],
        in_progress: ['completed', 'cancelled'],
        completed: [], // Cannot change from completed
        cancelled: [] // Cannot change from cancelled
      };

      const allowedStatuses = validTransitions[currentBooking.status] || [];
      if (!allowedStatuses.includes(status)) {
        throw new AppError(
          `Cannot change booking status from '${currentBooking.status}' to '${status}'`,
          400,
          'ValidationError'
        );
      }

      // Additional validation for cancellation
      if (status === 'cancelled' && !currentBooking.canBeCancelled()) {
        throw new AppError(
          'Booking cannot be cancelled. It must be at least 1 hour before start time.',
          400,
          'ValidationError'
        );
      }

      // Update booking
      const updateFields = { status };
      if (notes) {
        updateFields.notes = notes;
      }

      // Set actual times based on status
      const now = new Date();
      if (status === 'in_progress' && !currentBooking.actualStartTime) {
        updateFields.actualStartTime = now;
      }
      if (status === 'completed' && !currentBooking.actualEndTime) {
        updateFields.actualEndTime = now;
      }

      const updatedBooking = await Booking.findByIdAndUpdate(
        bookingId,
        updateFields,
        { new: true, runValidators: true }
      ).populate('vehicleId', 'name capacityKg tyres vehicleType registrationNumber');

      return updatedBooking.toObject();
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Failed to update booking: ${error.message}`, 500);
    }
  }

  /**
   * Cancel a booking
   * @param {string} bookingId - Booking ID
   * @param {string} reason - Cancellation reason
   * @returns {Promise<Object>} Cancelled booking
   */
  async cancelBooking(bookingId, reason = 'Cancelled by user') {
    try {
      const booking = await Booking.findById(bookingId);
      
      if (!booking) {
        throw new AppError('Booking not found', 404, 'NotFoundError');
      }

      if (!booking.canBeCancelled()) {
        throw new AppError(
          'Booking cannot be cancelled. It must be at least 1 hour before start time and in pending or confirmed status.',
          400,
          'ValidationError'
        );
      }

      return await this.updateBookingStatus(bookingId, {
        status: 'cancelled',
        notes: reason
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Failed to cancel booking: ${error.message}`, 500);
    }
  }

  /**
   * Permanently delete a booking (only for completed or cancelled bookings)
   * @param {string} bookingId - Booking ID
   * @returns {Promise<Object>} Deleted booking info
   */
  async deleteBooking(bookingId) {
    try {
      const booking = await Booking.findById(bookingId);
      
      if (!booking) {
        throw new AppError('Booking not found', 404, 'NotFoundError');
      }

      // Only allow deletion of completed or cancelled bookings
      if (!['completed', 'cancelled'].includes(booking.status)) {
        throw new AppError(
          'Booking can only be deleted if it is completed or cancelled',
          400,
          'ValidationError'
        );
      }

      const deletedBooking = await Booking.findByIdAndDelete(bookingId);
      
      if (!deletedBooking) {
        throw new AppError('Failed to delete booking', 500, 'InternalError');
      }

      return {
        id: deletedBooking._id,
        status: deletedBooking.status,
        deletedAt: new Date()
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Failed to delete booking: ${error.message}`, 500);
    }
  }

  /**
   * Get customer bookings
   * @param {string} customerId - Customer ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Customer bookings
   */
  async getCustomerBookings(customerId, options = {}) {
    try {
      const { status, fromDate, toDate, page = 1, limit = 10 } = options;
      
      const query = { customerId };
      
      if (status) {
        query.status = status;
      }
      
      if (fromDate || toDate) {
        query.startTime = {};
        if (fromDate) {
          query.startTime.$gte = fromDate;
        }
        if (toDate) {
          query.startTime.$lte = toDate;
        }
      }

      const skip = (page - 1) * limit;

      const [bookings, total] = await Promise.all([
        Booking.find(query)
          .populate('vehicleId', 'name capacityKg tyres vehicleType')
          .sort({ startTime: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Booking.countDocuments(query)
      ]);

      return {
        bookings,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      };
    } catch (error) {
      throw new AppError(`Failed to fetch customer bookings: ${error.message}`, 500);
    }
  }

  /**
   * Get vehicle bookings
   * @param {string} vehicleId - Vehicle ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Vehicle bookings
   */
  async getVehicleBookings(vehicleId, options = {}) {
    try {
      const { status, fromDate, toDate, page = 1, limit = 10 } = options;
      
      const query = { vehicleId };
      
      if (status) {
        query.status = status;
      }
      
      if (fromDate || toDate) {
        query.startTime = {};
        if (fromDate) {
          query.startTime.$gte = fromDate;
        }
        if (toDate) {
          query.startTime.$lte = toDate;
        }
      }

      const skip = (page - 1) * limit;

      const [bookings, total] = await Promise.all([
        Booking.find(query)
          .sort({ startTime: 1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Booking.countDocuments(query)
      ]);

      return {
        bookings,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      };
    } catch (error) {
      throw new AppError(`Failed to fetch vehicle bookings: ${error.message}`, 500);
    }
  }

  /**
   * Get booking statistics
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Booking statistics
   */
  async getBookingStats(filters = {}) {
    try {
      const matchStage = {};
      
      if (filters.fromDate || filters.toDate) {
        matchStage.createdAt = {};
        if (filters.fromDate) {
          matchStage.createdAt.$gte = filters.fromDate;
        }
        if (filters.toDate) {
          matchStage.createdAt.$lte = filters.toDate;
        }
      }

      const [
        totalBookings,
        bookingsByStatus,
        averageDuration,
        popularRoutes,
        revenueStats
      ] = await Promise.all([
        Booking.countDocuments(matchStage),
        Booking.aggregate([
          { $match: matchStage },
          { $group: { _id: '$status', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]),
        Booking.aggregate([
          { $match: { ...matchStage, status: 'completed' } },
          { $group: { _id: null, avgDuration: { $avg: '$estimatedRideDurationHours' } } }
        ]),
        Booking.aggregate([
          { $match: matchStage },
          { $group: { 
            _id: { from: '$fromPincode', to: '$toPincode' }, 
            count: { $sum: 1 } 
          } },
          { $sort: { count: -1 } },
          { $limit: 10 }
        ]),
        Booking.aggregate([
          { $match: { ...matchStage, estimatedCost: { $exists: true } } },
          { $group: { 
            _id: null, 
            totalRevenue: { $sum: '$estimatedCost' },
            avgRevenue: { $avg: '$estimatedCost' }
          } }
        ])
      ]);

      return {
        totalBookings,
        bookingsByStatus: bookingsByStatus.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        averageDuration: averageDuration[0]?.avgDuration || 0,
        popularRoutes: popularRoutes.map(route => ({
          route: `${route._id.from} → ${route._id.to}`,
          count: route.count
        })),
        revenue: {
          total: revenueStats[0]?.totalRevenue || 0,
          average: revenueStats[0]?.avgRevenue || 0
        }
      };
    } catch (error) {
      throw new AppError(`Failed to fetch booking statistics: ${error.message}`, 500);
    }
  }

  /**
   * Check booking conflicts for a specific time range
   * @param {string} vehicleId - Vehicle ID
   * @param {Date} startTime - Start time
   * @param {Date} endTime - End time
   * @param {string} excludeBookingId - Booking ID to exclude from check
   * @returns {Promise<Array>} Conflicting bookings
   */
  async checkBookingConflicts(vehicleId, startTime, endTime, excludeBookingId = null) {
    try {
      const conflicts = await Booking.findOverlappingBookings(
        vehicleId,
        startTime,
        endTime,
        excludeBookingId
      ).populate('vehicleId', 'name')
        .lean();

      return conflicts;
    } catch (error) {
      throw new AppError(`Failed to check booking conflicts: ${error.message}`, 500);
    }
  }

  /**
   * Get upcoming bookings (next 24 hours)
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Upcoming bookings
   */
  async getUpcomingBookings(options = {}) {
    try {
      const { limit = 50 } = options;
      const now = new Date();
      const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const upcomingBookings = await Booking.find({
        startTime: {
          $gte: now,
          $lte: next24Hours
        },
        status: { $in: ['confirmed', 'pending'] }
      })
        .populate('vehicleId', 'name capacityKg vehicleType registrationNumber')
        .sort({ startTime: 1 })
        .limit(limit)
        .lean();

      return upcomingBookings;
    } catch (error) {
      throw new AppError(`Failed to fetch upcoming bookings: ${error.message}`, 500);
    }
  }
}

module.exports = new BookingService();

