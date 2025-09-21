/**
 * Tests for time utility functions
 */

const {
  calculateEstimatedDuration,
  calculateEndTime,
  calculateEnhancedDuration,
  timeRangesOverlap,
  validateFutureDate,
  formatDuration
} = require('../../src/utils/timeUtils');

describe('Time Utils', () => {
  describe('calculateEstimatedDuration', () => {
    test('should calculate duration correctly for valid pincodes', () => {
      expect(calculateEstimatedDuration('110001', '110025')).toBe(24);
      expect(calculateEstimatedDuration('400001', '400002')).toBe(1);
      expect(calculateEstimatedDuration('560001', '560100')).toBe(99 % 24); // 3
      expect(calculateEstimatedDuration('100000', '999999')).toBe(899999 % 24); // 23
    });

    test('should handle minimum duration correctly', () => {
      expect(calculateEstimatedDuration('110001', '110001')).toBe(0.5); // Same pincode
      expect(calculateEstimatedDuration('400001', '400001')).toBe(0.5); // Same pincode
    });

    test('should throw error for invalid pincodes', () => {
      expect(() => calculateEstimatedDuration('invalid', '110001')).toThrow('Invalid pincode format');
      expect(() => calculateEstimatedDuration('12345', '110001')).toThrow('Pincode must be 6 digits');
      expect(() => calculateEstimatedDuration('1234567', '110001')).toThrow('Pincode must be 6 digits');
    });

    test('should handle string and number inputs', () => {
      expect(calculateEstimatedDuration(110001, 110025)).toBe(24);
      expect(calculateEstimatedDuration('110001', 110025)).toBe(24);
    });
  });

  describe('calculateEndTime', () => {
    test('should calculate end time correctly', () => {
      const startTime = new Date('2024-01-01T10:00:00.000Z');
      const duration = 2.5; // 2.5 hours
      const endTime = calculateEndTime(startTime, duration);
      
      expect(endTime).toEqual(new Date('2024-01-01T12:30:00.000Z'));
    });

    test('should handle different duration values', () => {
      const startTime = new Date('2024-01-01T10:00:00.000Z');
      
      expect(calculateEndTime(startTime, 1)).toEqual(new Date('2024-01-01T11:00:00.000Z'));
      expect(calculateEndTime(startTime, 0.5)).toEqual(new Date('2024-01-01T10:30:00.000Z'));
      expect(calculateEndTime(startTime, 24)).toEqual(new Date('2024-01-02T10:00:00.000Z'));
    });

    test('should throw error for invalid inputs', () => {
      expect(() => calculateEndTime('invalid-date', 2)).toThrow('Invalid start time');
      expect(() => calculateEndTime(new Date(), -1)).toThrow('Duration must be a positive number');
      expect(() => calculateEndTime(new Date(), 'invalid')).toThrow('Duration must be a positive number');
    });

    test('should handle string date inputs', () => {
      const endTime = calculateEndTime('2024-01-01T10:00:00.000Z', 2);
      expect(endTime).toEqual(new Date('2024-01-01T12:00:00.000Z'));
    });
  });

  describe('calculateEnhancedDuration', () => {
    test('should calculate enhanced duration with vehicle type factor', () => {
      const baseDuration = calculateEstimatedDuration('110001', '110025'); // 24 hours
      
      const truckDuration = calculateEnhancedDuration('110001', '110025', { vehicleType: 'truck' });
      const motorcycleDuration = calculateEnhancedDuration('110001', '110025', { vehicleType: 'motorcycle' });
      
      expect(truckDuration).toBeGreaterThan(baseDuration);
      expect(motorcycleDuration).toBeLessThan(baseDuration);
    });

    test('should apply traffic factor correctly', () => {
      const normalDuration = calculateEnhancedDuration('110001', '110025', { trafficFactor: 1.0 });
      const heavyTrafficDuration = calculateEnhancedDuration('110001', '110025', { trafficFactor: 2.0 });
      
      expect(heavyTrafficDuration).toBeGreaterThan(normalDuration);
    });

    test('should include loading time when specified', () => {
      const withoutLoading = calculateEnhancedDuration('110001', '110025');
      const withLoading = calculateEnhancedDuration('110001', '110025', { includeLoadingTime: true });
      
      expect(withLoading).toBeGreaterThan(withoutLoading);
    });

    test('should handle unknown vehicle types', () => {
      const duration = calculateEnhancedDuration('110001', '110025', { vehicleType: 'unknown' });
      expect(duration).toBeGreaterThan(0);
    });
  });

  describe('timeRangesOverlap', () => {
    test('should detect overlapping ranges', () => {
      const start1 = new Date('2024-01-01T10:00:00Z');
      const end1 = new Date('2024-01-01T12:00:00Z');
      const start2 = new Date('2024-01-01T11:00:00Z');
      const end2 = new Date('2024-01-01T13:00:00Z');
      
      expect(timeRangesOverlap(start1, end1, start2, end2)).toBe(true);
    });

    test('should detect non-overlapping ranges', () => {
      const start1 = new Date('2024-01-01T10:00:00Z');
      const end1 = new Date('2024-01-01T12:00:00Z');
      const start2 = new Date('2024-01-01T13:00:00Z');
      const end2 = new Date('2024-01-01T15:00:00Z');
      
      expect(timeRangesOverlap(start1, end1, start2, end2)).toBe(false);
    });

    test('should handle adjacent ranges', () => {
      const start1 = new Date('2024-01-01T10:00:00Z');
      const end1 = new Date('2024-01-01T12:00:00Z');
      const start2 = new Date('2024-01-01T12:00:00Z');
      const end2 = new Date('2024-01-01T14:00:00Z');
      
      expect(timeRangesOverlap(start1, end1, start2, end2)).toBe(false);
    });

    test('should throw error for invalid dates', () => {
      expect(() => timeRangesOverlap('invalid', new Date(), new Date(), new Date())).toThrow('Invalid date format');
    });

    test('should throw error when end time is before start time', () => {
      const start = new Date('2024-01-01T12:00:00Z');
      const end = new Date('2024-01-01T10:00:00Z');
      
      expect(() => timeRangesOverlap(start, end, new Date(), new Date())).toThrow('End time must be after start time');
    });
  });

  describe('validateFutureDate', () => {
    test('should validate future dates correctly', () => {
      const futureDate = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
      const result = validateFutureDate(futureDate);
      
      expect(result.isValid).toBe(true);
      expect(result.message).toBe('Date is valid');
    });

    test('should reject past dates', () => {
      const pastDate = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
      const result = validateFutureDate(pastDate);
      
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('must be at least');
    });

    test('should reject dates too far in future', () => {
      const farFutureDate = new Date(Date.now() + 400 * 24 * 60 * 60 * 1000); // 400 days from now
      const result = validateFutureDate(farFutureDate);
      
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('cannot be more than');
    });

    test('should handle custom validation options', () => {
      const nearFutureDate = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now
      const result = validateFutureDate(nearFutureDate, { minMinutesFromNow: 60 });
      
      expect(result.isValid).toBe(false);
    });

    test('should handle invalid date format', () => {
      const result = validateFutureDate('invalid-date');
      
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Invalid date format');
    });
  });

  describe('formatDuration', () => {
    test('should format hours correctly', () => {
      expect(formatDuration(1)).toBe('1 hour');
      expect(formatDuration(2)).toBe('2 hours');
      expect(formatDuration(24)).toBe('24 hours');
    });

    test('should format minutes correctly', () => {
      expect(formatDuration(0.5)).toBe('30 minutes');
      expect(formatDuration(0.25)).toBe('15 minutes');
      expect(formatDuration(0.1)).toBe('6 minutes');
    });

    test('should format mixed hours and minutes', () => {
      expect(formatDuration(1.5)).toBe('1 hour 30 minutes');
      expect(formatDuration(2.25)).toBe('2 hours 15 minutes');
      expect(formatDuration(0.75)).toBe('45 minutes');
    });

    test('should handle edge cases', () => {
      expect(formatDuration(0)).toBe('0 minutes');
      expect(formatDuration(-1)).toBe('Invalid duration');
      expect(formatDuration('invalid')).toBe('Invalid duration');
    });
  });
});

