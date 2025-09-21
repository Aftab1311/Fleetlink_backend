/**
 * Vehicle controller - handles HTTP requests for vehicle operations
 */

const vehicleService = require('../services/vehicleService');
const { asyncHandler } = require('../middleware/errorHandler');
const { validatePagination } = require('../utils/validationUtils');

/**
 * @desc    Create a new vehicle
 * @route   POST /api/vehicles
 * @access  Public (in production, this should be protected)
 */
const createVehicle = asyncHandler(async (req, res) => {
  const vehicle = await vehicleService.createVehicle(req.body);

  res.status(201).json({
    success: true,
    message: 'Vehicle created successfully',
    data: vehicle,
    timestamp: new Date().toISOString()
  });
});

/**
 * @desc    Get all vehicles with optional filters
 * @route   GET /api/vehicles
 * @access  Public
 */
const getVehicles = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    isActive,
    vehicleType,
    minCapacity,
    maxCapacity,
    search
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
  if (isActive !== undefined) {
    filters.isActive = isActive === 'true';
  }
  if (vehicleType) {
    filters.vehicleType = vehicleType.toLowerCase();
  }
  if (minCapacity) {
    filters.minCapacity = parseInt(minCapacity, 10);
  }
  if (maxCapacity) {
    filters.maxCapacity = parseInt(maxCapacity, 10);
  }
  if (search) {
    filters.search = search.trim();
  }

  const result = await vehicleService.getVehicles(filters, {
    page: paginationValidation.normalizedPage,
    limit: paginationValidation.normalizedLimit
  });

  res.status(200).json({
    success: true,
    message: 'Vehicles retrieved successfully',
    data: result.vehicles,
    pagination: result.pagination,
    filters,
    timestamp: new Date().toISOString()
  });
});

/**
 * @desc    Get single vehicle by ID
 * @route   GET /api/vehicles/:id
 * @access  Public
 */
const getVehicleById = asyncHandler(async (req, res) => {
  const vehicle = await vehicleService.getVehicleById(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Vehicle retrieved successfully',
    data: vehicle,
    timestamp: new Date().toISOString()
  });
});

/**
 * @desc    Update vehicle
 * @route   PUT /api/vehicles/:id
 * @access  Public (in production, this should be protected)
 */
const updateVehicle = asyncHandler(async (req, res) => {
  const vehicle = await vehicleService.updateVehicle(req.params.id, req.body);

  res.status(200).json({
    success: true,
    message: 'Vehicle updated successfully',
    data: vehicle,
    timestamp: new Date().toISOString()
  });
});

/**
 * @desc    Delete vehicle (soft delete)
 * @route   DELETE /api/vehicles/:id
 * @access  Public (in production, this should be protected)
 */
const deleteVehicle = asyncHandler(async (req, res) => {
  const result = await vehicleService.deleteVehicle(req.params.id);

  res.status(200).json({
    success: true,
    message: result.message,
    timestamp: new Date().toISOString()
  });
});

/**
 * @desc    Find available vehicles
 * @route   GET /api/vehicles/available
 * @access  Public
 */
const findAvailableVehicles = asyncHandler(async (req, res) => {
  const {
    capacityRequired,
    fromPincode,
    toPincode,
    startTime,
    vehicleType,
    includeEnhancedDuration = false
  } = req.query;

  // Parse and validate startTime
  const parsedStartTime = new Date(startTime);
  if (isNaN(parsedStartTime.getTime())) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Invalid start time format. Please use ISO 8601 format.',
        type: 'ValidationError'
      },
      timestamp: new Date().toISOString()
    });
  }

  const searchParams = {
    capacityRequired: parseInt(capacityRequired, 10),
    fromPincode: fromPincode.toString(),
    toPincode: toPincode.toString(),
    startTime: parsedStartTime,
    vehicleType: vehicleType ? vehicleType.toLowerCase() : undefined,
    includeEnhancedDuration: includeEnhancedDuration === 'true'
  };

  const result = await vehicleService.findAvailableVehicles(searchParams);

  res.status(200).json({
    success: true,
    message: `Found ${result.totalAvailable} available vehicles out of ${result.totalSuitable} suitable vehicles`,
    data: {
      availableVehicles: result.availableVehicles,
      estimatedRideDurationHours: result.estimatedRideDurationHours,
      totalAvailable: result.totalAvailable,
      totalSuitable: result.totalSuitable
    },
    searchParams: result.searchParams,
    timestamp: new Date().toISOString()
  });
});

/**
 * @desc    Get vehicle statistics
 * @route   GET /api/vehicles/stats
 * @access  Public (in production, this should be protected)
 */
const getVehicleStats = asyncHandler(async (req, res) => {
  const stats = await vehicleService.getVehicleStats();

  res.status(200).json({
    success: true,
    message: 'Vehicle statistics retrieved successfully',
    data: stats,
    timestamp: new Date().toISOString()
  });
});

/**
 * @desc    Search vehicles by name or registration
 * @route   GET /api/vehicles/search
 * @access  Public
 */
const searchVehicles = asyncHandler(async (req, res) => {
  const { q: query, page = 1, limit = 10 } = req.query;

  if (!query || query.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Search query is required',
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

  const result = await vehicleService.getVehicles(
    { search: query.trim() },
    {
      page: paginationValidation.normalizedPage,
      limit: paginationValidation.normalizedLimit
    }
  );

  res.status(200).json({
    success: true,
    message: `Found ${result.pagination.totalItems} vehicles matching "${query}"`,
    data: result.vehicles,
    pagination: result.pagination,
    searchQuery: query.trim(),
    timestamp: new Date().toISOString()
  });
});

/**
 * @desc    Get vehicles by type
 * @route   GET /api/vehicles/type/:type
 * @access  Public
 */
const getVehiclesByType = asyncHandler(async (req, res) => {
  const { type } = req.params;
  const { page = 1, limit = 10, isActive = 'true' } = req.query;

  // Validate vehicle type
  const validTypes = ['truck', 'van', 'pickup', 'trailer', 'motorcycle', 'other'];
  const normalizedType = type.toLowerCase();
  
  if (!validTypes.includes(normalizedType)) {
    return res.status(400).json({
      success: false,
      error: {
        message: `Invalid vehicle type. Must be one of: ${validTypes.join(', ')}`,
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

  const filters = {
    vehicleType: normalizedType,
    isActive: isActive === 'true'
  };

  const result = await vehicleService.getVehicles(filters, {
    page: paginationValidation.normalizedPage,
    limit: paginationValidation.normalizedLimit
  });

  res.status(200).json({
    success: true,
    message: `Found ${result.pagination.totalItems} ${normalizedType} vehicles`,
    data: result.vehicles,
    pagination: result.pagination,
    filters,
    timestamp: new Date().toISOString()
  });
});

module.exports = {
  createVehicle,
  getVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
  findAvailableVehicles,
  getVehicleStats,
  searchVehicles,
  getVehiclesByType
};

