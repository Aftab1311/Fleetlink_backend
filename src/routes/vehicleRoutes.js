/**
 * Vehicle routes - defines all vehicle-related API endpoints
 */

const express = require('express');
const {
  createVehicle,
  getVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
  findAvailableVehicles,
  getVehicleStats,
  searchVehicles,
  getVehiclesByType
} = require('../controllers/vehicleController');

const {
  validateCreateVehicle,
  validateUpdateVehicle,
  validateVehicleAvailability,
  validateObjectIdParam,
  validateSearchQuery
} = require('../middleware/validation');

const { handleValidationErrors } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * @route   POST /api/vehicles
 * @desc    Create a new vehicle
 * @access  Public (should be protected in production)
 */
router.post('/', 
  validateCreateVehicle,
  handleValidationErrors,
  createVehicle
);

/**
 * @route   GET /api/vehicles
 * @desc    Get all vehicles with optional filters
 * @access  Public
 */
router.get('/', getVehicles);

/**
 * @route   GET /api/vehicles/available
 * @desc    Find available vehicles based on capacity and time requirements
 * @access  Public
 * @note    This route must come before /api/vehicles/:id to avoid conflicts
 */
router.get('/available',
  validateVehicleAvailability,
  handleValidationErrors,
  findAvailableVehicles
);

/**
 * @route   GET /api/vehicles/stats
 * @desc    Get vehicle statistics
 * @access  Public (should be protected in production)
 * @note    This route must come before /api/vehicles/:id to avoid conflicts
 */
router.get('/stats', getVehicleStats);

/**
 * @route   GET /api/vehicles/search
 * @desc    Search vehicles by name or registration
 * @access  Public
 * @note    This route must come before /api/vehicles/:id to avoid conflicts
 */
router.get('/search',
  validateSearchQuery,
  handleValidationErrors,
  searchVehicles
);

/**
 * @route   GET /api/vehicles/type/:type
 * @desc    Get vehicles by type
 * @access  Public
 * @note    This route must come before /api/vehicles/:id to avoid conflicts
 */
router.get('/type/:type', getVehiclesByType);

/**
 * @route   GET /api/vehicles/:id
 * @desc    Get single vehicle by ID
 * @access  Public
 */
router.get('/:id',
  validateObjectIdParam,
  handleValidationErrors,
  getVehicleById
);

/**
 * @route   PUT /api/vehicles/:id
 * @desc    Update vehicle
 * @access  Public (should be protected in production)
 */
router.put('/:id',
  validateUpdateVehicle,
  handleValidationErrors,
  updateVehicle
);

/**
 * @route   DELETE /api/vehicles/:id
 * @desc    Delete vehicle (soft delete)
 * @access  Public (should be protected in production)
 */
router.delete('/:id',
  validateObjectIdParam,
  handleValidationErrors,
  deleteVehicle
);

module.exports = router;

