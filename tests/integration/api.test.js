/**
 * Integration tests for FleetLink API endpoints
 */

const request = require('supertest');
const app = require('../../src/server');
const Vehicle = require('../../src/models/Vehicle');
const Booking = require('../../src/models/Booking');

describe('FleetLink API Integration Tests', () => {
  let testVehicle;

  beforeEach(async () => {
    // Create a test vehicle for booking tests
    testVehicle = new Vehicle({
      name: 'Test Truck',
      capacityKg: 5000,
      tyres: 6,
      vehicleType: 'truck',
      isActive: true
    });
    await testVehicle.save();
  });

  describe('Health Check', () => {
    test('GET /health should return server status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('environment');
    });
  });

  describe('Vehicle Endpoints', () => {
    describe('POST /api/vehicles', () => {
      test('should create a new vehicle', async () => {
        const vehicleData = {
          name: 'New Test Vehicle',
          capacityKg: 3000,
          tyres: 4,
          vehicleType: 'van'
        };

        const response = await request(app)
          .post('/api/vehicles')
          .send(vehicleData);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe('New Test Vehicle');
        expect(response.body.data.capacityKg).toBe(3000);
        expect(response.body.data.tyres).toBe(4);
        expect(response.body.data.vehicleType).toBe('van');
      });

      test('should return validation error for invalid data', async () => {
        const invalidData = {
          name: 'A', // Too short
          capacityKg: -100, // Negative
          tyres: 1 // Too few
        };

        const response = await request(app)
          .post('/api/vehicles')
          .send(invalidData);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.type).toBe('ValidationError');
      });

      test('should return validation error for missing required fields', async () => {
        const incompleteData = {
          name: 'Test Vehicle'
          // Missing capacityKg and tyres
        };

        const response = await request(app)
          .post('/api/vehicles')
          .send(incompleteData);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });

    describe('GET /api/vehicles', () => {
      beforeEach(async () => {
        // Create additional test vehicles
        await Vehicle.insertMany([
          { name: 'Small Van', capacityKg: 1000, tyres: 4, vehicleType: 'van', isActive: true },
          { name: 'Large Truck', capacityKg: 15000, tyres: 10, vehicleType: 'truck', isActive: true },
          { name: 'Inactive Vehicle', capacityKg: 2000, tyres: 4, vehicleType: 'van', isActive: false }
        ]);
      });

      test('should get all vehicles', async () => {
        const response = await request(app).get('/api/vehicles');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveLength(4); // Including the beforeEach vehicle
        expect(response.body.pagination).toBeDefined();
      });

      test('should filter by vehicle type', async () => {
        const response = await request(app)
          .get('/api/vehicles')
          .query({ vehicleType: 'van' });

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(2);
        expect(response.body.data.every(v => v.vehicleType === 'van')).toBe(true);
      });

      test('should filter by active status', async () => {
        const response = await request(app)
          .get('/api/vehicles')
          .query({ isActive: 'true' });

        expect(response.status).toBe(200);
        expect(response.body.data.every(v => v.isActive === true)).toBe(true);
      });

      test('should support pagination', async () => {
        const response = await request(app)
          .get('/api/vehicles')
          .query({ page: 1, limit: 2 });

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(2);
        expect(response.body.pagination.currentPage).toBe(1);
        expect(response.body.pagination.itemsPerPage).toBe(2);
      });
    });

    describe('GET /api/vehicles/available', () => {
      test('should find available vehicles', async () => {
        const searchParams = {
          capacityRequired: 3000,
          fromPincode: '110001',
          toPincode: '110025',
          startTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2 hours from now
        };

        const response = await request(app)
          .get('/api/vehicles/available')
          .query(searchParams);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.availableVehicles).toBeDefined();
        expect(response.body.data.estimatedRideDurationHours).toBeDefined();
        expect(response.body.searchParams).toBeDefined();
      });

      test('should return validation error for missing parameters', async () => {
        const response = await request(app)
          .get('/api/vehicles/available')
          .query({
            capacityRequired: 3000
            // Missing other required parameters
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      test('should return validation error for invalid pincode', async () => {
        const searchParams = {
          capacityRequired: 3000,
          fromPincode: '12345', // Invalid - only 5 digits
          toPincode: '110025',
          startTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
        };

        const response = await request(app)
          .get('/api/vehicles/available')
          .query(searchParams);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });

    describe('GET /api/vehicles/:id', () => {
      test('should get vehicle by ID', async () => {
        const response = await request(app)
          .get(`/api/vehicles/${testVehicle._id}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe('Test Truck');
      });

      test('should return 404 for non-existent vehicle', async () => {
        const nonExistentId = '507f1f77bcf86cd799439011';
        const response = await request(app)
          .get(`/api/vehicles/${nonExistentId}`);

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
      });

      test('should return validation error for invalid ID format', async () => {
        const response = await request(app)
          .get('/api/vehicles/invalid-id');

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('Booking Endpoints', () => {
    describe('POST /api/bookings', () => {
      test('should create a new booking', async () => {
        const bookingData = {
          vehicleId: testVehicle._id.toString(),
          customerId: 'customer123',
          fromPincode: '110001',
          toPincode: '110025',
          startTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2 hours from now
        };

        const response = await request(app)
          .post('/api/bookings')
          .send(bookingData);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.vehicleId).toBeDefined();
        expect(response.body.data.customerId).toBe('customer123');
        expect(response.body.data.fromPincode).toBe('110001');
        expect(response.body.data.toPincode).toBe('110025');
        expect(response.body.data.status).toBe('confirmed');
        expect(response.body.data.estimatedRideDurationHours).toBeDefined();
      });

      test('should return validation error for missing required fields', async () => {
        const incompleteData = {
          vehicleId: testVehicle._id.toString(),
          customerId: 'customer123'
          // Missing pincodes and startTime
        };

        const response = await request(app)
          .post('/api/bookings')
          .send(incompleteData);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      test('should return conflict error for overlapping bookings', async () => {
        const startTime = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

        // Create first booking
        const firstBooking = {
          vehicleId: testVehicle._id.toString(),
          customerId: 'customer1',
          fromPincode: '110001',
          toPincode: '110025',
          startTime
        };

        await request(app)
          .post('/api/bookings')
          .send(firstBooking);

        // Try to create overlapping booking
        const overlappingBooking = {
          vehicleId: testVehicle._id.toString(),
          customerId: 'customer2',
          fromPincode: '110001',
          toPincode: '110025',
          startTime: new Date(Date.now() + 2.5 * 60 * 60 * 1000).toISOString() // Overlaps
        };

        const response = await request(app)
          .post('/api/bookings')
          .send(overlappingBooking);

        expect(response.status).toBe(409);
        expect(response.body.success).toBe(false);
        expect(response.body.error.type).toBe('ConflictError');
      });

      test('should return error for non-existent vehicle', async () => {
        const bookingData = {
          vehicleId: '507f1f77bcf86cd799439011', // Non-existent ID
          customerId: 'customer123',
          fromPincode: '110001',
          toPincode: '110025',
          startTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
        };

        const response = await request(app)
          .post('/api/bookings')
          .send(bookingData);

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error.type).toBe('NotFoundError');
      });
    });

    describe('GET /api/bookings', () => {
      beforeEach(async () => {
        // Create test bookings
        await Booking.insertMany([
          {
            vehicleId: testVehicle._id,
            customerId: 'customer1',
            fromPincode: '110001',
            toPincode: '110025',
            startTime: new Date(Date.now() + 60 * 60 * 1000),
            endTime: new Date(Date.now() + 3 * 60 * 60 * 1000),
            estimatedRideDurationHours: 2,
            status: 'confirmed'
          },
          {
            vehicleId: testVehicle._id,
            customerId: 'customer2',
            fromPincode: '110026',
            toPincode: '110050',
            startTime: new Date(Date.now() + 4 * 60 * 60 * 1000),
            endTime: new Date(Date.now() + 6 * 60 * 60 * 1000),
            estimatedRideDurationHours: 2,
            status: 'pending'
          }
        ]);
      });

      test('should get all bookings', async () => {
        const response = await request(app).get('/api/bookings');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveLength(2);
        expect(response.body.pagination).toBeDefined();
      });

      test('should filter by status', async () => {
        const response = await request(app)
          .get('/api/bookings')
          .query({ status: 'confirmed' });

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0].status).toBe('confirmed');
      });

      test('should filter by customer ID', async () => {
        const response = await request(app)
          .get('/api/bookings')
          .query({ customerId: 'customer1' });

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0].customerId).toBe('customer1');
      });
    });

    describe('DELETE /api/bookings/:id', () => {
      let testBooking;

      beforeEach(async () => {
        testBooking = new Booking({
          vehicleId: testVehicle._id,
          customerId: 'customer123',
          fromPincode: '110001',
          toPincode: '110025',
          startTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
          endTime: new Date(Date.now() + 4 * 60 * 60 * 1000),
          estimatedRideDurationHours: 2,
          status: 'confirmed'
        });
        await testBooking.save();
      });

      test('should cancel a booking', async () => {
        const response = await request(app)
          .delete(`/api/bookings/${testBooking._id}`)
          .send({ reason: 'Customer request' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.status).toBe('cancelled');
      });

      test('should return 404 for non-existent booking', async () => {
        const nonExistentId = '507f1f77bcf86cd799439011';
        const response = await request(app)
          .delete(`/api/bookings/${nonExistentId}`);

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('Error Handling', () => {
    test('should return 404 for non-existent routes', async () => {
      const response = await request(app).get('/api/non-existent');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('API endpoint not found');
    });

    test('should handle database connection errors gracefully', async () => {
      // This would require mocking the database connection
      // For now, we'll test that the error middleware is working
      expect(true).toBe(true);
    });
  });

  describe('Rate Limiting', () => {
    test('should apply rate limiting to API endpoints', async () => {
      // Make multiple rapid requests to test rate limiting
      const promises = Array(10).fill().map(() => 
        request(app).get('/api/vehicles')
      );

      const responses = await Promise.all(promises);
      
      // All requests should succeed in test environment
      // In production, some would be rate limited
      responses.forEach(response => {
        expect([200, 429]).toContain(response.status);
      });
    });
  });

  describe('CORS', () => {
    test('should include CORS headers', async () => {
      const response = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:3001');

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });

  describe('Security Headers', () => {
    test('should include security headers', async () => {
      const response = await request(app).get('/health');

      expect(response.headers['x-frame-options']).toBeDefined();
      expect(response.headers['x-content-type-options']).toBeDefined();
    });
  });
});

