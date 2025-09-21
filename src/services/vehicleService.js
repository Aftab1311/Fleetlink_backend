/**
 * Vehicle service layer - handles business logic for vehicle operations
 */

const Vehicle = require('../models/Vehicle');
const Booking = require('../models/Booking');
const { calculateEstimatedDuration, calculateEndTime, calculateEnhancedDuration } = require('../utils/timeUtils');
const { AppError } = require('../middleware/errorHandler');

class VehicleService {
  /**
   * Create a new vehicle
   * @param {Object} vehicleData - Vehicle data
   * @returns {Promise<Object>} Created vehicle
   */
  async createVehicle(vehicleData) {
    try {
      // Check for duplicate registration number if provided
      if (vehicleData.registrationNumber) {
        const existingVehicle = await Vehicle.findOne({ 
          registrationNumber: vehicleData.registrationNumber 
        });
        
        if (existingVehicle) {
          throw new AppError(
            `Vehicle with registration number ${vehicleData.registrationNumber} already exists`,
            409,
            'DuplicateError'
          );
        }
      }

      const vehicle = new Vehicle(vehicleData);
      await vehicle.save();
      
      return vehicle.toObject();
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Failed to create vehicle: ${error.message}`, 500);
    }
  }

  /**
   * Get all vehicles with optional filters and pagination
   * @param {Object} filters - Filter options
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>} Vehicles with pagination info
   */
  async getVehicles(filters = {}, pagination = {}) {
    try {
      const { page = 1, limit = 10 } = pagination;
      const skip = (page - 1) * limit;

      // Build query
      const query = {};
      
      if (filters.isActive !== undefined) {
        query.isActive = filters.isActive;
      }
      
      if (filters.vehicleType) {
        query.vehicleType = filters.vehicleType;
      }
      
      if (filters.minCapacity) {
        query.capacityKg = { $gte: filters.minCapacity };
      }
      
      if (filters.maxCapacity) {
        query.capacityKg = { ...query.capacityKg, $lte: filters.maxCapacity };
      }
      
      if (filters.search) {
        query.$text = { $search: filters.search };
      }

      // Execute query with pagination
      const [vehicles, total] = await Promise.all([
        Vehicle.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Vehicle.countDocuments(query)
      ]);

      return {
        vehicles,
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
      throw new AppError(`Failed to fetch vehicles: ${error.message}`, 500);
    }
  }

  /**
   * Get vehicle by ID
   * @param {string} vehicleId - Vehicle ID
   * @returns {Promise<Object>} Vehicle data
   */
  async getVehicleById(vehicleId) {
    try {
      const vehicle = await Vehicle.findById(vehicleId).lean();
      
      if (!vehicle) {
        throw new AppError('Vehicle not found', 404, 'NotFoundError');
      }
      
      return vehicle;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Failed to fetch vehicle: ${error.message}`, 500);
    }
  }

  /**
   * Update vehicle
   * @param {string} vehicleId - Vehicle ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated vehicle
   */
  async updateVehicle(vehicleId, updateData) {
    try {
      // Check if vehicle exists
      const existingVehicle = await Vehicle.findById(vehicleId);
      if (!existingVehicle) {
        throw new AppError('Vehicle not found', 404, 'NotFoundError');
      }

      // Check for duplicate registration number if updating
      if (updateData.registrationNumber && 
          updateData.registrationNumber !== existingVehicle.registrationNumber) {
        const duplicateVehicle = await Vehicle.findOne({ 
          registrationNumber: updateData.registrationNumber,
          _id: { $ne: vehicleId }
        });
        
        if (duplicateVehicle) {
          throw new AppError(
            `Vehicle with registration number ${updateData.registrationNumber} already exists`,
            409,
            'DuplicateError'
          );
        }
      }

      const updatedVehicle = await Vehicle.findByIdAndUpdate(
        vehicleId,
        updateData,
        { new: true, runValidators: true }
      ).lean();

      return updatedVehicle;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Failed to update vehicle: ${error.message}`, 500);
    }
  }

  /**
   * Delete vehicle (soft delete by setting isActive to false)
   * @param {string} vehicleId - Vehicle ID
   * @returns {Promise<Object>} Result message
   */
  async deleteVehicle(vehicleId) {
    try {
      const vehicle = await Vehicle.findById(vehicleId);
      
      if (!vehicle) {
        throw new AppError('Vehicle not found', 404, 'NotFoundError');
      }

      // Check for active bookings
      const activeBookings = await Booking.countDocuments({
        vehicleId,
        status: { $in: ['pending', 'confirmed', 'in_progress'] },
        endTime: { $gt: new Date() }
      });

      if (activeBookings > 0) {
        throw new AppError(
          'Cannot delete vehicle with active bookings. Please cancel or complete all bookings first.',
          409,
          'ConflictError'
        );
      }

      // Soft delete by setting isActive to false
      await Vehicle.findByIdAndUpdate(vehicleId, { isActive: false });

      return { message: 'Vehicle successfully deactivated' };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Failed to delete vehicle: ${error.message}`, 500);
    }
  }

  /**
   * Find available vehicles based on capacity and time requirements
   * @param {Object} searchParams - Search parameters
   * @returns {Promise<Object>} Available vehicles with duration info
   */
  async findAvailableVehicles(searchParams) {
    try {
      const { 
        capacityRequired, 
        fromPincode, 
        toPincode, 
        startTime,
        vehicleType,
        includeEnhancedDuration = false
      } = searchParams;

      // Calculate estimated ride duration
      const estimatedRideDurationHours = calculateEstimatedDuration(fromPincode, toPincode);
      const endTime = calculateEndTime(startTime, estimatedRideDurationHours);

      // Build vehicle query
      const vehicleQuery = {
        capacityKg: { $gte: capacityRequired },
        isActive: true
      };

      if (vehicleType) {
        vehicleQuery.vehicleType = vehicleType;
      }

      // Find vehicles that meet capacity requirements
      const suitableVehicles = await Vehicle.find(vehicleQuery).lean();

      if (suitableVehicles.length === 0) {
        return {
          availableVehicles: [],
          estimatedRideDurationHours,
          searchParams: {
            capacityRequired,
            fromPincode,
            toPincode,
            startTime,
            endTime
          },
          message: 'No vehicles found matching capacity requirements'
        };
      }

      // Check availability for each vehicle (exclude overlapping bookings)
      const availabilityPromises = suitableVehicles.map(async (vehicle) => {
        const overlappingBookings = await Booking.findOverlappingBookings(
          vehicle._id,
          startTime,
          endTime
        );

        const isAvailable = overlappingBookings.length === 0;

        if (isAvailable) {
          // Calculate enhanced duration if requested
          let enhancedDuration = null;
          if (includeEnhancedDuration) {
            enhancedDuration = calculateEnhancedDuration(fromPincode, toPincode, {
              vehicleType: vehicle.vehicleType,
              trafficFactor: 1.2,
              includeLoadingTime: true
            });
          }

          return {
            ...vehicle,
            isAvailable: true,
            estimatedRideDurationHours,
            enhancedDurationHours: enhancedDuration,
            estimatedEndTime: endTime
          };
        }

        return null;
      });

      const availabilityResults = await Promise.all(availabilityPromises);
      const availableVehicles = availabilityResults.filter(vehicle => vehicle !== null);

      // Sort by capacity (ascending) and then by creation date (newest first)
      availableVehicles.sort((a, b) => {
        if (a.capacityKg !== b.capacityKg) {
          return a.capacityKg - b.capacityKg;
        }
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

      return {
        availableVehicles,
        estimatedRideDurationHours,
        totalAvailable: availableVehicles.length,
        totalSuitable: suitableVehicles.length,
        searchParams: {
          capacityRequired,
          fromPincode,
          toPincode,
          startTime,
          endTime
        }
      };
    } catch (error) {
      throw new AppError(`Failed to find available vehicles: ${error.message}`, 500);
    }
  }

  /**
   * Get vehicle statistics
   * @returns {Promise<Object>} Vehicle statistics
   */
  async getVehicleStats() {
    try {
      const [
        totalVehicles,
        activeVehicles,
        vehiclesByType,
        averageCapacity,
        capacityDistribution
      ] = await Promise.all([
        Vehicle.countDocuments(),
        Vehicle.countDocuments({ isActive: true }),
        Vehicle.aggregate([
          { $group: { _id: '$vehicleType', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]),
        Vehicle.aggregate([
          { $match: { isActive: true } },
          { $group: { _id: null, avgCapacity: { $avg: '$capacityKg' } } }
        ]),
        Vehicle.aggregate([
          { $match: { isActive: true } },
          {
            $bucket: {
              groupBy: '$capacityKg',
              boundaries: [0, 1000, 5000, 10000, 25000, 50000, 100000],
              default: 'Other',
              output: { count: { $sum: 1 } }
            }
          }
        ])
      ]);

      return {
        totalVehicles,
        activeVehicles,
        inactiveVehicles: totalVehicles - activeVehicles,
        vehiclesByType: vehiclesByType.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        averageCapacity: averageCapacity[0]?.avgCapacity || 0,
        capacityDistribution
      };
    } catch (error) {
      throw new AppError(`Failed to fetch vehicle statistics: ${error.message}`, 500);
    }
  }
}

module.exports = new VehicleService();

