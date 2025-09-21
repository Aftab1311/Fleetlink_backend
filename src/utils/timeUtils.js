/**
 * Utility functions for time calculations and validations
 */

/**
 * Calculate estimated ride duration based on pincode difference
 * Formula: Math.abs(parseInt(toPincode) - parseInt(fromPincode)) % 24
 * 
 * @param {string|number} fromPincode - Source pincode
 * @param {string|number} toPincode - Destination pincode
 * @returns {number} Estimated duration in hours
 */
const calculateEstimatedDuration = (fromPincode, toPincode) => {
  try {
    const from = parseInt(fromPincode.toString(), 10);
    const to = parseInt(toPincode.toString(), 10);
    
    if (isNaN(from) || isNaN(to)) {
      throw new Error('Invalid pincode format');
    }
    
    if (from < 100000 || from > 999999 || to < 100000 || to > 999999) {
      throw new Error('Pincode must be 6 digits');
    }
    
    const duration = Math.abs(to - from) % 24;
    
    // Ensure minimum duration of 0.5 hours
    return Math.max(duration, 0.5);
  } catch (error) {
    throw new Error(`Error calculating duration: ${error.message}`);
  }
};

/**
 * Calculate end time based on start time and duration
 * 
 * @param {Date|string} startTime - Start time
 * @param {number} durationHours - Duration in hours
 * @returns {Date} End time
 */
const calculateEndTime = (startTime, durationHours) => {
  try {
    const start = new Date(startTime);
    
    if (isNaN(start.getTime())) {
      throw new Error('Invalid start time');
    }
    
    if (typeof durationHours !== 'number' || durationHours <= 0) {
      throw new Error('Duration must be a positive number');
    }
    
    const durationMs = durationHours * 60 * 60 * 1000; // Convert hours to milliseconds
    return new Date(start.getTime() + durationMs);
  } catch (error) {
    throw new Error(`Error calculating end time: ${error.message}`);
  }
};

/**
 * Enhanced duration calculation with realistic factors
 * Includes traffic, distance, and vehicle type considerations
 * 
 * @param {string|number} fromPincode - Source pincode
 * @param {string|number} toPincode - Destination pincode
 * @param {Object} options - Additional options
 * @param {string} options.vehicleType - Type of vehicle
 * @param {number} options.trafficFactor - Traffic multiplier (1.0 - 2.0)
 * @param {boolean} options.includeLoadingTime - Include loading/unloading time
 * @returns {number} Enhanced estimated duration in hours
 */
const calculateEnhancedDuration = (fromPincode, toPincode, options = {}) => {
  try {
    const baseDuration = calculateEstimatedDuration(fromPincode, toPincode);
    
    let enhancedDuration = baseDuration;
    
    // Vehicle type factor
    const vehicleFactors = {
      motorcycle: 0.8,
      pickup: 1.0,
      van: 1.1,
      truck: 1.3,
      trailer: 1.5,
      other: 1.0
    };
    
    const vehicleFactor = vehicleFactors[options.vehicleType] || 1.0;
    enhancedDuration *= vehicleFactor;
    
    // Traffic factor (default 1.2 for moderate traffic)
    const trafficFactor = options.trafficFactor || 1.2;
    if (trafficFactor >= 1.0 && trafficFactor <= 3.0) {
      enhancedDuration *= trafficFactor;
    }
    
    // Loading/unloading time (add 0.5-2 hours based on distance)
    if (options.includeLoadingTime) {
      const loadingTime = Math.min(baseDuration * 0.1, 2); // 10% of base duration, max 2 hours
      enhancedDuration += Math.max(loadingTime, 0.5); // minimum 0.5 hours
    }
    
    // Round to 2 decimal places
    return Math.round(enhancedDuration * 100) / 100;
  } catch (error) {
    throw new Error(`Error calculating enhanced duration: ${error.message}`);
  }
};

/**
 * Check if two time ranges overlap
 * 
 * @param {Date} start1 - Start time of first range
 * @param {Date} end1 - End time of first range
 * @param {Date} start2 - Start time of second range
 * @param {Date} end2 - End time of second range
 * @returns {boolean} True if ranges overlap
 */
const timeRangesOverlap = (start1, end1, start2, end2) => {
  try {
    const s1 = new Date(start1);
    const e1 = new Date(end1);
    const s2 = new Date(start2);
    const e2 = new Date(end2);
    
    // Validate dates
    if ([s1, e1, s2, e2].some(date => isNaN(date.getTime()))) {
      throw new Error('Invalid date format');
    }
    
    // Check if end times are after start times
    if (e1 <= s1 || e2 <= s2) {
      throw new Error('End time must be after start time');
    }
    
    return s1 < e2 && e1 > s2;
  } catch (error) {
    throw new Error(`Error checking time overlap: ${error.message}`);
  }
};

/**
 * Validate if a date is in valid future range
 * 
 * @param {Date|string} date - Date to validate
 * @param {Object} options - Validation options
 * @param {number} options.minMinutesFromNow - Minimum minutes from current time
 * @param {number} options.maxDaysFromNow - Maximum days from current time
 * @returns {Object} Validation result with isValid and message
 */
const validateFutureDate = (date, options = {}) => {
  try {
    const targetDate = new Date(date);
    const now = new Date();
    
    if (isNaN(targetDate.getTime())) {
      return {
        isValid: false,
        message: 'Invalid date format'
      };
    }
    
    const minMinutes = options.minMinutesFromNow || 5; // Default 5 minutes buffer
    const maxDays = options.maxDaysFromNow || 365; // Default 1 year max
    
    const minTime = new Date(now.getTime() + minMinutes * 60 * 1000);
    const maxTime = new Date(now.getTime() + maxDays * 24 * 60 * 60 * 1000);
    
    if (targetDate < minTime) {
      return {
        isValid: false,
        message: `Date must be at least ${minMinutes} minutes from now`
      };
    }
    
    if (targetDate > maxTime) {
      return {
        isValid: false,
        message: `Date cannot be more than ${maxDays} days from now`
      };
    }
    
    return {
      isValid: true,
      message: 'Date is valid'
    };
  } catch (error) {
    return {
      isValid: false,
      message: `Date validation error: ${error.message}`
    };
  }
};

/**
 * Format duration in human-readable format
 * 
 * @param {number} hours - Duration in hours
 * @returns {string} Formatted duration string
 */
const formatDuration = (hours) => {
  try {
    if (typeof hours !== 'number' || hours < 0) {
      throw new Error('Hours must be a non-negative number');
    }
    
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    
    if (wholeHours === 0) {
      return `${minutes} minutes`;
    } else if (minutes === 0) {
      return `${wholeHours} hour${wholeHours !== 1 ? 's' : ''}`;
    } else {
      return `${wholeHours} hour${wholeHours !== 1 ? 's' : ''} ${minutes} minutes`;
    }
  } catch (error) {
    return 'Invalid duration';
  }
};

/**
 * Get time zone offset for consistent UTC handling
 * 
 * @returns {number} Timezone offset in minutes
 */
const getTimezoneOffset = () => {
  return new Date().getTimezoneOffset();
};

/**
 * Convert local time to UTC
 * 
 * @param {Date|string} localTime - Local time
 * @returns {Date} UTC time
 */
const toUTC = (localTime) => {
  const date = new Date(localTime);
  return new Date(date.getTime() + (date.getTimezoneOffset() * 60000));
};

/**
 * Convert UTC time to local time
 * 
 * @param {Date|string} utcTime - UTC time
 * @returns {Date} Local time
 */
const fromUTC = (utcTime) => {
  const date = new Date(utcTime);
  return new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
};

module.exports = {
  calculateEstimatedDuration,
  calculateEndTime,
  calculateEnhancedDuration,
  timeRangesOverlap,
  validateFutureDate,
  formatDuration,
  getTimezoneOffset,
  toUTC,
  fromUTC
};

