/**
 * Validation utility functions for FleetLink backend
 */

/**
 * Validate pincode format
 * 
 * @param {string|number} pincode - Pincode to validate
 * @returns {Object} Validation result with isValid and message
 */
const validatePincode = (pincode) => {
  try {
    const pincodeStr = pincode.toString().trim();
    
    if (!pincodeStr) {
      return {
        isValid: false,
        message: 'Pincode is required'
      };
    }
    
    if (!/^\d{6}$/.test(pincodeStr)) {
      return {
        isValid: false,
        message: 'Pincode must be exactly 6 digits'
      };
    }
    
    const pincodeNum = parseInt(pincodeStr, 10);
    if (pincodeNum < 100000 || pincodeNum > 999999) {
      return {
        isValid: false,
        message: 'Pincode must be between 100000 and 999999'
      };
    }
    
    return {
      isValid: true,
      message: 'Pincode is valid',
      normalizedPincode: pincodeStr
    };
  } catch (error) {
    return {
      isValid: false,
      message: 'Invalid pincode format'
    };
  }
};

/**
 * Validate MongoDB ObjectId
 * 
 * @param {string} id - ID to validate
 * @returns {Object} Validation result
 */
const validateObjectId = (id) => {
  const mongoose = require('mongoose');
  
  if (!id) {
    return {
      isValid: false,
      message: 'ID is required'
    };
  }
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return {
      isValid: false,
      message: 'Invalid ID format'
    };
  }
  
  return {
    isValid: true,
    message: 'ID is valid'
  };
};

/**
 * Validate vehicle capacity
 * 
 * @param {number} capacity - Capacity in kg
 * @returns {Object} Validation result
 */
const validateCapacity = (capacity) => {
  if (capacity === undefined || capacity === null) {
    return {
      isValid: false,
      message: 'Capacity is required'
    };
  }
  
  const capacityNum = Number(capacity);
  
  if (isNaN(capacityNum)) {
    return {
      isValid: false,
      message: 'Capacity must be a number'
    };
  }
  
  if (!Number.isInteger(capacityNum)) {
    return {
      isValid: false,
      message: 'Capacity must be an integer'
    };
  }
  
  if (capacityNum < 1) {
    return {
      isValid: false,
      message: 'Capacity must be at least 1 kg'
    };
  }
  
  if (capacityNum > 100000) {
    return {
      isValid: false,
      message: 'Capacity cannot exceed 100,000 kg'
    };
  }
  
  return {
    isValid: true,
    message: 'Capacity is valid',
    normalizedCapacity: capacityNum
  };
};

/**
 * Validate number of tyres
 * 
 * @param {number} tyres - Number of tyres
 * @returns {Object} Validation result
 */
const validateTyres = (tyres) => {
  if (tyres === undefined || tyres === null) {
    return {
      isValid: false,
      message: 'Number of tyres is required'
    };
  }
  
  const tyresNum = Number(tyres);
  
  if (isNaN(tyresNum)) {
    return {
      isValid: false,
      message: 'Number of tyres must be a number'
    };
  }
  
  if (!Number.isInteger(tyresNum)) {
    return {
      isValid: false,
      message: 'Number of tyres must be an integer'
    };
  }
  
  if (tyresNum < 2) {
    return {
      isValid: false,
      message: 'Vehicle must have at least 2 tyres'
    };
  }
  
  if (tyresNum > 20) {
    return {
      isValid: false,
      message: 'Vehicle cannot have more than 20 tyres'
    };
  }
  
  return {
    isValid: true,
    message: 'Number of tyres is valid',
    normalizedTyres: tyresNum
  };
};

/**
 * Validate vehicle name
 * 
 * @param {string} name - Vehicle name
 * @returns {Object} Validation result
 */
const validateVehicleName = (name) => {
  if (!name) {
    return {
      isValid: false,
      message: 'Vehicle name is required'
    };
  }
  
  const trimmedName = name.toString().trim();
  
  if (trimmedName.length < 2) {
    return {
      isValid: false,
      message: 'Vehicle name must be at least 2 characters long'
    };
  }
  
  if (trimmedName.length > 100) {
    return {
      isValid: false,
      message: 'Vehicle name cannot exceed 100 characters'
    };
  }
  
  // Check for valid characters (letters, numbers, spaces, hyphens, underscores)
  if (!/^[a-zA-Z0-9\s\-_]+$/.test(trimmedName)) {
    return {
      isValid: false,
      message: 'Vehicle name can only contain letters, numbers, spaces, hyphens, and underscores'
    };
  }
  
  return {
    isValid: true,
    message: 'Vehicle name is valid',
    normalizedName: trimmedName
  };
};

/**
 * Validate customer ID
 * 
 * @param {string} customerId - Customer ID
 * @returns {Object} Validation result
 */
const validateCustomerId = (customerId) => {
  if (!customerId) {
    return {
      isValid: false,
      message: 'Customer ID is required'
    };
  }
  
  const trimmedId = customerId.toString().trim();
  
  if (trimmedId.length < 1) {
    return {
      isValid: false,
      message: 'Customer ID cannot be empty'
    };
  }
  
  if (trimmedId.length > 100) {
    return {
      isValid: false,
      message: 'Customer ID cannot exceed 100 characters'
    };
  }
  
  // Allow alphanumeric characters, hyphens, underscores, and dots
  if (!/^[a-zA-Z0-9\-_.@]+$/.test(trimmedId)) {
    return {
      isValid: false,
      message: 'Customer ID can only contain letters, numbers, hyphens, underscores, dots, and @ symbols'
    };
  }
  
  return {
    isValid: true,
    message: 'Customer ID is valid',
    normalizedCustomerId: trimmedId
  };
};

/**
 * Validate booking status
 * 
 * @param {string} status - Booking status
 * @returns {Object} Validation result
 */
const validateBookingStatus = (status) => {
  const validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];
  
  if (!status) {
    return {
      isValid: false,
      message: 'Status is required'
    };
  }
  
  const lowerStatus = status.toString().toLowerCase().trim();
  
  if (!validStatuses.includes(lowerStatus)) {
    return {
      isValid: false,
      message: `Status must be one of: ${validStatuses.join(', ')}`
    };
  }
  
  return {
    isValid: true,
    message: 'Status is valid',
    normalizedStatus: lowerStatus
  };
};

/**
 * Validate vehicle type
 * 
 * @param {string} vehicleType - Vehicle type
 * @returns {Object} Validation result
 */
const validateVehicleType = (vehicleType) => {
  const validTypes = ['truck', 'van', 'pickup', 'trailer', 'motorcycle', 'other'];
  
  if (!vehicleType) {
    // Vehicle type is optional, default to 'truck'
    return {
      isValid: true,
      message: 'Vehicle type is valid (using default)',
      normalizedVehicleType: 'truck'
    };
  }
  
  const lowerType = vehicleType.toString().toLowerCase().trim();
  
  if (!validTypes.includes(lowerType)) {
    return {
      isValid: false,
      message: `Vehicle type must be one of: ${validTypes.join(', ')}`
    };
  }
  
  return {
    isValid: true,
    message: 'Vehicle type is valid',
    normalizedVehicleType: lowerType
  };
};

/**
 * Validate pagination parameters
 * 
 * @param {Object} params - Pagination parameters
 * @param {number} params.page - Page number
 * @param {number} params.limit - Items per page
 * @returns {Object} Validation result with normalized values
 */
const validatePagination = (params = {}) => {
  const { page = 1, limit = 10 } = params;
  
  const pageNum = Number(page);
  const limitNum = Number(limit);
  
  // Validate page
  if (isNaN(pageNum) || pageNum < 1 || !Number.isInteger(pageNum)) {
    return {
      isValid: false,
      message: 'Page must be a positive integer starting from 1'
    };
  }
  
  // Validate limit
  if (isNaN(limitNum) || limitNum < 1 || limitNum > 100 || !Number.isInteger(limitNum)) {
    return {
      isValid: false,
      message: 'Limit must be a positive integer between 1 and 100'
    };
  }
  
  return {
    isValid: true,
    message: 'Pagination parameters are valid',
    normalizedPage: pageNum,
    normalizedLimit: limitNum,
    skip: (pageNum - 1) * limitNum
  };
};

/**
 * Sanitize and validate search query
 * 
 * @param {string} query - Search query
 * @returns {Object} Validation result
 */
const validateSearchQuery = (query) => {
  if (!query) {
    return {
      isValid: false,
      message: 'Search query is required'
    };
  }
  
  const trimmedQuery = query.toString().trim();
  
  if (trimmedQuery.length < 1) {
    return {
      isValid: false,
      message: 'Search query cannot be empty'
    };
  }
  
  if (trimmedQuery.length > 100) {
    return {
      isValid: false,
      message: 'Search query cannot exceed 100 characters'
    };
  }
  
  // Remove potentially dangerous characters for text search
  const sanitizedQuery = trimmedQuery.replace(/[<>\"'&]/g, '');
  
  return {
    isValid: true,
    message: 'Search query is valid',
    sanitizedQuery
  };
};

/**
 * Validate multiple fields at once
 * 
 * @param {Object} fields - Object with field names and values
 * @param {Array} validations - Array of validation functions
 * @returns {Object} Combined validation result
 */
const validateFields = (fields, validations) => {
  const errors = {};
  const normalizedFields = {};
  
  for (const [fieldName, validator] of Object.entries(validations)) {
    if (typeof validator === 'function') {
      const result = validator(fields[fieldName]);
      
      if (!result.isValid) {
        errors[fieldName] = result.message;
      } else {
        // Store normalized value if available
        const normalizedKey = Object.keys(result).find(key => key.startsWith('normalized'));
        if (normalizedKey) {
          normalizedFields[fieldName] = result[normalizedKey];
        }
      }
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    normalizedFields
  };
};

module.exports = {
  validatePincode,
  validateObjectId,
  validateCapacity,
  validateTyres,
  validateVehicleName,
  validateCustomerId,
  validateBookingStatus,
  validateVehicleType,
  validatePagination,
  validateSearchQuery,
  validateFields
};

