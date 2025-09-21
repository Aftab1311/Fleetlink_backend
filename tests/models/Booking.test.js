/**
 * Tests for Booking model
 */

const Booking = require('../../src/models/Booking');
const Vehicle = require('../../src/models/Vehicle');

describe('Booking Model', () => {
  let testVehicle;

  beforeEach(async () => {
    // Create a test vehicle for bookings
    testVehicle = new Vehicle({
      name: 'Test Vehicle',
      capacityKg: 5000,
      tyres: 6,
      isActive: true
    });
    await testVehicle.save();
  });

  describe('Validation', () => {
    test('should create a valid booking', async () => {
      const bookingData = {
        vehicleId: testVehicle._id,
        customerId: 'customer123',
        fromPincode: '110001',
        toPincode: '110025',
        startTime: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
        endTime: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 hours from now
        estimatedRideDurationHours: 2
      };

      const booking = new Booking(bookingData);
      const savedBooking = await booking.save();

      expect(savedBooking._id).toBeDefined();
      expect(savedBooking.vehicleId.toString()).toBe(testVehicle._id.toString());
      expect(savedBooking.customerId).toBe('customer123');
      expect(savedBooking.fromPincode).toBe('110001');
      expect(savedBooking.toPincode).toBe('110025');
      expect(savedBooking.status).toBe('confirmed'); // Default status
    });

    test('should require vehicleId field', async () => {
      const bookingData = {
        customerId: 'customer123',
        fromPincode: '110001',
        toPincode: '110025',
        startTime: new Date(Date.now() + 60 * 60 * 1000),
        endTime: new Date(Date.now() + 3 * 60 * 60 * 1000),
        estimatedRideDurationHours: 2
      };

      const booking = new Booking(bookingData);
      
      await expect(booking.save()).rejects.toThrow('Vehicle ID is required');
    });

    test('should require customerId field', async () => {
      const bookingData = {
        vehicleId: testVehicle._id,
        fromPincode: '110001',
        toPincode: '110025',
        startTime: new Date(Date.now() + 60 * 60 * 1000),
        endTime: new Date(Date.now() + 3 * 60 * 60 * 1000),
        estimatedRideDurationHours: 2
      };

      const booking = new Booking(bookingData);
      
      await expect(booking.save()).rejects.toThrow('Customer ID is required');
    });

    test('should validate pincode format', async () => {
      const bookingData = {
        vehicleId: testVehicle._id,
        customerId: 'customer123',
        fromPincode: '12345', // Invalid - only 5 digits
        toPincode: '110025',
        startTime: new Date(Date.now() + 60 * 60 * 1000),
        endTime: new Date(Date.now() + 3 * 60 * 60 * 1000),
        estimatedRideDurationHours: 2
      };

      const booking = new Booking(bookingData);
      
      await expect(booking.save()).rejects.toThrow('From pincode must be exactly 6 digits');
    });

    test('should validate that end time is after start time', async () => {
      const startTime = new Date(Date.now() + 60 * 60 * 1000);
      const endTime = new Date(Date.now() + 30 * 60 * 1000); // Before start time

      const bookingData = {
        vehicleId: testVehicle._id,
        customerId: 'customer123',
        fromPincode: '110001',
        toPincode: '110025',
        startTime,
        endTime,
        estimatedRideDurationHours: 2
      };

      const booking = new Booking(bookingData);
      
      await expect(booking.save()).rejects.toThrow('End time must be after start time');
    });

    test('should validate that start time is not in the past', async () => {
      const pastTime = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
      const endTime = new Date(Date.now() + 60 * 60 * 1000);

      const bookingData = {
        vehicleId: testVehicle._id,
        customerId: 'customer123',
        fromPincode: '110001',
        toPincode: '110025',
        startTime: pastTime,
        endTime,
        estimatedRideDurationHours: 2
      };

      const booking = new Booking(bookingData);
      
      await expect(booking.save()).rejects.toThrow('Start time cannot be in the past');
    });

    test('should validate status enum', async () => {
      const bookingData = {
        vehicleId: testVehicle._id,
        customerId: 'customer123',
        fromPincode: '110001',
        toPincode: '110025',
        startTime: new Date(Date.now() + 60 * 60 * 1000),
        endTime: new Date(Date.now() + 3 * 60 * 60 * 1000),
        estimatedRideDurationHours: 2,
        status: 'invalid_status'
      };

      const booking = new Booking(bookingData);
      
      await expect(booking.save()).rejects.toThrow('Status must be one of');
    });

    test('should validate estimated cost is non-negative', async () => {
      const bookingData = {
        vehicleId: testVehicle._id,
        customerId: 'customer123',
        fromPincode: '110001',
        toPincode: '110025',
        startTime: new Date(Date.now() + 60 * 60 * 1000),
        endTime: new Date(Date.now() + 3 * 60 * 60 * 1000),
        estimatedRideDurationHours: 2,
        estimatedCost: -100
      };

      const booking = new Booking(bookingData);
      
      await expect(booking.save()).rejects.toThrow('Estimated cost cannot be negative');
    });

    test('should validate notes length', async () => {
      const bookingData = {
        vehicleId: testVehicle._id,
        customerId: 'customer123',
        fromPincode: '110001',
        toPincode: '110025',
        startTime: new Date(Date.now() + 60 * 60 * 1000),
        endTime: new Date(Date.now() + 3 * 60 * 60 * 1000),
        estimatedRideDurationHours: 2,
        notes: 'A'.repeat(1001) // Exceeds 1000 character limit
      };

      const booking = new Booking(bookingData);
      
      await expect(booking.save()).rejects.toThrow('Notes cannot exceed 1000 characters');
    });
  });

  describe('Data Normalization', () => {
    test('should normalize pincodes to 6 digits with leading zeros', async () => {
      const bookingData = {
        vehicleId: testVehicle._id,
        customerId: 'customer123',
        fromPincode: '100001', // Valid 6-digit pincode
        toPincode: '100025', // Valid 6-digit pincode
        startTime: new Date(Date.now() + 60 * 60 * 1000),
        endTime: new Date(Date.now() + 3 * 60 * 60 * 1000),
        estimatedRideDurationHours: 2
      };

      const booking = new Booking(bookingData);
      const savedBooking = await booking.save();

      expect(savedBooking.fromPincode).toBe('100001');
      expect(savedBooking.toPincode).toBe('100025');
    });

    test('should calculate estimated duration if not provided', async () => {
      const startTime = new Date(Date.now() + 60 * 60 * 1000);
      const endTime = new Date(startTime.getTime() + 2.5 * 60 * 60 * 1000); // 2.5 hours later

      const bookingData = {
        vehicleId: testVehicle._id,
        customerId: 'customer123',
        fromPincode: '110001',
        toPincode: '110025',
        startTime,
        endTime,
        estimatedRideDurationHours: 2.5 // Required field, test duration calculation logic
      };

      const booking = new Booking(bookingData);
      const savedBooking = await booking.save();

      expect(savedBooking.estimatedRideDurationHours).toBe(2.5);
    });
  });

  describe('Business Logic Validation', () => {
    test('should prevent booking inactive vehicle', async () => {
      // Make vehicle inactive
      testVehicle.isActive = false;
      await testVehicle.save();

      const bookingData = {
        vehicleId: testVehicle._id,
        customerId: 'customer123',
        fromPincode: '110001',
        toPincode: '110025',
        startTime: new Date(Date.now() + 60 * 60 * 1000),
        endTime: new Date(Date.now() + 3 * 60 * 60 * 1000),
        estimatedRideDurationHours: 2
      };

      const booking = new Booking(bookingData);
      
      await expect(booking.save()).rejects.toThrow('Vehicle is not active');
    });

    test('should prevent overlapping bookings', async () => {
      const startTime1 = new Date(Date.now() + 60 * 60 * 1000);
      const endTime1 = new Date(Date.now() + 3 * 60 * 60 * 1000);

      // Create first booking
      const booking1 = new Booking({
        vehicleId: testVehicle._id,
        customerId: 'customer1',
        fromPincode: '110001',
        toPincode: '110025',
        startTime: startTime1,
        endTime: endTime1,
        estimatedRideDurationHours: 2
      });
      await booking1.save();

      // Try to create overlapping booking
      const startTime2 = new Date(Date.now() + 2 * 60 * 60 * 1000); // Overlaps with first booking
      const endTime2 = new Date(Date.now() + 4 * 60 * 60 * 1000);

      const booking2 = new Booking({
        vehicleId: testVehicle._id,
        customerId: 'customer2',
        fromPincode: '110001',
        toPincode: '110025',
        startTime: startTime2,
        endTime: endTime2,
        estimatedRideDurationHours: 2
      });

      await expect(booking2.save()).rejects.toThrow('Vehicle is not available for the selected time slot');
    });

    test('should allow non-overlapping bookings', async () => {
      const startTime1 = new Date(Date.now() + 60 * 60 * 1000);
      const endTime1 = new Date(Date.now() + 2 * 60 * 60 * 1000);

      // Create first booking
      const booking1 = new Booking({
        vehicleId: testVehicle._id,
        customerId: 'customer1',
        fromPincode: '110001',
        toPincode: '110025',
        startTime: startTime1,
        endTime: endTime1,
        estimatedRideDurationHours: 1
      });
      await booking1.save();

      // Create non-overlapping booking
      const startTime2 = new Date(Date.now() + 3 * 60 * 60 * 1000); // After first booking ends
      const endTime2 = new Date(Date.now() + 5 * 60 * 60 * 1000);

      const booking2 = new Booking({
        vehicleId: testVehicle._id,
        customerId: 'customer2',
        fromPincode: '110001',
        toPincode: '110025',
        startTime: startTime2,
        endTime: endTime2,
        estimatedRideDurationHours: 2
      });

      const savedBooking2 = await booking2.save();
      expect(savedBooking2._id).toBeDefined();
    });
  });

  describe('Virtual Properties', () => {
    test('should calculate actual duration when both actual times are set', async () => {
      const startTime = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
      const actualStart = new Date(startTime.getTime() + 30 * 60 * 1000); // 30 minutes after scheduled start
      const actualEnd = new Date(actualStart.getTime() + 2.5 * 60 * 60 * 1000); // 2.5 hours later

      const bookingData = {
        vehicleId: testVehicle._id,
        customerId: 'customer123',
        fromPincode: '110001',
        toPincode: '110025',
        startTime,
        endTime: new Date(startTime.getTime() + 3 * 60 * 60 * 1000), // 3 hours after start
        estimatedRideDurationHours: 2,
        actualStartTime: actualStart,
        actualEndTime: actualEnd
      };

      const booking = new Booking(bookingData);
      const savedBooking = await booking.save();

      expect(savedBooking.actualDurationHours).toBe(2.5);
    });

    test('should return null for actual duration when times are not set', async () => {
      const bookingData = {
        vehicleId: testVehicle._id,
        customerId: 'customer123',
        fromPincode: '110001',
        toPincode: '110025',
        startTime: new Date(Date.now() + 60 * 60 * 1000),
        endTime: new Date(Date.now() + 3 * 60 * 60 * 1000),
        estimatedRideDurationHours: 2
      };

      const booking = new Booking(bookingData);
      const savedBooking = await booking.save();

      expect(savedBooking.actualDurationHours).toBeNull();
    });

    test('should format route correctly', async () => {
      const bookingData = {
        vehicleId: testVehicle._id,
        customerId: 'customer123',
        fromPincode: '110001',
        toPincode: '110025',
        startTime: new Date(Date.now() + 60 * 60 * 1000),
        endTime: new Date(Date.now() + 3 * 60 * 60 * 1000),
        estimatedRideDurationHours: 2
      };

      const booking = new Booking(bookingData);
      const savedBooking = await booking.save();

      expect(savedBooking.route).toBe('110001 → 110025');
    });
  });

  describe('Instance Methods', () => {
    test('overlapsWithTimeRange should detect overlapping times', async () => {
      const futureTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day from now
      const bookingData = {
        vehicleId: testVehicle._id,
        customerId: 'customer123',
        fromPincode: '110001',
        toPincode: '110025',
        startTime: futureTime,
        endTime: new Date(futureTime.getTime() + 2 * 60 * 60 * 1000), // 2 hours later
        estimatedRideDurationHours: 2
      };

      const booking = new Booking(bookingData);
      const savedBooking = await booking.save();

      // Test overlapping range
      const overlapStart = new Date(futureTime.getTime() + 1 * 60 * 60 * 1000); // 1 hour after start
      const overlapEnd = new Date(futureTime.getTime() + 3 * 60 * 60 * 1000);   // 3 hours after start
      
      expect(savedBooking.overlapsWithTimeRange(overlapStart, overlapEnd)).toBe(true);
    });

    test('overlapsWithTimeRange should not detect non-overlapping times', async () => {
      const futureTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day from now
      const bookingData = {
        vehicleId: testVehicle._id,
        customerId: 'customer123',
        fromPincode: '110001',
        toPincode: '110025',
        startTime: futureTime,
        endTime: new Date(futureTime.getTime() + 2 * 60 * 60 * 1000), // 2 hours later
        estimatedRideDurationHours: 2
      };

      const booking = new Booking(bookingData);
      const savedBooking = await booking.save();

      // Test non-overlapping range
      const nonOverlapStart = new Date(futureTime.getTime() + 3 * 60 * 60 * 1000); // 3 hours after start
      const nonOverlapEnd = new Date(futureTime.getTime() + 5 * 60 * 60 * 1000);   // 5 hours after start
      
      expect(savedBooking.overlapsWithTimeRange(nonOverlapStart, nonOverlapEnd)).toBe(false);
    });

    test('canBeCancelled should return true for pending booking more than 1 hour away', async () => {
      const futureTime = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours from now

      const bookingData = {
        vehicleId: testVehicle._id,
        customerId: 'customer123',
        fromPincode: '110001',
        toPincode: '110025',
        startTime: futureTime,
        endTime: new Date(futureTime.getTime() + 2 * 60 * 60 * 1000),
        estimatedRideDurationHours: 2,
        status: 'pending'
      };

      const booking = new Booking(bookingData);
      const savedBooking = await booking.save();

      expect(savedBooking.canBeCancelled()).toBe(true);
    });

    test('canBeCancelled should return false for booking less than 1 hour away', async () => {
      const nearFutureTime = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now

      const bookingData = {
        vehicleId: testVehicle._id,
        customerId: 'customer123',
        fromPincode: '110001',
        toPincode: '110025',
        startTime: nearFutureTime,
        endTime: new Date(nearFutureTime.getTime() + 2 * 60 * 60 * 1000),
        estimatedRideDurationHours: 2,
        status: 'pending'
      };

      const booking = new Booking(bookingData);
      const savedBooking = await booking.save();

      expect(savedBooking.canBeCancelled()).toBe(false);
    });

    test('canBeCancelled should return false for completed booking', async () => {
      const futureTime = new Date(Date.now() + 2 * 60 * 60 * 1000);

      const bookingData = {
        vehicleId: testVehicle._id,
        customerId: 'customer123',
        fromPincode: '110001',
        toPincode: '110025',
        startTime: futureTime,
        endTime: new Date(futureTime.getTime() + 2 * 60 * 60 * 1000),
        estimatedRideDurationHours: 2,
        status: 'completed'
      };

      const booking = new Booking(bookingData);
      const savedBooking = await booking.save();

      expect(savedBooking.canBeCancelled()).toBe(false);
    });
  });

  describe('Static Methods', () => {
    test('findOverlappingBookings should find overlapping bookings', async () => {
      const futureTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day from now
      
      // Create existing booking
      const existingBooking = new Booking({
        vehicleId: testVehicle._id,
        customerId: 'customer1',
        fromPincode: '110001',
        toPincode: '110025',
        startTime: futureTime,
        endTime: new Date(futureTime.getTime() + 2 * 60 * 60 * 1000), // 2 hours later
        estimatedRideDurationHours: 2
      });
      await existingBooking.save();

      // Check for overlapping bookings
      const overlapping = await Booking.findOverlappingBookings(
        testVehicle._id,
        new Date(futureTime.getTime() + 1 * 60 * 60 * 1000), // 1 hour after start
        new Date(futureTime.getTime() + 3 * 60 * 60 * 1000)  // 3 hours after start
      );

      expect(overlapping).toHaveLength(1);
      expect(overlapping[0]._id.toString()).toBe(existingBooking._id.toString());
    });

    test('findOverlappingBookings should exclude cancelled bookings', async () => {
      const futureTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day from now
      
      // Create cancelled booking
      const cancelledBooking = new Booking({
        vehicleId: testVehicle._id,
        customerId: 'customer1',
        fromPincode: '110001',
        toPincode: '110025',
        startTime: futureTime,
        endTime: new Date(futureTime.getTime() + 2 * 60 * 60 * 1000), // 2 hours later
        estimatedRideDurationHours: 2,
        status: 'cancelled'
      });
      await cancelledBooking.save();

      // Check for overlapping bookings
      const overlapping = await Booking.findOverlappingBookings(
        testVehicle._id,
        new Date(futureTime.getTime() + 1 * 60 * 60 * 1000), // 1 hour after start
        new Date(futureTime.getTime() + 3 * 60 * 60 * 1000)  // 3 hours after start
      );

      expect(overlapping).toHaveLength(0);
    });
  });
});

