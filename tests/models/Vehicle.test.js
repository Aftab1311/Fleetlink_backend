/**
 * Tests for Vehicle model
 */

const Vehicle = require('../../src/models/Vehicle');

describe('Vehicle Model', () => {
  describe('Validation', () => {
    test('should create a valid vehicle', async () => {
      const vehicleData = {
        name: 'Test Truck',
        capacityKg: 5000,
        tyres: 6,
        vehicleType: 'truck'
      };

      const vehicle = new Vehicle(vehicleData);
      const savedVehicle = await vehicle.save();

      expect(savedVehicle._id).toBeDefined();
      expect(savedVehicle.name).toBe('Test Truck');
      expect(savedVehicle.capacityKg).toBe(5000);
      expect(savedVehicle.tyres).toBe(6);
      expect(savedVehicle.vehicleType).toBe('truck');
      expect(savedVehicle.isActive).toBe(true); // Default value
    });

    test('should require name field', async () => {
      const vehicleData = {
        capacityKg: 5000,
        tyres: 6
      };

      const vehicle = new Vehicle(vehicleData);
      
      await expect(vehicle.save()).rejects.toThrow('Vehicle name is required');
    });

    test('should require capacityKg field', async () => {
      const vehicleData = {
        name: 'Test Truck',
        tyres: 6
      };

      const vehicle = new Vehicle(vehicleData);
      
      await expect(vehicle.save()).rejects.toThrow('Vehicle capacity is required');
    });

    test('should require tyres field', async () => {
      const vehicleData = {
        name: 'Test Truck',
        capacityKg: 5000
      };

      const vehicle = new Vehicle(vehicleData);
      
      await expect(vehicle.save()).rejects.toThrow('Number of tyres is required');
    });

    test('should validate minimum capacity', async () => {
      const vehicleData = {
        name: 'Test Truck',
        capacityKg: 0,
        tyres: 6
      };

      const vehicle = new Vehicle(vehicleData);
      
      await expect(vehicle.save()).rejects.toThrow('Vehicle capacity must be at least 1 kg');
    });

    test('should validate maximum capacity', async () => {
      const vehicleData = {
        name: 'Test Truck',
        capacityKg: 200000,
        tyres: 6
      };

      const vehicle = new Vehicle(vehicleData);
      
      await expect(vehicle.save()).rejects.toThrow('Vehicle capacity cannot exceed 100,000 kg');
    });

    test('should validate minimum tyres', async () => {
      const vehicleData = {
        name: 'Test Vehicle',
        capacityKg: 1000,
        tyres: 1
      };

      const vehicle = new Vehicle(vehicleData);
      
      await expect(vehicle.save()).rejects.toThrow('Vehicle must have at least 2 tyres');
    });

    test('should validate maximum tyres', async () => {
      const vehicleData = {
        name: 'Test Vehicle',
        capacityKg: 1000,
        tyres: 25
      };

      const vehicle = new Vehicle(vehicleData);
      
      await expect(vehicle.save()).rejects.toThrow('Vehicle cannot have more than 20 tyres');
    });

    test('should validate vehicle type enum', async () => {
      const vehicleData = {
        name: 'Test Vehicle',
        capacityKg: 1000,
        tyres: 4,
        vehicleType: 'invalid_type'
      };

      const vehicle = new Vehicle(vehicleData);
      
      await expect(vehicle.save()).rejects.toThrow('Vehicle type must be one of');
    });

    test('should validate name length', async () => {
      const vehicleData = {
        name: 'A',
        capacityKg: 1000,
        tyres: 4
      };

      const vehicle = new Vehicle(vehicleData);
      
      await expect(vehicle.save()).rejects.toThrow('Vehicle name must be at least 2 characters long');
    });

    test('should validate name maximum length', async () => {
      const vehicleData = {
        name: 'A'.repeat(101),
        capacityKg: 1000,
        tyres: 4
      };

      const vehicle = new Vehicle(vehicleData);
      
      await expect(vehicle.save()).rejects.toThrow('Vehicle name cannot exceed 100 characters');
    });

    test('should validate registration number format', async () => {
      const vehicleData = {
        name: 'Test Vehicle',
        capacityKg: 1000,
        tyres: 4,
        registrationNumber: 'invalid@registration'
      };

      const vehicle = new Vehicle(vehicleData);
      
      await expect(vehicle.save()).rejects.toThrow('Registration number can only contain letters, numbers, hyphens and spaces');
    });

    test('should ensure unique registration numbers', async () => {
      const vehicleData1 = {
        name: 'Test Vehicle 1',
        capacityKg: 1000,
        tyres: 4,
        registrationNumber: 'ABC123'
      };

      const vehicleData2 = {
        name: 'Test Vehicle 2',
        capacityKg: 2000,
        tyres: 6,
        registrationNumber: 'ABC123'
      };

      const vehicle1 = new Vehicle(vehicleData1);
      await vehicle1.save();

      const vehicle2 = new Vehicle(vehicleData2);
      await expect(vehicle2.save()).rejects.toThrow();
    });
  });

  describe('Data Normalization', () => {
    test('should normalize name by trimming and collapsing spaces', async () => {
      const vehicleData = {
        name: '  Test   Truck  ',
        capacityKg: 5000,
        tyres: 6
      };

      const vehicle = new Vehicle(vehicleData);
      const savedVehicle = await vehicle.save();

      expect(savedVehicle.name).toBe('Test Truck');
    });

    test('should convert vehicle type to lowercase', async () => {
      const vehicleData = {
        name: 'Test Vehicle',
        capacityKg: 1000,
        tyres: 4,
        vehicleType: 'TRUCK'
      };

      const vehicle = new Vehicle(vehicleData);
      const savedVehicle = await vehicle.save();

      expect(savedVehicle.vehicleType).toBe('truck');
    });

    test('should convert registration number to uppercase', async () => {
      const vehicleData = {
        name: 'Test Vehicle',
        capacityKg: 1000,
        tyres: 4,
        registrationNumber: 'abc123'
      };

      const vehicle = new Vehicle(vehicleData);
      const savedVehicle = await vehicle.save();

      expect(savedVehicle.registrationNumber).toBe('ABC123');
    });

    test('should ensure capacity and tyres are integers', async () => {
      const vehicleData = {
        name: 'Test Vehicle',
        capacityKg: 1000.7,
        tyres: 4.3
      };

      const vehicle = new Vehicle(vehicleData);
      const savedVehicle = await vehicle.save();

      expect(savedVehicle.capacityKg).toBe(1000);
      expect(savedVehicle.tyres).toBe(4);
    });
  });

  describe('Virtual Properties', () => {
    test('should calculate capacity in tons', async () => {
      const vehicleData = {
        name: 'Test Vehicle',
        capacityKg: 5000,
        tyres: 6
      };

      const vehicle = new Vehicle(vehicleData);
      const savedVehicle = await vehicle.save();

      expect(savedVehicle.capacityTons).toBe(5);
    });

    test('should round capacity in tons to 2 decimal places', async () => {
      const vehicleData = {
        name: 'Test Vehicle',
        capacityKg: 1234,
        tyres: 4
      };

      const vehicle = new Vehicle(vehicleData);
      const savedVehicle = await vehicle.save();

      expect(savedVehicle.capacityTons).toBe(1.23);
    });
  });

  describe('Instance Methods', () => {
    test('canHandleCapacity should return true for sufficient capacity', async () => {
      const vehicleData = {
        name: 'Test Vehicle',
        capacityKg: 5000,
        tyres: 6,
        isActive: true
      };

      const vehicle = new Vehicle(vehicleData);
      const savedVehicle = await vehicle.save();

      expect(savedVehicle.canHandleCapacity(3000)).toBe(true);
      expect(savedVehicle.canHandleCapacity(5000)).toBe(true);
    });

    test('canHandleCapacity should return false for insufficient capacity', async () => {
      const vehicleData = {
        name: 'Test Vehicle',
        capacityKg: 5000,
        tyres: 6,
        isActive: true
      };

      const vehicle = new Vehicle(vehicleData);
      const savedVehicle = await vehicle.save();

      expect(savedVehicle.canHandleCapacity(6000)).toBe(false);
    });

    test('canHandleCapacity should return false for inactive vehicles', async () => {
      const vehicleData = {
        name: 'Test Vehicle',
        capacityKg: 5000,
        tyres: 6,
        isActive: false
      };

      const vehicle = new Vehicle(vehicleData);
      const savedVehicle = await vehicle.save();

      expect(savedVehicle.canHandleCapacity(3000)).toBe(false);
    });
  });

  describe('Static Methods', () => {
    test('findByMinCapacity should find vehicles with sufficient capacity', async () => {
      const vehicles = [
        { name: 'Small Vehicle', capacityKg: 1000, tyres: 4, isActive: true },
        { name: 'Medium Vehicle', capacityKg: 5000, tyres: 6, isActive: true },
        { name: 'Large Vehicle', capacityKg: 10000, tyres: 8, isActive: true },
        { name: 'Inactive Vehicle', capacityKg: 15000, tyres: 10, isActive: false }
      ];

      await Vehicle.insertMany(vehicles);

      const results = await Vehicle.findByMinCapacity(5000);

      expect(results).toHaveLength(2);
      expect(results[0].capacityKg).toBeGreaterThanOrEqual(5000);
      expect(results[1].capacityKg).toBeGreaterThanOrEqual(5000);
      
      // Should be sorted by capacity (ascending)
      expect(results[0].capacityKg).toBeLessThanOrEqual(results[1].capacityKg);
    });

    test('findByMinCapacity should only return active vehicles', async () => {
      const vehicles = [
        { name: 'Active Vehicle', capacityKg: 5000, tyres: 6, isActive: true },
        { name: 'Inactive Vehicle', capacityKg: 10000, tyres: 8, isActive: false }
      ];

      await Vehicle.insertMany(vehicles);

      const results = await Vehicle.findByMinCapacity(3000);

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Active Vehicle');
    });
  });

  describe('JSON Transformation', () => {
    test('should transform _id to id in JSON output', async () => {
      const vehicleData = {
        name: 'Test Vehicle',
        capacityKg: 1000,
        tyres: 4
      };

      const vehicle = new Vehicle(vehicleData);
      const savedVehicle = await vehicle.save();
      const jsonOutput = savedVehicle.toJSON();

      expect(jsonOutput.id).toBeDefined();
      expect(jsonOutput._id).toBeUndefined();
      expect(jsonOutput.__v).toBeUndefined();
    });
  });
});

